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

export const updateUserById = async (userId: string, updateBody: Partial<IUser>) => {
  const user = await getUserById(userId);

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  if (updateBody.email && updateBody.email !== user.email && (await Auth.isEmailTaken(updateBody.email, user.id))) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken');
  }

  Object.assign(user, updateBody);
  await user.save();
  return user;
};

export const deactivateUserById = async (userId: string) => {
  const user = await getUserById(userId);

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  user.status = 'disabled';
  await user.save();
  return user;
};

export const softDeleteUserById = async (userId: string) => {
  const user = await getUserById(userId);

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  user.status = 'disabled';
  user.permissions = [];
  await user.save();

  const auth = await Auth.findOne({ user: user.id, provider: 'email' });
  if (auth) {
    auth.email = `deleted+${user.id}@deleted.local`;
    await auth.save();
  }

  user.email = `deleted+${user.id}@deleted.local`;
  user.name = `${user.name} (deleted)`;
  await user.save();

  return user;
};
