import httpStatus from 'http-status';
import { ApiError } from '../errors';
import AttendantExtraction from './attendant-extraction.model';
import { AttendanceExtractionPayload } from './attendance-extraction.schema';
import { validateAttendanceExtraction } from './attendance-validation.service';

const CORRECTABLE_STATUSES = new Set(['ocr_completed', 'pending_review', 'corrected']);

export const correctExtraction = async (id: string, payload: unknown) => {
  const extraction = await AttendantExtraction.findById(id);
  if (!extraction) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Extraction not found');
  }

  if (!CORRECTABLE_STATUSES.has(extraction.status)) {
    throw new ApiError(httpStatus.BAD_REQUEST, `Extraction cannot be corrected from status '${extraction.status}'`);
  }

  const validation = validateAttendanceExtraction(payload);
  if (!validation.isValid) {
    throw new ApiError(httpStatus.BAD_REQUEST, validation.errors.join(', '));
  }

  extraction.humanCorrectedOutput = validation.data as AttendanceExtractionPayload as any;
  extraction.status = 'corrected';
  extraction.validationErrors = [];
  await extraction.save();

  return extraction;
};

export const approveExtraction = async (id: string, approvedBy: string) => {
  const extraction = await AttendantExtraction.findById(id);
  if (!extraction) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Extraction not found');
  }

  if (!extraction.humanCorrectedOutput) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Extraction must be corrected before approval');
  }

  const validation = validateAttendanceExtraction(extraction.humanCorrectedOutput);
  if (!validation.isValid) {
    throw new ApiError(httpStatus.BAD_REQUEST, validation.errors.join(', '));
  }

  extraction.humanCorrectedOutput = validation.data as AttendanceExtractionPayload as any;
  extraction.approvalMeta = {
    approvedBy,
    approvedAt: new Date(),
  } as any;
  extraction.status = 'approved';
  await extraction.save();

  return extraction;
};
