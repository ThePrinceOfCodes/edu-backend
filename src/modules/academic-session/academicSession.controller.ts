import httpStatus from 'http-status';
import { Request, Response } from 'express';
import { catchAsync, pick } from '../utils';
import * as academicSessionService from './academicSession.service';

const getAcademicSessionId = (req: Request) => req.params['academicSessionId'] as string;

export const createAcademicSession = catchAsync(async (req: Request, res: Response) => {
  const created = await academicSessionService.createAcademicSession(req.body, req.account);
  res.status(httpStatus.CREATED).send(created);
});

export const getAcademicSessions = catchAsync(async (req: Request, res: Response) => {
  const filter = pick(req.query, ['schoolBoard', 'isActive', 'startYear', 'endYear']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await academicSessionService.queryAcademicSessions(filter, options, req.account);
  res.send(result);
});

export const getAcademicSession = catchAsync(async (req: Request, res: Response) => {
  const found = await academicSessionService.getAcademicSessionById(getAcademicSessionId(req), req.account);
  res.send(found);
});

export const updateAcademicSession = catchAsync(async (req: Request, res: Response) => {
  const updated = await academicSessionService.updateAcademicSessionById(getAcademicSessionId(req), req.body, req.account);
  res.send(updated);
});

export const deleteAcademicSession = catchAsync(async (req: Request, res: Response) => {
  await academicSessionService.deleteAcademicSessionById(getAcademicSessionId(req), req.account);
  res.status(httpStatus.NO_CONTENT).send();
});
