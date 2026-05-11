import fs from 'fs/promises';
import path from 'path';
import httpStatus from 'http-status';
import { ApiError } from '../errors';
import { logger } from '../logger';
import config from '../../config/config';
import AttendantExtraction from './attendant-extraction.model';
import { IAttendantExtractionApiResponse, IAttendantExtractionDoc } from './attendant-extraction.interfaces';
import { attendantExtractionJobName, attendantExtractionJobOptions, attendantExtractionQueue } from './attendant-extraction.queue';
import { preprocessAttendantImage } from './attendant-preprocess.service';
import { buildDocumentAiLayoutSummary, isDocumentAiInvalidArgumentError, processDocument } from './document-ai.service';
import { extractAttendanceWithPi, repairAttendanceJsonWithPi } from './pi-agent-extraction.service';
import { validateRawAttendanceExtraction } from './attendance-validation.service';
import { pushNotificationService } from '../push-notification';
import { ATTENDANCE_EXTRACTION_PROMPT } from './prompts';
import { parseAttendantDocument } from './attendant-parser.service';
import { createAttendanceFromExtractionPayload } from './attendant-attendance.service';

const buildStoredFileName = (file: any) => {
  const originalExtension = path.extname(file.originalname || '').toLowerCase();
  if (originalExtension) {
    return `${file.filename}${originalExtension}`;
  }

  const extensionByMimeType: Record<string, string> = {
    'image/png': '.png',
    'image/jpeg': '.jpg',
    'image/webp': '.webp',
    'image/tiff': '.tiff',
    'application/pdf': '.pdf',
  };

  return `${file.filename}${extensionByMimeType[file.mimetype] || ''}`;
};

const resolveStoragePath = (filePath: string) => (path.isAbsolute(filePath) ? filePath : path.resolve(process.cwd(), filePath));

const normalizePublicFilePath = (filePath?: string | null) => {
  if (!filePath) {
    return null;
  }

  const normalized = filePath.replace(/\\/g, '/').trim();
  const fileName = path.basename(normalized);
  if (!fileName) {
    return null;
  }

  return `uploads/attendant-extractions/${fileName}`;
};

const buildOcrSummary = (documentAiOutput: any) => {
  const parsed = parseAttendantDocument(documentAiOutput);

  return {
    pageCount: Array.isArray(documentAiOutput?.pages) ? documentAiOutput.pages.length : 0,
    tableCount: Array.isArray(documentAiOutput?.pages)
      ? documentAiOutput.pages.reduce((count: number, page: any) => count + (page?.tables?.length || 0), 0)
      : 0,
    formFieldCount: Array.isArray(documentAiOutput?.pages)
      ? documentAiOutput.pages.reduce((count: number, page: any) => count + (page?.formFields?.length || 0), 0)
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

export const buildExtractionImageUrl = (filePath?: string | null, publicBaseUrl?: string | null) => {
  const publicPath = normalizePublicFilePath(filePath);
  if (!publicPath) {
    return null;
  }

  const baseUrl = String(publicBaseUrl || config.server || '').replace(/\/$/, '');
  if (!baseUrl) {
    return `/${publicPath}`;
  }

  return `${baseUrl}/${publicPath}`;
};

export const serializeExtraction = (extraction: IAttendantExtractionDoc | any, publicBaseUrl?: string | null): IAttendantExtractionApiResponse => {
  const json = typeof extraction.toJSON === 'function' ? extraction.toJSON() : extraction;

  return {
    ...json,
    imageUrl: buildExtractionImageUrl(json.imagePath || json.originalImagePath, publicBaseUrl),
  };
};

export const saveUpload = async (file: any) => {
  if (!file) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Image file is required');
  }

  const uploadDir = resolveStoragePath(config.attendantUploadsDir);
  await fs.mkdir(uploadDir, { recursive: true });
  const targetPath = path.join(uploadDir, buildStoredFileName(file));
  if (file.path !== targetPath) {
    await fs.rename(file.path, targetPath);
  }

  return {
    originalImagePath: targetPath,
    mimeType: file.mimetype || 'application/octet-stream',
  };
};

export const createExtractionJob = async (
  upload: { originalImagePath: string; mimeType: string },
  context: { createdBy?: string; schoolId: string; termId?: string; academicSessionId?: string; startDate: Date; endDate: Date },
) => {
  const extraction = await AttendantExtraction.create({
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
  await attendantExtractionQueue.add(attendantExtractionJobName, { extractionId: extraction['_id'] as unknown as string }, attendantExtractionJobOptions);
  return extraction;
};

const isRetryableExtractionError = (error: unknown): boolean => {
  const message = error instanceof Error ? error.message : String(error);
  return /rate limit|429|quota|RESOURCE_EXHAUSTED|DEADLINE_EXCEEDED/i.test(message);
};

export const processExtraction = async (extractionId: string) => {
  const extraction = await AttendantExtraction.findById(extractionId);
  if (!extraction) throw new ApiError(httpStatus.NOT_FOUND, 'Extraction not found');

  try {
    extraction.status = 'processing';
    extraction.processingMeta = {
      ...(extraction.processingMeta || {}),
      stage: extraction.rawOcrJson ? 'pi_pending' : 'document_ai_pending',
      retryCount: Number((extraction.processingMeta as any)?.retryCount || 0),
    } as any;
    extraction.error = undefined as unknown as string;
    await extraction.save();

    let documentAiOutput: Record<string, any> | null | undefined = extraction.rawOcrJson || undefined;
    let ocrSummary = extraction.processingMeta?.['ocrSummary'] as Record<string, any> | undefined;

    if (!documentAiOutput) {
      const preprocessedImagePath = extraction.preprocessedImagePath || await preprocessAttendantImage(extraction.originalImagePath);
      extraction.preprocessedImagePath = preprocessedImagePath;

      try {
        documentAiOutput = await processDocument(preprocessedImagePath, extraction.mimeType);
      } catch (error) {
        if (isDocumentAiInvalidArgumentError(error)) {
          logger.warn('[DocumentAI] Preprocessed file rejected, retrying with original upload');
          documentAiOutput = await processDocument(extraction.originalImagePath, extraction.mimeType);
        } else if (error instanceof Error && /timed out/i.test(error.message)) {
          logger.warn('[DocumentAI] Preprocessed file timed out, retrying with original upload');
          documentAiOutput = await processDocument(extraction.originalImagePath, extraction.mimeType);
        } else if (isRetryableExtractionError(error)) {
          extraction.processingMeta = {
            ...(extraction.processingMeta || {}),
            stage: 'document_ai_pending',
            lastRateLimitError: error instanceof Error ? error.message : String(error),
          } as any;
          await extraction.save();
          throw error;
        } else {
          throw error;
        }
      }

      const layoutSummary = buildDocumentAiLayoutSummary(documentAiOutput || {});
      ocrSummary = buildOcrSummary(documentAiOutput || {});

      extraction.rawOcrJson = (documentAiOutput || {}) as any;
      extraction.rawText = documentAiOutput?.['text'] || '';
      extraction.documentAiRawOutput = (documentAiOutput || {}) as any;
      extraction.documentAiText = documentAiOutput?.['text'] || '';
      extraction.documentAiLayoutSummary = layoutSummary as any;
      extraction.processingMeta = {
        ...(extraction.processingMeta || {}),
        stage: 'ocr_completed',
        ocrSummary,
      } as any;
      extraction.status = 'ocr_completed';
      extraction.validationErrors = [];
      await extraction.save();

    } else if (!ocrSummary) {
      ocrSummary = buildOcrSummary(documentAiOutput || {});
      extraction.processingMeta = {
        ...(extraction.processingMeta || {}),
        ocrSummary,
      } as any;
      await extraction.save();
    }

    if (!config.attendanceExtraction.usePi) {
      return extraction;
    }

    let piResult;
    try {
      piResult = await extractAttendanceWithPi({
        imagePath: extraction.originalImagePath,
        mimeType: extraction.mimeType,
        ocrSummary: ocrSummary || {},
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const isRetryable = isRetryableExtractionError(error);

      logger.warn(`[attendant-extraction] Pi extraction failed: ${errorMessage}`);

      extraction.processingMeta = {
        ...(extraction.processingMeta || {}),
        stage: isRetryable ? 'pi_pending' : 'needs_review',
        piError: errorMessage,
      } as any;

      if (isRetryable) {
        (extraction.processingMeta as any)['lastRateLimitError'] = errorMessage;
        await extraction.save();
        throw error;
      }

      extraction.status = 'needs_review' as any;
      extraction.validationErrors = [errorMessage];
      extraction.rawOcrJson = documentAiOutput || {};
      await extraction.save();

      return extraction;
    }

    extraction.llmRawResponse = piResult.rawResponse;
    extraction.provider = piResult.provider;
    extraction.set('model', piResult.model);
    extraction.processingMeta = {
      ...(extraction.processingMeta || {}),
      promptVersion: piResult.promptVersion,
      stage: 'validation_pending',
    } as any;

    let validation = validateRawAttendanceExtraction(piResult.rawResponse);

    if (!validation.isValid) {
      const repairedResponse = await repairAttendanceJsonWithPi(piResult.rawResponse, {
        imagePath: extraction.originalImagePath,
        mimeType: extraction.mimeType,
        ocrSummary: ocrSummary || {},
      });

      extraction.llmRawResponse = repairedResponse;
      validation = validateRawAttendanceExtraction(repairedResponse);
    }

    if (!validation.isValid) {
      extraction.validationErrors = validation.errors;
      extraction.status = 'validation_failed';
      await extraction.save();
      return extraction;
    }

    extraction.llmExtractedOutput = validation.data as any;
    extraction.validationErrors = [];
    const createdAttendance = await createAttendanceFromExtractionPayload({
      schoolId: extraction.schoolId,
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
    await pushNotificationService.sendAttendanceReviewAlert(extraction);

    return extraction;
  } catch (error) {
    extraction.status = 'failed';
    extraction.error = error instanceof Error ? error.message : 'Extraction failed';
    await extraction.save();
    logger.error(error);
    throw error;
  }
};

export const getExtractionById = (id: string) => AttendantExtraction.findById(id);

export const listPendingReviewExtractions = (options: any) =>
  AttendantExtraction.paginate({ status: { $in: ['ocr_completed', 'pending_review', 'corrected'] } }, options);

const cleanupFiles = async (filePaths: Array<string | undefined | null>) => {
  await Promise.all(
    filePaths.map(async (filePath) => {
      if (!filePath) {
        return;
      }

      try {
        await fs.unlink(filePath);
      } catch {
        // best-effort cleanup for test endpoints
      }
    })
  );
};

export const runDocumentAiTest = async (file: any, options?: { includeRaw?: boolean }) => {
  const upload = await saveUpload(file);
  const preprocessedImagePath = await preprocessAttendantImage(upload.originalImagePath);

  try {
    let documentAiOutput;
    try {
      documentAiOutput = await processDocument(preprocessedImagePath, upload.mimeType);
    } catch (error) {
      if (!isDocumentAiInvalidArgumentError(error)) {
        throw error;
      }

      logger.warn('[DocumentAI] Test preprocessed file rejected, retrying with original upload');
      documentAiOutput = await processDocument(upload.originalImagePath, upload.mimeType);
    }
    const layoutSummary = buildDocumentAiLayoutSummary(documentAiOutput);
    const ocrSummary = buildOcrSummary(documentAiOutput);

    return {
      documentAi: {
        text: documentAiOutput?.text || '',
        layoutSummary,
        ocrSummary,
        rawAvailable: Boolean(options?.includeRaw),
        raw: options?.includeRaw ? documentAiOutput : undefined,
      },
    };
  } finally {
    await cleanupFiles([upload.originalImagePath, preprocessedImagePath]);
  }
};

export const runPiTest = async (
  file: any,
  options?: {
    prompt?: string;
    ocrText?: string;
    ocrLayoutSummary?: Record<string, any>;
    ocrSummary?: Record<string, any>;
    includeRawResponse?: boolean;
    includeValidationErrors?: boolean;
  }
) => {
  const upload = await saveUpload(file);
  const promptUsed = options?.prompt || ATTENDANCE_EXTRACTION_PROMPT;

  try {
    const piResult = await extractAttendanceWithPi({
      imagePath: upload.originalImagePath,
      mimeType: upload.mimeType,
      ocrSummary: options?.ocrSummary || {
        documentAiText: options?.ocrText || '',
        documentAiLayoutSummary: options?.ocrLayoutSummary || {},
      },
    });

    const validation = validateRawAttendanceExtraction(piResult.rawResponse);

    return {
      pi: {
        enabled: true,
        provider: piResult.provider,
        model: piResult.model,
        promptUsed,
        rawResponse: options?.includeRawResponse ? piResult.rawResponse : undefined,
        parsedValid: validation.isValid,
        validationErrors: options?.includeValidationErrors === false ? [] : validation.errors,
        parsedOutput: validation.isValid ? validation.data : undefined,
      },
    };
  } finally {
    await cleanupFiles([upload.originalImagePath]);
  }
};
