import httpStatus from 'http-status';
import User from './user.model';
import { ApiError } from '../errors/index';
import { IUser } from './user.interfaces';
import Auth from '../auth/auth.model';

export const createUser = async (userBody: IUser) => {
  if (await Auth.isEmailTaken(userBody.email)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken');
  }

  return User.create(userBody);
};

export const getUserById = async (id: string) => {
  return User.findById(id);
};

export const getUserByEmail = async (email: string) => {
  return User.findOne({ email });
};

export const queryUsers = async (filter: any, options: any) => {
  const users = await User.paginate(filter, options);
  return users;
};
