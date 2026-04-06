import httpStatus from 'http-status';
import { Request, Response } from 'express';
import { catchAsync, pick } from '../utils';
import * as messagingService from './messaging.service';

const getThreadIdFromParams = (req: Request) => req.params['threadId'] as string;

export const createThread = catchAsync(async (req: Request, res: Response) => {
  const created = await messagingService.createThread(req.body, req.account);
  res.status(httpStatus.CREATED).send(created);
});

export const getThreads = catchAsync(async (req: Request, res: Response) => {
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await messagingService.queryThreads(req.account, options);
  res.send(result);
});

export const getThreadMessages = catchAsync(async (req: Request, res: Response) => {
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await messagingService.queryThreadMessages(getThreadIdFromParams(req), req.account, options);
  res.send(result);
});

export const sendMessage = catchAsync(async (req: Request, res: Response) => {
  const created = await messagingService.sendMessage(getThreadIdFromParams(req), req.body.content, req.account);
  res.status(httpStatus.CREATED).send(created);
});
