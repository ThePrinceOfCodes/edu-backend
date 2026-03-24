import jwt from 'jsonwebtoken';
import moment from 'moment';
import httpStatus from 'http-status';
import config from '../../config/config';
import { userService } from '../users/index';
import { ApiError } from '../errors/index';
import { IUserDoc } from '../users/user.interfaces';
import Auth from './auth.model';
import { IAuth } from './auth.interfaces';
import { redisClient } from '../redis/index';
import { emailManagementService } from '../email/service';

export const createAuth = async (authBody: IAuth) => {
  return Auth.create(authBody);
};

export const registerCompany = async (registrationBody: any) => {
  const { name, workEmail, password } = registrationBody;

  if (await Auth.isEmailTaken(workEmail)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken');
  }

  const user = await userService.createUser({
    name,
    email: workEmail,
  });

  await createAuth({
    user: user.id,
    email: workEmail,
    password,
    provider: 'email',
  });

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  await redisClient.setex(`otp:${workEmail}`, 900, otp);

  return { user };
};

export const loginUserWithEmailAndPassword = async (email: string, password: string) => {
  const auth = await Auth.findOne({ email, provider: 'email' });
  if (!auth || !(await auth.isPasswordMatch(password))) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Incorrect email or password');
  }

  const user = await userService.getUserById(auth.user);
  if (!user) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'User account not found');
  }

  if (user.status === 'disabled') {
    throw new ApiError(httpStatus.FORBIDDEN, 'Your account has been deactivated');
  }

  return user;
};

export const verifyOtp = async (email: string, otp: string) => {
  const storedOtp = await redisClient.get(`otp:${email}`);

  if (!storedOtp) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'OTP expired or broken');
  }

  if (storedOtp !== otp) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid OTP');
  }

  await redisClient.del(`otp:${email}`);
  return true;
};

export const generateToken = (
  userId: string,
  expires: moment.Moment,
  type: 'access' | 'refresh' | 'reset',
  options: { secret?: string } = {}
) => {
  const secret = options.secret || config.jwt.secret;
  const payload = {
    sub: userId,
    iat: moment().unix(),
    exp: expires.unix(),
    type,
  };

  return jwt.sign(payload, secret);
};

export const generateAuthTokens = async (user: IUserDoc, minutes?: number) => {
  const accessTokenExpires = moment().add(minutes || config.jwt.accessExpirationMinutes, 'minutes');
  const accessToken = generateToken(user.id, accessTokenExpires, 'access');

  const refreshTokenExpires = moment().add(config.jwt.refreshExpirationDays, 'days');
  const refreshToken = generateToken(user.id, refreshTokenExpires, 'refresh');

  return {
    access: {
      token: accessToken,
      expires: accessTokenExpires.toDate(),
    },
    refresh: {
      token: refreshToken,
      expires: refreshTokenExpires.toDate(),
    },
  };
};

export const refreshTokens = async (token: string) => {
  const decoded: any = jwt.verify(token, config.jwt.secret);
  const user = await userService.getUserById(decoded.sub);
  if (!user) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Failed to refresh token');
  }

  if (decoded.type !== 'refresh') {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid token type');
  }

  const tokens = await generateAuthTokens(user);
  return { user, credentials: tokens };
};

export const forgotPassword = async (email: string) => {
  const auth = await Auth.findOne({ email, provider: 'email' });
  if (!auth) {
    throw new ApiError(httpStatus.NOT_FOUND, 'No user found with this email');
  }

  const token = generateToken(auth.user, moment().add(2, 'hours'), 'reset');
  const resetTokenKey = `reset_password_token:${token}`;

  await redisClient.setex(resetTokenKey, 3600 * 2, auth.user);
  await emailManagementService.sendResetPasswordEmail(email, token);
};

export const resetPassword = async (token: string, newPassword: string) => {
  const resetTokenKey = `reset_password_token:${token}`;
  const userId = await redisClient.get(resetTokenKey);

  if (!userId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Password reset token is invalid or has expired');
  }

  const auth = await Auth.findOne({ user: userId, provider: 'email' });
  if (!auth) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User credentials not found');
  }

  auth.password = newPassword;
  await auth.save();
  await redisClient.del(resetTokenKey);
};

export const verifyResetToken = async (token: string) => {
  try {
    const decoded: any = jwt.verify(token, config.jwt.secret);
    if (decoded.type !== 'reset') {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid token type');
    }

    const resetTokenKey = `reset_password_token:${token}`;
    const userId = await redisClient.get(resetTokenKey);

    if (!userId || userId !== decoded.sub) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid or expired token');
    }

    const user = await userService.getUserById(userId);
    if (!user) {
      throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
    }

    return { valid: true, user };
  } catch (_error) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid or expired token');
  }
};

export const changePassword = async (userId: string, currentPassword: string, newPassword: string) => {
  const auth = await Auth.findOne({ user: userId, provider: 'email' });
  if (!auth) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User credentials not found');
  }

  if (!(await auth.isPasswordMatch(currentPassword))) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Current password is incorrect');
  }

  if (await auth.isPasswordMatch(newPassword)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'New password must be different from current password');
  }

  auth.password = newPassword;
  await auth.save();

  return auth;
};
