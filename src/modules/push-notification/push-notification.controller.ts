import httpStatus from 'http-status';
import { Request, Response } from 'express';
import { catchAsync } from '../utils';
import { ApiError } from '../errors';
import { pushNotificationService } from './push-notification.service';

const getActorId = (req: Request) => {
  const account = req.account as any;
  return String(account?.id || account?._id || '');
};

export const registerToken = catchAsync(async (req: Request, res: Response) => {
  const actorId = getActorId(req);
  if (!actorId) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate');
  }

  const token = await pushNotificationService.registerToken(actorId, req.body);
  res.status(httpStatus.OK).send(token);
});

export const unregisterToken = catchAsync(async (req: Request, res: Response) => {
  const actorId = getActorId(req);
  if (!actorId) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate');
  }

  await pushNotificationService.unregisterToken(actorId, req.body.fcm_token as string);
  res.status(httpStatus.NO_CONTENT).send();
});

export const sendTestNotification = catchAsync(async (req: Request, res: Response) => {
  const result = await pushNotificationService.sendToUsers(req.body.userIds as string[], {
    title: req.body.title as string,
    body: req.body.body as string,
    data: (req.body.data || {}) as Record<string, string>,
  });

  res.status(httpStatus.OK).send(result);
});
