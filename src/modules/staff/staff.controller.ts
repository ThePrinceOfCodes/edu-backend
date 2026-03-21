import httpStatus from 'http-status';
import { Request, Response } from 'express';
import { catchAsync, pick } from '../utils';
import * as staffService from './staff.service';

const getStaffIdFromParams = (req: Request) => {
  const staffId = req.params['staffId'];
  return staffId as string;
};

export const createStaff = catchAsync(async (req: Request, res: Response) => {
  const staff = await staffService.createStaff(req.body, req.account);
  res.status(httpStatus.CREATED).send(staff);
});

export const getStaff = catchAsync(async (req: Request, res: Response) => {
  const filter = pick(req.query, ['user', 'schoolBoard', 'school', 'employmentType', 'isActive']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await staffService.queryStaff(filter, options, req.account);
  res.send(result);
});

export const getStaffById = catchAsync(async (req: Request, res: Response) => {
  const staff = await staffService.getStaffById(getStaffIdFromParams(req), req.account);
  res.send(staff);
});

export const updateStaff = catchAsync(async (req: Request, res: Response) => {
  const staff = await staffService.updateStaffById(getStaffIdFromParams(req), req.body, req.account);
  res.send(staff);
});

export const deleteStaff = catchAsync(async (req: Request, res: Response) => {
  await staffService.deleteStaffById(getStaffIdFromParams(req), req.account);
  res.status(httpStatus.NO_CONTENT).send();
});
