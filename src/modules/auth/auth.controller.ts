import httpStatus from 'http-status';
import { Request, Response } from 'express';
import { catchAsync } from '../utils/index';
import * as authService from './auth.service';
import { userService } from '../users';
import { ApiError } from '../errors';

export const register = catchAsync(async (req: Request, res: Response) => {
  await authService.registerCompany(req.body);
  res.status(httpStatus.CREATED).send({ message: 'account created successfully' });
});

export const login = catchAsync(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const user = await authService.loginUserWithEmailAndPassword(email, password);
  const tokens = await authService.generateAuthTokens(user);

  res.send({
    account: user,
    credentials: tokens,
    token: tokens.access.token,
    refreshToken: tokens.refresh.token,
    tokenExpiresAt: tokens.access.expires,
    permissions: user.permissions ?? [],
  });
});

export const verifyEmail = catchAsync(async (req: Request, res: Response) => {
  const { email, otp } = req.body;
  const isVerified = await authService.verifyOtp(email, otp);

  if (isVerified) {
    const user = await userService.getUserByEmail(email);
    if (!user) {
      throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
    }

    const tokens = await authService.generateAuthTokens(user);
    res.status(httpStatus.OK).send({ user, credentials: tokens, message: 'Email verified successfully' });
    return;
  }

  res.status(httpStatus.OK).send({ message: 'Email verification failed' });
});

export const refreshTokens = catchAsync(async (req: Request, res: Response) => {
  const { user, credentials } = await authService.refreshTokens(req.body.refreshToken);
  res.send({ user, credentials, permissions: user.permissions ?? [] });
});

export const forgotPassword = catchAsync(async (req: Request, res: Response) => {
  await authService.forgotPassword(req.body.email);
  res.status(httpStatus.NO_CONTENT).send();
});

export const resetPassword = catchAsync(async (req: Request, res: Response) => {
  await authService.resetPassword(req.body.token, req.body.password);
  res.status(httpStatus.NO_CONTENT).send();
});

export const verifyResetToken = catchAsync(async (req: Request, res: Response) => {
  const result = await authService.verifyResetToken(req.body.token);
  res.send(result);
});

export const changePassword = catchAsync(async (req: Request, res: Response) => {
  const account = req.account;

  if (!account?.id) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate');
  }

  await authService.changePassword(account.id, req.body.currentPassword, req.body.newPassword);
  res.status(httpStatus.NO_CONTENT).send();
});

export const submitClientIntent = catchAsync(async (req: Request, res: Response) => {
  await authService.submitClientIntent(req.body);
  res.status(httpStatus.CREATED).send({ message: 'Intent submitted successfully' });
});
