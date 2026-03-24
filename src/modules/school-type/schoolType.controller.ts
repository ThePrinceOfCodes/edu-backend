import httpStatus from 'http-status';
import { Request, Response } from 'express';
import { catchAsync, pick } from '../utils';
import * as schoolTypeService from './schoolType.service';

const getSchoolTypeIdFromParams = (req: Request) => req.params['schoolTypeId'] as string;

export const createSchoolType = catchAsync(async (req: Request, res: Response) => {
  const schoolType = await schoolTypeService.createSchoolType(req.body);
  res.status(httpStatus.CREATED).send(schoolType);
});

export const getSchoolTypes = catchAsync(async (req: Request, res: Response) => {
  const filter = pick(req.query, ['name']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await schoolTypeService.querySchoolTypes(filter, options);
  res.send(result);
});

export const getSchoolType = catchAsync(async (req: Request, res: Response) => {
  const schoolType = await schoolTypeService.getSchoolTypeById(getSchoolTypeIdFromParams(req));
  res.send(schoolType);
});

export const updateSchoolType = catchAsync(async (req: Request, res: Response) => {
  const schoolType = await schoolTypeService.updateSchoolTypeById(getSchoolTypeIdFromParams(req), req.body);
  res.send(schoolType);
});

export const deleteSchoolType = catchAsync(async (req: Request, res: Response) => {
  await schoolTypeService.deleteSchoolTypeById(getSchoolTypeIdFromParams(req));
  res.status(httpStatus.NO_CONTENT).send();
});
