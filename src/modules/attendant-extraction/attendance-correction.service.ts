import httpStatus from 'http-status';
import { ApiError } from '../errors';
import AttendantExtraction from './attendant-extraction.model';
import { AttendanceExtractionPayload } from './attendance-extraction.schema';
import { validateAttendanceExtraction } from './attendance-validation.service';
import { createAttendanceFromExtractionPayload } from './attendant-attendance.service';

const persistCorrectedAttendance = async (extraction: any, payload: AttendanceExtractionPayload) => {
  const createdAttendance = await createAttendanceFromExtractionPayload({
    schoolId: extraction.schoolId,
    termId: extraction.termId,
    academicSessionId: extraction.academicSessionId,
    startDate: new Date(extraction.startDate),
    endDate: new Date(extraction.endDate),
    students: payload.students,
  });

  extraction.createdAttendanceIds = createdAttendance.map((item: any) => String(item.id || item._id)).filter(Boolean);
};

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
  await persistCorrectedAttendance(extraction, validation.data as AttendanceExtractionPayload);
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
  await persistCorrectedAttendance(extraction, validation.data as AttendanceExtractionPayload);
  extraction.approvalMeta = {
    approvedBy,
    approvedAt: new Date(),
  } as any;
  extraction.status = 'approved';
  await extraction.save();

  return extraction;
};
