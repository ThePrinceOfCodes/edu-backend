import httpStatus from 'http-status';
import { Request, Response } from 'express';
import { catchAsync, pick } from '../utils';
import * as subjectService from './subject.service';

const getSubjectIdFromParams = (req: Request) => req.params['subjectId'] as string;

export const createSubject = catchAsync(async (req: Request, res: Response) => {
  const subject = await subjectService.createSubject(req.body);
  res.status(httpStatus.CREATED).send(subject);
});

export const getSubjects = catchAsync(async (req: Request, res: Response) => {
  const filter = pick(req.query, ['name', 'code']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await subjectService.querySubjects(filter, options);
  res.send(result);
});

export const getSubject = catchAsync(async (req: Request, res: Response) => {
  const subject = await subjectService.getSubjectById(getSubjectIdFromParams(req));
  res.send(subject);
});

export const updateSubject = catchAsync(async (req: Request, res: Response) => {
  const subject = await subjectService.updateSubjectById(getSubjectIdFromParams(req), req.body);
  res.send(subject);
});

export const deleteSubject = catchAsync(async (req: Request, res: Response) => {
  await subjectService.deleteSubjectById(getSubjectIdFromParams(req));
  res.status(httpStatus.NO_CONTENT).send();
});
