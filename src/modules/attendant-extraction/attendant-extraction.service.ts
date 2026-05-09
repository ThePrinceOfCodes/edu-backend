import fs from 'fs/promises';
import path from 'path';
import httpStatus from 'http-status';
import { ApiError } from '../errors';
import { logger } from '../logger';
import config from '../../config/config';
import AttendantExtraction from './attendant-extraction.model';
import { IAttendantExtractionApiResponse, IAttendantExtractionDoc } from './attendant-extraction.interfaces';
import { attendantExtractionJobName, attendantExtractionQueue } from './attendant-extraction.queue';
import { preprocessAttendantImage } from './attendant-preprocess.service';
import { buildDocumentAiLayoutSummary, processDocument } from './document-ai.service';
import { extractAttendanceWithPi, repairAttendanceJsonWithPi } from './pi-agent-extraction.service';
import { validateRawAttendanceExtraction } from './attendance-validation.service';
import { pushNotificationService } from '../push-notification';
import { ATTENDANCE_EXTRACTION_PROMPT } from './prompts';

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

  await fs.mkdir(config.attendantUploadsDir, { recursive: true });
  const targetPath = path.join(config.attendantUploadsDir, buildStoredFileName(file));
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
  context: { createdBy?: string; schoolId: string; termId: string; academicSessionId: string; startDate: Date; endDate: Date },
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
  await attendantExtractionQueue.add(attendantExtractionJobName, { extractionId: extraction['_id'] as unknown as string });
  return extraction;
};

export const processExtraction = async (extractionId: string) => {
  const extraction = await AttendantExtraction.findById(extractionId);
  if (!extraction) throw new ApiError(httpStatus.NOT_FOUND, 'Extraction not found');

  try {
    extraction.status = 'processing';
    extraction.error = undefined as unknown as string;
    await extraction.save();

    const preprocessedImagePath = await preprocessAttendantImage(extraction.originalImagePath);
    extraction.preprocessedImagePath = preprocessedImagePath;

    const documentAiOutput = await processDocument(preprocessedImagePath, extraction.mimeType);
    const layoutSummary = buildDocumentAiLayoutSummary(documentAiOutput);

    extraction.rawOcrJson = documentAiOutput as any;
    extraction.rawText = documentAiOutput?.text || '';
    extraction.documentAiRawOutput = documentAiOutput as any;
    extraction.documentAiText = documentAiOutput?.text || '';
    extraction.documentAiLayoutSummary = layoutSummary as any;
    extraction.status = 'ocr_completed';
    extraction.validationErrors = [];
    await extraction.save();

    if (!config.attendanceExtraction.usePi) {
      return extraction;
    }

    const piResult = await extractAttendanceWithPi({
      imagePath: extraction.originalImagePath,
      mimeType: extraction.mimeType,
      documentAiText: extraction.documentAiText || '',
      documentAiLayoutSummary: layoutSummary,
    });

    extraction.llmRawResponse = piResult.rawResponse;
    extraction.provider = piResult.provider;
    extraction.set('model', piResult.model);
    extraction.processingMeta = {
      ...(extraction.processingMeta || {}),
      promptVersion: piResult.promptVersion,
    } as any;

    let validation = validateRawAttendanceExtraction(piResult.rawResponse);

    if (!validation.isValid) {
      const repairedResponse = await repairAttendanceJsonWithPi(piResult.rawResponse, {
        imagePath: extraction.originalImagePath,
        mimeType: extraction.mimeType,
        documentAiText: extraction.documentAiText || '',
        documentAiLayoutSummary: layoutSummary,
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
    const documentAiOutput = await processDocument(preprocessedImagePath, upload.mimeType);
    const layoutSummary = buildDocumentAiLayoutSummary(documentAiOutput);

    return {
      documentAi: {
        text: documentAiOutput?.text || '',
        layoutSummary,
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
      documentAiText: options?.ocrText || '',
      documentAiLayoutSummary: options?.ocrLayoutSummary || {},
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
