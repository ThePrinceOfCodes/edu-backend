"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runPiTest = exports.runDocumentAiTest = exports.listPendingReviewExtractions = exports.getExtractionById = exports.processExtraction = exports.createExtractionJob = exports.saveUpload = exports.serializeExtraction = exports.buildExtractionImageUrl = void 0;
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const http_status_1 = __importDefault(require("http-status"));
const errors_1 = require("../errors");
const logger_1 = require("../logger");
const config_1 = __importDefault(require("../../config/config"));
const attendant_extraction_model_1 = __importDefault(require("./attendant-extraction.model"));
const attendant_extraction_queue_1 = require("./attendant-extraction.queue");
const attendant_preprocess_service_1 = require("./attendant-preprocess.service");
const document_ai_service_1 = require("./document-ai.service");
const pi_agent_extraction_service_1 = require("./pi-agent-extraction.service");
const attendance_validation_service_1 = require("./attendance-validation.service");
const push_notification_1 = require("../push-notification");
const prompts_1 = require("./prompts");
const attendant_parser_service_1 = require("./attendant-parser.service");
const attendant_attendance_service_1 = require("./attendant-attendance.service");
const buildStoredFileName = (file) => {
    const originalExtension = path_1.default.extname(file.originalname || '').toLowerCase();
    if (originalExtension) {
        return `${file.filename}${originalExtension}`;
    }
    const extensionByMimeType = {
        'image/png': '.png',
        'image/jpeg': '.jpg',
        'image/webp': '.webp',
        'image/tiff': '.tiff',
        'application/pdf': '.pdf',
    };
    return `${file.filename}${extensionByMimeType[file.mimetype] || ''}`;
};
const normalizePublicFilePath = (filePath) => {
    if (!filePath) {
        return null;
    }
    const normalized = filePath.replace(/\\/g, '/').trim();
    const fileName = path_1.default.basename(normalized);
    if (!fileName) {
        return null;
    }
    return `uploads/attendant-extractions/${fileName}`;
};
const buildOcrSummary = (documentAiOutput) => {
    const parsed = (0, attendant_parser_service_1.parseAttendantDocument)(documentAiOutput);
    return {
        pageCount: Array.isArray(documentAiOutput === null || documentAiOutput === void 0 ? void 0 : documentAiOutput.pages) ? documentAiOutput.pages.length : 0,
        tableCount: Array.isArray(documentAiOutput === null || documentAiOutput === void 0 ? void 0 : documentAiOutput.pages)
            ? documentAiOutput.pages.reduce((count, page) => { var _a; return count + (((_a = page === null || page === void 0 ? void 0 : page.tables) === null || _a === void 0 ? void 0 : _a.length) || 0); }, 0)
            : 0,
        formFieldCount: Array.isArray(documentAiOutput === null || documentAiOutput === void 0 ? void 0 : documentAiOutput.pages)
            ? documentAiOutput.pages.reduce((count, page) => { var _a; return count + (((_a = page === null || page === void 0 ? void 0 : page.formFields) === null || _a === void 0 ? void 0 : _a.length) || 0); }, 0)
            : 0,
        totalRows: parsed.sheetMeta['totalRows'],
        confidentRows: parsed.sheetMeta['confidentRows'],
        unmatchedRowCount: parsed.sheetMeta['unmatchedRows'],
        detectedHeaders: ['Name', 'No.', 'Admission', 'Status', 'Week ending'],
        candidateRows: parsed.rows.slice(0, 15).map((row) => ({
            rowNumber: row.rowNumber,
            studentName: row.studentName,
            admissionNumber: row.admissionNumber,
            statusMarks: row.statusMarks,
            confidence: row.confidence,
            source: row.source,
        })),
    };
};
const buildExtractionImageUrl = (filePath, publicBaseUrl) => {
    const publicPath = normalizePublicFilePath(filePath);
    if (!publicPath) {
        return null;
    }
    const baseUrl = String(publicBaseUrl || config_1.default.server || '').replace(/\/$/, '');
    if (!baseUrl) {
        return `/${publicPath}`;
    }
    return `${baseUrl}/${publicPath}`;
};
exports.buildExtractionImageUrl = buildExtractionImageUrl;
const serializeExtraction = (extraction, publicBaseUrl) => {
    const json = typeof extraction.toJSON === 'function' ? extraction.toJSON() : extraction;
    return Object.assign(Object.assign({}, json), { imageUrl: (0, exports.buildExtractionImageUrl)(json.imagePath || json.originalImagePath, publicBaseUrl) });
};
exports.serializeExtraction = serializeExtraction;
const saveUpload = async (file) => {
    if (!file) {
        throw new errors_1.ApiError(http_status_1.default.BAD_REQUEST, 'Image file is required');
    }
    await promises_1.default.mkdir(config_1.default.attendantUploadsDir, { recursive: true });
    const targetPath = path_1.default.join(config_1.default.attendantUploadsDir, buildStoredFileName(file));
    if (file.path !== targetPath) {
        await promises_1.default.rename(file.path, targetPath);
    }
    return {
        originalImagePath: targetPath,
        mimeType: file.mimetype || 'application/octet-stream',
    };
};
exports.saveUpload = saveUpload;
const createExtractionJob = async (upload, context) => {
    const extraction = await attendant_extraction_model_1.default.create({
        createdBy: context.createdBy || null,
        imagePath: upload.originalImagePath,
        originalImagePath: upload.originalImagePath,
        mimeType: upload.mimeType,
        schoolId: context.schoolId,
        termId: context.termId,
        academicSessionId: context.academicSessionId,
        startDate: context.startDate,
        endDate: context.endDate,
        status: 'queued',
    });
    await attendant_extraction_queue_1.attendantExtractionQueue.add(attendant_extraction_queue_1.attendantExtractionJobName, { extractionId: extraction['_id'] }, attendant_extraction_queue_1.attendantExtractionJobOptions);
    return extraction;
};
exports.createExtractionJob = createExtractionJob;
const isRetryableExtractionError = (error) => {
    const message = error instanceof Error ? error.message : String(error);
    return /rate limit|429|quota|RESOURCE_EXHAUSTED|DEADLINE_EXCEEDED/i.test(message);
};
const processExtraction = async (extractionId) => {
    var _a, _b;
    const extraction = await attendant_extraction_model_1.default.findById(extractionId);
    if (!extraction)
        throw new errors_1.ApiError(http_status_1.default.NOT_FOUND, 'Extraction not found');
    try {
        extraction.status = 'processing';
        extraction.processingMeta = Object.assign(Object.assign({}, (extraction.processingMeta || {})), { stage: extraction.rawOcrJson ? 'pi_pending' : 'document_ai_pending', retryCount: Number(((_a = extraction.processingMeta) === null || _a === void 0 ? void 0 : _a.retryCount) || 0) });
        extraction.error = undefined;
        await extraction.save();
        let documentAiOutput = extraction.rawOcrJson || undefined;
        let ocrSummary = (_b = extraction.processingMeta) === null || _b === void 0 ? void 0 : _b['ocrSummary'];
        if (!documentAiOutput) {
            const preprocessedImagePath = extraction.preprocessedImagePath || await (0, attendant_preprocess_service_1.preprocessAttendantImage)(extraction.originalImagePath);
            extraction.preprocessedImagePath = preprocessedImagePath;
            try {
                documentAiOutput = await (0, document_ai_service_1.processDocument)(preprocessedImagePath, extraction.mimeType);
            }
            catch (error) {
                if ((0, document_ai_service_1.isDocumentAiInvalidArgumentError)(error)) {
                    logger_1.logger.warn('[DocumentAI] Preprocessed file rejected, retrying with original upload');
                    documentAiOutput = await (0, document_ai_service_1.processDocument)(extraction.originalImagePath, extraction.mimeType);
                }
                else if (isRetryableExtractionError(error)) {
                    extraction.processingMeta = Object.assign(Object.assign({}, (extraction.processingMeta || {})), { stage: 'document_ai_pending', lastRateLimitError: error instanceof Error ? error.message : String(error) });
                    await extraction.save();
                    throw error;
                }
                else {
                    throw error;
                }
            }
            const layoutSummary = (0, document_ai_service_1.buildDocumentAiLayoutSummary)(documentAiOutput || {});
            ocrSummary = buildOcrSummary(documentAiOutput || {});
            extraction.rawOcrJson = (documentAiOutput || {});
            extraction.rawText = (documentAiOutput === null || documentAiOutput === void 0 ? void 0 : documentAiOutput['text']) || '';
            extraction.documentAiRawOutput = (documentAiOutput || {});
            extraction.documentAiText = (documentAiOutput === null || documentAiOutput === void 0 ? void 0 : documentAiOutput['text']) || '';
            extraction.documentAiLayoutSummary = layoutSummary;
            extraction.processingMeta = Object.assign(Object.assign({}, (extraction.processingMeta || {})), { stage: 'ocr_completed', ocrSummary });
            extraction.status = 'ocr_completed';
            extraction.validationErrors = [];
            await extraction.save();
        }
        else if (!ocrSummary) {
            ocrSummary = buildOcrSummary(documentAiOutput || {});
            extraction.processingMeta = Object.assign(Object.assign({}, (extraction.processingMeta || {})), { ocrSummary });
            await extraction.save();
        }
        if (!config_1.default.attendanceExtraction.usePi) {
            return extraction;
        }
        let piResult;
        try {
            piResult = await (0, pi_agent_extraction_service_1.extractAttendanceWithPi)({
                imagePath: extraction.originalImagePath,
                mimeType: extraction.mimeType,
                ocrSummary: ocrSummary || {},
            });
        }
        catch (error) {
            if (isRetryableExtractionError(error)) {
                extraction.processingMeta = Object.assign(Object.assign({}, (extraction.processingMeta || {})), { stage: 'pi_pending', lastRateLimitError: error instanceof Error ? error.message : String(error) });
                await extraction.save();
            }
            throw error;
        }
        extraction.llmRawResponse = piResult.rawResponse;
        extraction.provider = piResult.provider;
        extraction.set('model', piResult.model);
        extraction.processingMeta = Object.assign(Object.assign({}, (extraction.processingMeta || {})), { promptVersion: piResult.promptVersion, stage: 'validation_pending' });
        let validation = (0, attendance_validation_service_1.validateRawAttendanceExtraction)(piResult.rawResponse);
        if (!validation.isValid) {
            const repairedResponse = await (0, pi_agent_extraction_service_1.repairAttendanceJsonWithPi)(piResult.rawResponse, {
                imagePath: extraction.originalImagePath,
                mimeType: extraction.mimeType,
                ocrSummary: ocrSummary || {},
            });
            extraction.llmRawResponse = repairedResponse;
            validation = (0, attendance_validation_service_1.validateRawAttendanceExtraction)(repairedResponse);
        }
        if (!validation.isValid) {
            extraction.validationErrors = validation.errors;
            extraction.status = 'validation_failed';
            await extraction.save();
            return extraction;
        }
        extraction.llmExtractedOutput = validation.data;
        extraction.validationErrors = [];
        const createdAttendance = await (0, attendant_attendance_service_1.createAttendanceFromExtractionPayload)({
            schoolId: extraction.schoolId,
            termId: extraction.termId,
            academicSessionId: extraction.academicSessionId,
            startDate: new Date(extraction.startDate),
            endDate: new Date(extraction.endDate),
            students: validation.data.students.map((student) => ({
                admission_number: student.admission_number,
                student_name: student.student_name,
                attendance: student.attendance,
            })),
        });
        extraction.createdAttendanceIds = createdAttendance.map((item) => String(item.id || item._id)).filter(Boolean);
        extraction.status = 'pending_review';
        await extraction.save();
        await push_notification_1.pushNotificationService.sendAttendanceReviewAlert(extraction);
        return extraction;
    }
    catch (error) {
        extraction.status = 'failed';
        extraction.error = error instanceof Error ? error.message : 'Extraction failed';
        await extraction.save();
        logger_1.logger.error(error);
        throw error;
    }
};
exports.processExtraction = processExtraction;
const getExtractionById = (id) => attendant_extraction_model_1.default.findById(id);
exports.getExtractionById = getExtractionById;
const listPendingReviewExtractions = (options) => attendant_extraction_model_1.default.paginate({ status: { $in: ['ocr_completed', 'pending_review', 'corrected'] } }, options);
exports.listPendingReviewExtractions = listPendingReviewExtractions;
const cleanupFiles = async (filePaths) => {
    await Promise.all(filePaths.map(async (filePath) => {
        if (!filePath) {
            return;
        }
        try {
            await promises_1.default.unlink(filePath);
        }
        catch (_a) {
            // best-effort cleanup for test endpoints
        }
    }));
};
const runDocumentAiTest = async (file, options) => {
    const upload = await (0, exports.saveUpload)(file);
    const preprocessedImagePath = await (0, attendant_preprocess_service_1.preprocessAttendantImage)(upload.originalImagePath);
    try {
        let documentAiOutput;
        try {
            documentAiOutput = await (0, document_ai_service_1.processDocument)(preprocessedImagePath, upload.mimeType);
        }
        catch (error) {
            if (!(0, document_ai_service_1.isDocumentAiInvalidArgumentError)(error)) {
                throw error;
            }
            logger_1.logger.warn('[DocumentAI] Test preprocessed file rejected, retrying with original upload');
            documentAiOutput = await (0, document_ai_service_1.processDocument)(upload.originalImagePath, upload.mimeType);
        }
        const layoutSummary = (0, document_ai_service_1.buildDocumentAiLayoutSummary)(documentAiOutput);
        const ocrSummary = buildOcrSummary(documentAiOutput);
        return {
            documentAi: {
                text: (documentAiOutput === null || documentAiOutput === void 0 ? void 0 : documentAiOutput.text) || '',
                layoutSummary,
                ocrSummary,
                rawAvailable: Boolean(options === null || options === void 0 ? void 0 : options.includeRaw),
                raw: (options === null || options === void 0 ? void 0 : options.includeRaw) ? documentAiOutput : undefined,
            },
        };
    }
    finally {
        await cleanupFiles([upload.originalImagePath, preprocessedImagePath]);
    }
};
exports.runDocumentAiTest = runDocumentAiTest;
const runPiTest = async (file, options) => {
    const upload = await (0, exports.saveUpload)(file);
    const promptUsed = (options === null || options === void 0 ? void 0 : options.prompt) || prompts_1.ATTENDANCE_EXTRACTION_PROMPT;
    try {
        const piResult = await (0, pi_agent_extraction_service_1.extractAttendanceWithPi)({
            imagePath: upload.originalImagePath,
            mimeType: upload.mimeType,
            ocrSummary: (options === null || options === void 0 ? void 0 : options.ocrSummary) || {
                documentAiText: (options === null || options === void 0 ? void 0 : options.ocrText) || '',
                documentAiLayoutSummary: (options === null || options === void 0 ? void 0 : options.ocrLayoutSummary) || {},
            },
        });
        const validation = (0, attendance_validation_service_1.validateRawAttendanceExtraction)(piResult.rawResponse);
        return {
            pi: {
                enabled: true,
                provider: piResult.provider,
                model: piResult.model,
                promptUsed,
                rawResponse: (options === null || options === void 0 ? void 0 : options.includeRawResponse) ? piResult.rawResponse : undefined,
                parsedValid: validation.isValid,
                validationErrors: (options === null || options === void 0 ? void 0 : options.includeValidationErrors) === false ? [] : validation.errors,
                parsedOutput: validation.isValid ? validation.data : undefined,
            },
        };
    }
    finally {
        await cleanupFiles([upload.originalImagePath]);
    }
};
exports.runPiTest = runPiTest;
//# sourceMappingURL=attendant-extraction.service.js.map