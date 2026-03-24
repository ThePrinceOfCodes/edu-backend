import httpStatus from 'http-status';
import { Request, Response } from 'express';
import { catchAsync, pick } from '../utils';
import * as userService from './user.service';
import { authService } from '../auth';
import { INTERNAL_USER_ROLES, getPermissionsForRole } from './user.constants';

export const createInternalUser = catchAsync(async (req: Request, res: Response) => {
  const { name, email, password, phoneNumber, role, permissions } = req.body;

  const resolvedRole = INTERNAL_USER_ROLES.includes(role) ? role : 'admin';
  const resolvedPermissions =
    Array.isArray(permissions) && permissions.length ? permissions : getPermissionsForRole(resolvedRole);

  const user = await userService.createUser({
    name,
    email,
    accountType: 'internal',
    role: resolvedRole,
    permissions: resolvedPermissions,
    isVerified: true,
    status: 'active',
    ...(phoneNumber ? { phoneNumber } : {}),
  });

  await authService.createAuth({
    user: user.id,
    email,
    password,
    provider: 'email',
  });

  res.status(httpStatus.CREATED).send(user);
});

export const getUsers = catchAsync(async (req: Request, res: Response) => {
  const filter = pick(req.query, ['name', 'email', 'role', 'status', 'accountType']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await userService.queryUsers(filter, options);
  res.send(result);
});

export const getUserById = catchAsync(async (req: Request, res: Response) => {
  const user = await userService.getUserById(req.params['userId'] as string);
  if (!user) {
    res.status(httpStatus.NOT_FOUND).send({ message: 'User not found' });
    return;
  }
  res.send(user);
});

export const updateUserById = catchAsync(async (req: Request, res: Response) => {
  const { name, email, phoneNumber, role, permissions, status } = req.body;
  const updateBody: any = pick({ name, email, phoneNumber, role, permissions, status }, [
    'name',
    'email',
    'phoneNumber',
    'role',
    'permissions',
    'status',
  ]);

  if (updateBody.role && (!Array.isArray(updateBody.permissions) || updateBody.permissions.length === 0)) {
    updateBody.permissions = getPermissionsForRole(updateBody.role);
  }

  const user = await userService.updateUserById(req.params['userId'] as string, updateBody);
  res.send(user);
});

export const deactivateUserById = catchAsync(async (req: Request, res: Response) => {
  const user = await userService.deactivateUserById(req.params['userId'] as string);
  res.send(user);
});

export const deleteUserById = catchAsync(async (req: Request, res: Response) => {
  const user = await userService.softDeleteUserById(req.params['userId'] as string);
  res.send(user);
});
