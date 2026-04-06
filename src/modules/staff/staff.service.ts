import httpStatus from 'http-status';
import { IUserDoc } from '../users/user.interfaces';
import { ApiError } from '../errors';
import { userService, User } from '../users';
import { Auth, authService } from '../auth';
import { School } from '../school';
import { SchoolBoard } from '../school-board';
import Staff from './staff.model';
import { IStaff } from './staff.interfaces';

type CreateStaffPayload = Omit<IStaff, 'user' | 'schoolBoard'> & {
  schoolBoard?: string;
  userId?: string;
  user?: {
    name: string;
    email: string;
    password: string;
    phoneNumber?: string;
    role?: 'teacher' | 'staff';
  };
};

const buildStaffAccessFilter = (actor: IUserDoc) => {
  if (actor.accountType === 'internal') {
    return {};
  }

  if (actor.role === 'school-board-admin') {
    if (!actor.schoolBoardId) {
      throw new ApiError(httpStatus.FORBIDDEN, 'School board context is missing for this user');
    }

    return { schoolBoard: actor.schoolBoardId };
  }

  if (actor.role === 'school-admin') {
    if (!actor.schoolId) {
      throw new ApiError(httpStatus.FORBIDDEN, 'School context is missing for this user');
    }

    return { school: actor.schoolId };
  }

  throw new ApiError(httpStatus.FORBIDDEN, 'Only school board admin or school admin can access staff records');
};

const resolveSchoolScopeForCreate = async (payload: CreateStaffPayload, actor: IUserDoc) => {
  if (actor.accountType === 'internal') {
    if (payload.school) {
      const school = await School.findById(payload.school);
      if (!school) {
        throw new ApiError(httpStatus.NOT_FOUND, 'School not found');
      }

      return { schoolBoard: school.schoolBoard || null, school: school.id };
    }

    if (!payload.schoolBoard) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Either schoolBoard or school is required');
    }

    const schoolBoard = await SchoolBoard.findById(payload.schoolBoard);
    if (!schoolBoard) {
      throw new ApiError(httpStatus.NOT_FOUND, 'School board not found');
    }

    return { schoolBoard: schoolBoard.id, school: null };
  }

  if (actor.role === 'school-admin') {
    if (!actor.schoolId) {
      throw new ApiError(httpStatus.FORBIDDEN, 'School context is missing for this user');
    }

    return { schoolBoard: actor.schoolBoardId || null, school: actor.schoolId };
  }

  if (actor.role === 'school-board-admin') {
    if (!actor.schoolBoardId) {
      throw new ApiError(httpStatus.FORBIDDEN, 'School board context is missing for this user');
    }

    if (payload.school) {
      const school = await School.findById(payload.school);
      if (!school || school.schoolBoard !== actor.schoolBoardId) {
        throw new ApiError(httpStatus.FORBIDDEN, 'Cannot manage staff outside your school board');
      }

      return { schoolBoard: actor.schoolBoardId, school: school.id };
    }

    return { schoolBoard: actor.schoolBoardId, school: null };
  }

  throw new ApiError(httpStatus.FORBIDDEN, 'Invalid role for staff creation');
};

const resolveStaffUser = async (
  scope: { schoolBoard: string | null; school: string | null },
  payload: CreateStaffPayload
) => {
  if (payload.userId && payload.user) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Provide either userId or user payload, not both');
  }

  if (payload.userId) {
    const user = await userService.getUserById(payload.userId);
    if (!user) {
      throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
    }

    user.schoolBoardId = scope.schoolBoard;
    user.schoolId = scope.school;
    if (payload.employmentType) {
      user.role = payload.employmentType;
    }

    await user.save();
    return user;
  }

  if (!payload.user) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Either userId or user payload is required');
  }

  if (await Auth.isEmailTaken(payload.user.email)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'User email already taken');
  }

  const user = await userService.createUser({
    name: payload.user.name,
    email: payload.user.email,
    accountType: 'client',
    role: payload.user.role || payload.employmentType || 'staff',
    schoolBoardId: scope.schoolBoard,
    schoolId: scope.school,
    isVerified: true,
    ...(payload.user.phoneNumber ? { phoneNumber: payload.user.phoneNumber } : {}),
  });

  await authService.createAuth({
    user: user.id,
    email: payload.user.email,
    password: payload.user.password,
    provider: 'email',
  });

  return user;
};

export const createStaff = async (staffBody: CreateStaffPayload, actor: IUserDoc) => {
  const scope = await resolveSchoolScopeForCreate(staffBody, actor);
  const user = await resolveStaffUser(scope, staffBody);

  const existingStaff = await Staff.findOne({ user: user.id });
  if (existingStaff) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Staff details already exist for this user');
  }

  return Staff.create({
    user: user.id,
    schoolBoard: scope.schoolBoard,
    school: scope.school,
    employeeId: staffBody.employeeId,
    designation: staffBody.designation,
    employmentType: staffBody.employmentType || 'staff',
    isActive: staffBody.isActive,
  });
};

export const queryStaff = async (filter: any, options: any, actor: IUserDoc) => {
  const accessFilter = buildStaffAccessFilter(actor);
  return Staff.paginate({ ...filter, ...accessFilter }, { ...options, populate: 'user' });
};

export const getStaffById = async (staffId: string, actor: IUserDoc) => {
  const accessFilter = buildStaffAccessFilter(actor);
  const staff = await Staff.findOne({ _id: staffId, ...accessFilter }).populate('user');

  if (!staff) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Staff record not found');
  }

  return staff;
};

export const updateStaffById = async (staffId: string, updateBody: Partial<IStaff>, actor: IUserDoc) => {
  const staff = await getStaffById(staffId, actor);

  Object.assign(staff, updateBody);
  await staff.save();

  return staff;
};

export const deleteStaffById = async (staffId: string, actor: IUserDoc) => {
  const staff = await getStaffById(staffId, actor);

  await staff.deleteOne();
  await User.findByIdAndUpdate(staff.user, { $set: { schoolId: null } });

  return staff;
};
