import httpStatus from 'http-status';
import { Request, Response } from 'express';
import { catchAsync, pick } from '../utils';
import * as schoolService from './school.service';

const getSchoolIdFromParams = (req: Request) => {
  const schoolId = req.params['schoolId'];
  return schoolId as string;
};

export const createSchool = catchAsync(async (req: Request, res: Response) => {
  const school = await schoolService.createSchool(req.body, req.account);
  res.status(httpStatus.CREATED).send(school);
});

export const getSchools = catchAsync(async (req: Request, res: Response) => {
  const filter = pick(req.query, ['name', 'schoolBoard', 'state', 'localGovernment', 'district', 'status']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await schoolService.querySchools(filter, options, req.account);
  res.send(result);
});

export const getSchool = catchAsync(async (req: Request, res: Response) => {
  const school = await schoolService.getSchoolById(getSchoolIdFromParams(req), req.account);
  res.send(school);
});

export const updateSchool = catchAsync(async (req: Request, res: Response) => {
  const school = await schoolService.updateSchoolById(getSchoolIdFromParams(req), req.body, req.account);
  res.send(school);
});

export const deleteSchool = catchAsync(async (req: Request, res: Response) => {
  await schoolService.deleteSchoolById(getSchoolIdFromParams(req), req.account);
  res.status(httpStatus.NO_CONTENT).send();

export const bulkImportSchools = catchAsync(async (req: Request, res: Response) => {
  const result = await schoolService.createSchoolsBulk(req.body.schools, req.account);
  res.status(httpStatus.CREATED).send(result);
});
});
