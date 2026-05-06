import httpStatus from 'http-status';
import { Request, Response } from 'express';
import { catchAsync, pick } from '../utils';
import * as attendantExtractionService from './attendant-extraction.service';
import AttendantExtraction from './attendant-extraction.model';
import { ApiError } from '../errors';

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

  const imagePath = await attendantExtractionService.saveUpload(file);
  const extraction = await attendantExtractionService.createExtractionJob(imagePath, {
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
  res.send(extraction);
});

export const listExtractions = catchAsync(async (req: Request, res: Response) => {
  const filter = pick(req.query, ['status']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await AttendantExtraction.paginate(filter, options);
  res.send(result);
});
