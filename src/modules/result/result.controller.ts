import httpStatus from 'http-status';
import { Request, Response } from 'express';
import { catchAsync, pick } from '../utils';
import * as resultService from './result.service';

const getResultIdFromParams = (req: Request) => req.params['resultId'] as string;

export const createResult = catchAsync(async (req: Request, res: Response) => {
  const result = await resultService.createResult(req.body, req.account);
  res.status(httpStatus.CREATED).send(result);
});

export const getResults = catchAsync(async (req: Request, res: Response) => {
  const filter = pick(req.query, ['student', 'school', 'classId', 'termId', 'academicSessionId', 'subject']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await resultService.queryResults(filter, options, req.account);
  res.send(result);
});

export const getResult = catchAsync(async (req: Request, res: Response) => {
  const result = await resultService.getResultById(getResultIdFromParams(req), req.account);
  res.send(result);
});

export const updateResult = catchAsync(async (req: Request, res: Response) => {
  const result = await resultService.updateResultById(getResultIdFromParams(req), req.body, req.account);
  res.send(result);
});

export const deleteResult = catchAsync(async (req: Request, res: Response) => {
  await resultService.deleteResultById(getResultIdFromParams(req), req.account);
  res.status(httpStatus.NO_CONTENT).send();
});
