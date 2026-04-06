import httpStatus from 'http-status';
import { Request, Response } from 'express';
import { catchAsync, pick } from '../utils';
import * as schoolBoardService from './schoolBoard.service';

const getSchoolBoardIdFromParams = (req: Request) => {
  const schoolBoardId = req.params['schoolBoardId'];
  return schoolBoardId as string;
};

export const createSchoolBoard = catchAsync(async (req: Request, res: Response) => {
  const schoolBoard = await schoolBoardService.createSchoolBoard(req.body);
  res.status(httpStatus.CREATED).send(schoolBoard);
});

export const getSchoolBoards = catchAsync(async (req: Request, res: Response) => {
  const filter = pick(req.query, ['name', 'code', 'status']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await schoolBoardService.querySchoolBoards(filter, options, req.account);
  res.send(result);
});

export const getSchoolBoard = catchAsync(async (req: Request, res: Response) => {
  const schoolBoard = await schoolBoardService.getSchoolBoardById(getSchoolBoardIdFromParams(req), req.account);
  res.send(schoolBoard);
});

export const updateSchoolBoard = catchAsync(async (req: Request, res: Response) => {
  const schoolBoard = await schoolBoardService.updateSchoolBoardById(getSchoolBoardIdFromParams(req), req.body);
  res.send(schoolBoard);
});

export const deleteSchoolBoard = catchAsync(async (req: Request, res: Response) => {
  await schoolBoardService.deleteSchoolBoardById(getSchoolBoardIdFromParams(req));
  res.status(httpStatus.NO_CONTENT).send();
});
