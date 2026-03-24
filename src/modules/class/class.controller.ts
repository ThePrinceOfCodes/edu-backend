import httpStatus from 'http-status';
import { Request, Response } from 'express';
import { catchAsync, pick } from '../utils';
import * as classService from './class.service';

const getClassIdFromParams = (req: Request) => req.params['classId'] as string;

export const createClass = catchAsync(async (req: Request, res: Response) => {
  const created = await classService.createClass(req.body);
  res.status(httpStatus.CREATED).send(created);
});

export const getClasses = catchAsync(async (req: Request, res: Response) => {
  const filter = pick(req.query, ['name', 'code', 'schoolTypeId']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await classService.queryClasses(filter, options);
  res.send(result);
});

export const getClass = catchAsync(async (req: Request, res: Response) => {
  const found = await classService.getClassById(getClassIdFromParams(req));
  res.send(found);
});

export const updateClass = catchAsync(async (req: Request, res: Response) => {
  const updated = await classService.updateClassById(getClassIdFromParams(req), req.body);
  res.send(updated);
});

export const deleteClass = catchAsync(async (req: Request, res: Response) => {
  await classService.deleteClassById(getClassIdFromParams(req));
  res.status(httpStatus.NO_CONTENT).send();
});
