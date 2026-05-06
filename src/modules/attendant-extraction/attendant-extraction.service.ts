import fs from 'fs/promises';
import path from 'path';
import httpStatus from 'http-status';
import { ApiError } from '../errors';
import config from '../../config/config';
import AttendantExtraction from './attendant-extraction.model';
import { attendantExtractionJobName, attendantExtractionQueue } from './attendant-extraction.queue';
import { preprocessAttendantImage } from './attendant-preprocess.service';
import { processDocument } from './document-ai.service';
import { mergeParsedDocuments, parseAttendantDocument, shouldRunFallbackOcr } from './attendant-parser.service';
import { createAttendanceFromParsedRows } from './attendant-attendance.service';
import { createReview } from '../attendant-review/attendant-review.service';
import { getWorkingDays } from './attendant-dates.util';

export const saveUpload = async (file: any) => {
  if (!file) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Image file is required');
  }

  await fs.mkdir(config.attendantUploadsDir, { recursive: true });
  const targetPath = path.join(config.attendantUploadsDir, file.filename || `${Date.now()}-${file.originalname}`);
  if (file.path !== targetPath) {
    await fs.rename(file.path, targetPath);
  }

  return targetPath;
};

export const createExtractionJob = async (
  imagePath: string,
  context: { schoolId: string; termId: string; academicSessionId: string; startDate: Date; endDate: Date },
) => {
  const extraction = await AttendantExtraction.create({
    imagePath,
    schoolId: context.schoolId,
    termId: context.termId,
    academicSessionId: context.academicSessionId,
    startDate: context.startDate,
    endDate: context.endDate,
    status: 'queued',
  });
  await attendantExtractionQueue.add(attendantExtractionJobName, { extractionId: extraction['_id'] as string });
  return extraction;
};

export const processExtraction = async (extractionId: string) => {
  const extraction = await AttendantExtraction.findById(extractionId);
  if (!extraction) throw new ApiError(httpStatus.NOT_FOUND, 'Extraction not found');

  extraction.status = 'processing';
  await extraction.save();

  const preprocessedImagePath = await preprocessAttendantImage(extraction.imagePath);
  extraction.preprocessedImagePath = preprocessedImagePath;

  const preprocessedDocument = await processDocument(preprocessedImagePath);
  let parsed = parseAttendantDocument(preprocessedDocument);

  let originalDocument: any = null;
  if (shouldRunFallbackOcr(parsed)) {
    originalDocument = await processDocument(extraction.imagePath);
    parsed = mergeParsedDocuments(preprocessedDocument, originalDocument);
  }

  extraction.rawOcrJson = {
    preprocessed: preprocessedDocument,
    original: originalDocument,
  } as any;
  extraction.rawText = preprocessedDocument?.text || originalDocument?.text || '';

  extraction.parsedJson = parsed as any;
  extraction.status = 'parsed';
  await extraction.save();

  const workingDays = getWorkingDays(extraction.startDate, extraction.endDate);

  const createdAttendance = await createAttendanceFromParsedRows({
    schoolId: extraction.schoolId,
    termId: extraction.termId,
    academicSessionId: extraction.academicSessionId,
    workingDays,
    rows: (parsed.rows || []) as any,
  }).catch(() => []);

  extraction.createdAttendanceIds = createdAttendance.map((item) => item['_id'] as string);

  const pendingReviews = [] as any[];
  for (const row of parsed.unmatchedRows || []) {
    const review = await createReview({
      schoolId: extraction.schoolId,
      extractionId: extraction['_id'] as string,
      sourceImagePath: extraction.imagePath,
      rawRow: row,
      parsedAttempt: row,
      reason: 'Could not confidently match student',
      confidence: (row as any).confidence ?? 0,
      resolvedStatus: 'pending',
    });
    pendingReviews.push(review);
  }

  extraction.pendingReviewIds = pendingReviews.map((item) => item['_id'] as string);
  extraction.status = pendingReviews.length ? 'needs_review' : 'attendance_created';
  await extraction.save();

  return extraction;
};

export const getExtractionById = (id: string) => AttendantExtraction.findById(id);
