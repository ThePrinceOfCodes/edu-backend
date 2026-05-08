import httpStatus from 'http-status';
import { Request, Response } from 'express';
import { catchAsync, pick } from '../utils';
import * as attendantExtractionService from './attendant-extraction.service';
import * as attendanceCorrectionService from './attendance-correction.service';
import * as attendanceExportService from './attendance-export.service';
import AttendantExtraction from './attendant-extraction.model';
import { ApiError } from '../errors';
import { AttendanceExtractionExportFormat } from './attendant-extraction.interfaces';

export const createExtraction = catchAsync(async (req: Request, res: Response) => {
  const file = (req as Request & { file?: any }).file;
  const schoolId = (req.body?.['schoolId'] || req.query?.['schoolId'] || req.account?.['schoolId']) as string | undefined;
  const termId = (req.body?.['termId'] || req.query?.['termId']) as string | undefined;
  const academicSessionId = (req.body?.['academicSessionId'] || req.query?.['academicSessionId']) as string | undefined;
  const startDate = req.body?.['startDate'] ? new Date(req.body['startDate'] as string) : undefined;
  const endDate = req.body?.['endDate'] ? new Date(req.body['endDate'] as string) : undefined;

  if (!schoolId) throw new ApiError(httpStatus.BAD_REQUEST, 'schoolId is required');
  if (!termId) throw new ApiError(httpStatus.BAD_REQUEST, 'termId is required');
  if (!academicSessionId) throw new ApiError(httpStatus.BAD_REQUEST, 'academicSessionId is required');
  if (!startDate || isNaN(startDate.getTime())) throw new ApiError(httpStatus.BAD_REQUEST, 'startDate is required and must be a valid date');
  if (!endDate || isNaN(endDate.getTime())) throw new ApiError(httpStatus.BAD_REQUEST, 'endDate is required and must be a valid date');
  if (startDate > endDate) throw new ApiError(httpStatus.BAD_REQUEST, 'startDate must be before or equal to endDate');

  const upload = await attendantExtractionService.saveUpload(file);
  const extraction = await attendantExtractionService.createExtractionJob(upload, {
    createdBy: String((req.account as any)?.id || (req.account as any)?._id || ''),
    schoolId,
    termId,
    academicSessionId,
    startDate,
    endDate,
  });

  res.status(httpStatus.CREATED).send(extraction);
});

export const getExtraction = catchAsync(async (req: Request, res: Response) => {
  const extraction = await attendantExtractionService.getExtractionById(req.params['id'] as string);
  if (!extraction) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Extraction not found');
  }
  res.send(extraction);
});

export const listExtractions = catchAsync(async (req: Request, res: Response) => {
  const filter = pick(req.query, ['status']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await AttendantExtraction.paginate(filter, options);
  res.send(result);
});

export const listPendingReviewExtractions = catchAsync(async (req: Request, res: Response) => {
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await attendantExtractionService.listPendingReviewExtractions(options);
  res.send(result);
});

export const correctExtraction = catchAsync(async (req: Request, res: Response) => {
  const extraction = await attendanceCorrectionService.correctExtraction(req.params['id'] as string, req.body);
  res.status(httpStatus.OK).send(extraction);
});

export const approveExtraction = catchAsync(async (req: Request, res: Response) => {
  const approvedBy = (req.account as any)?.id || (req.account as any)?._id;
  if (!approvedBy) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate');
  }

  const extraction = await attendanceCorrectionService.approveExtraction(req.params['id'] as string, approvedBy);
  res.status(httpStatus.OK).send(extraction);
});

export const exportExtraction = catchAsync(async (req: Request, res: Response) => {
  const format = (req.query['format'] as AttendanceExtractionExportFormat | undefined) || 'jsonl';
  const exported = await attendanceExportService.exportExtraction(req.params['id'] as string, format);

  res.setHeader('Content-Type', exported.contentType);
  res.setHeader('Content-Disposition', `attachment; filename="${exported.fileName}"`);
  res.status(httpStatus.OK).send(exported.body);
});
