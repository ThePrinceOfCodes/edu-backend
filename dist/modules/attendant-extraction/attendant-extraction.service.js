"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getExtractionById = exports.processExtraction = exports.createExtractionJob = exports.saveUpload = void 0;
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const http_status_1 = __importDefault(require("http-status"));
const errors_1 = require("../errors");
const config_1 = __importDefault(require("../../config/config"));
const attendant_extraction_model_1 = __importDefault(require("./attendant-extraction.model"));
const attendant_extraction_queue_1 = require("./attendant-extraction.queue");
const attendant_preprocess_service_1 = require("./attendant-preprocess.service");
const document_ai_service_1 = require("./document-ai.service");
const attendant_parser_service_1 = require("./attendant-parser.service");
const attendant_attendance_service_1 = require("./attendant-attendance.service");
const attendant_review_service_1 = require("../attendant-review/attendant-review.service");
const attendant_dates_util_1 = require("./attendant-dates.util");
const saveUpload = async (file) => {
    if (!file) {
        throw new errors_1.ApiError(http_status_1.default.BAD_REQUEST, 'Image file is required');
    }
    await promises_1.default.mkdir(config_1.default.attendantUploadsDir, { recursive: true });
    const targetPath = path_1.default.join(config_1.default.attendantUploadsDir, file.filename || `${Date.now()}-${file.originalname}`);
    if (file.path !== targetPath) {
        await promises_1.default.rename(file.path, targetPath);
    }
    return targetPath;
};
exports.saveUpload = saveUpload;
const createExtractionJob = async (imagePath, context) => {
    const extraction = await attendant_extraction_model_1.default.create({
        imagePath,
        schoolId: context.schoolId,
        termId: context.termId,
        academicSessionId: context.academicSessionId,
        startDate: context.startDate,
        endDate: context.endDate,
        status: 'queued',
    });
    await attendant_extraction_queue_1.attendantExtractionQueue.add(attendant_extraction_queue_1.attendantExtractionJobName, { extractionId: extraction['_id'] });
    return extraction;
};
exports.createExtractionJob = createExtractionJob;
const processExtraction = async (extractionId) => {
    var _a;
    const extraction = await attendant_extraction_model_1.default.findById(extractionId);
    if (!extraction)
        throw new errors_1.ApiError(http_status_1.default.NOT_FOUND, 'Extraction not found');
    extraction.status = 'processing';
    await extraction.save();
    const preprocessedImagePath = await (0, attendant_preprocess_service_1.preprocessAttendantImage)(extraction.imagePath);
    extraction.preprocessedImagePath = preprocessedImagePath;
    const preprocessedDocument = await (0, document_ai_service_1.processDocument)(preprocessedImagePath);
    let parsed = (0, attendant_parser_service_1.parseAttendantDocument)(preprocessedDocument);
    let originalDocument = null;
    if ((0, attendant_parser_service_1.shouldRunFallbackOcr)(parsed)) {
        originalDocument = await (0, document_ai_service_1.processDocument)(extraction.imagePath);
        parsed = (0, attendant_parser_service_1.mergeParsedDocuments)(preprocessedDocument, originalDocument);
    }
    extraction.rawOcrJson = {
        preprocessed: preprocessedDocument,
        original: originalDocument,
    };
    extraction.rawText = (preprocessedDocument === null || preprocessedDocument === void 0 ? void 0 : preprocessedDocument.text) || (originalDocument === null || originalDocument === void 0 ? void 0 : originalDocument.text) || '';
    extraction.parsedJson = parsed;
    extraction.status = 'parsed';
    await extraction.save();
    const workingDays = (0, attendant_dates_util_1.getWorkingDays)(extraction.startDate, extraction.endDate);
    const createdAttendance = await (0, attendant_attendance_service_1.createAttendanceFromParsedRows)({
        schoolId: extraction.schoolId,
        termId: extraction.termId,
        academicSessionId: extraction.academicSessionId,
        workingDays,
        rows: (parsed.rows || []),
    }).catch(() => []);
    extraction.createdAttendanceIds = createdAttendance.map((item) => item['_id']);
    const pendingReviews = [];
    for (const row of parsed.unmatchedRows || []) {
        const review = await (0, attendant_review_service_1.createReview)({
            schoolId: extraction.schoolId,
            extractionId: extraction['_id'],
            sourceImagePath: extraction.imagePath,
            rawRow: row,
            parsedAttempt: row,
            reason: 'Could not confidently match student',
            confidence: (_a = row.confidence) !== null && _a !== void 0 ? _a : 0,
            resolvedStatus: 'pending',
        });
        pendingReviews.push(review);
    }
    extraction.pendingReviewIds = pendingReviews.map((item) => item['_id']);
    extraction.status = pendingReviews.length ? 'needs_review' : 'attendance_created';
    await extraction.save();
    return extraction;
};
exports.processExtraction = processExtraction;
const getExtractionById = (id) => attendant_extraction_model_1.default.findById(id);
exports.getExtractionById = getExtractionById;
//# sourceMappingURL=attendant-extraction.service.js.map