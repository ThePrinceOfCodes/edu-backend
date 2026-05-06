import httpStatus from 'http-status';
import { Request, Response } from 'express';
import { catchAsync, pick } from '../utils';
import * as termService from './term.service';

const getTermIdFromParams = (req: Request) => req.params['termId'] as string;

export const createTerm = catchAsync(async (req: Request, res: Response) => {
  const created = await termService.createTerm(req.body, req.account);
  res.status(httpStatus.CREATED).send(created);
});

export const getTerms = catchAsync(async (req: Request, res: Response) => {
  const filter = pick(req.query, ['name', 'termName', 'academicSession', 'schoolBoard', 'school', 'isActive']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await termService.queryTerms(filter, options, req.account);
  res.send(result);
});

export const getTerm = catchAsync(async (req: Request, res: Response) => {
  const found = await termService.getTermById(getTermIdFromParams(req), req.account);
  res.send(found);
});

export const updateTerm = catchAsync(async (req: Request, res: Response) => {
  const updated = await termService.updateTermById(getTermIdFromParams(req), req.body, req.account);
  res.send(updated);
});

export const deleteTerm = catchAsync(async (req: Request, res: Response) => {
  await termService.deleteTermById(getTermIdFromParams(req), req.account);
  res.status(httpStatus.NO_CONTENT).send();
});

export const getActiveTerm = catchAsync(async (req: Request, res: Response) => {
  const schoolId = req.query['school'] as string | undefined;
  const activeTerm = await termService.getActiveTermForRequest(req.account, schoolId);
  res.send(activeTerm);
});

export const getTermByDateRange = catchAsync(async (req: Request, res: Response) => {
  const startDate = new Date(req.query['startDate'] as string);
  const endDate = new Date(req.query['endDate'] as string);
  const schoolId = req.query['school'] as string | undefined;
  const schoolBoardId = req.query['schoolBoardId'] as string | undefined; 
  const term = await termService.getTermForDateRange(startDate, endDate, req.account, schoolId, schoolBoardId);
  res.send(term);
});
