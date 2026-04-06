import httpStatus from 'http-status';
import { authService } from '../auth';
import { userService } from '../users';
import { Auth } from '../auth';
import { User } from '../users';
import { ApiError } from '../errors';
import { IUserDoc } from '../users/user.interfaces';
import SchoolBoard from './schoolBoard.model';
import { ISchoolBoard } from './schoolBoard.interfaces';

type CreateSchoolBoardPayload = Omit<ISchoolBoard, 'superAdminUser'> & {
  superAdmin: {
    name: string;
    email: string;
    password: string;
    phoneNumber?: string;
  };
};

const ensureUniqueSchoolBoardFields = async (
  payload: Partial<Pick<ISchoolBoard, 'name' | 'code'>>,
  excludeId?: string
) => {
  if (payload.name) {
    const nameExists = await SchoolBoard.findOne({
      name: payload.name,
      ...(excludeId ? { _id: { $ne: excludeId } } : {}),
    });

    if (nameExists) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'School board name already exists');
    }
  }

  if (payload.code) {
    const codeExists = await SchoolBoard.findOne({
      code: payload.code,
      ...(excludeId ? { _id: { $ne: excludeId } } : {}),
    });

    if (codeExists) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'School board code already exists');
    }
  }
};

export const createSchoolBoard = async (schoolBoardBody: CreateSchoolBoardPayload) => {
  const { superAdmin, ...boardData } = schoolBoardBody;

  const uniqueFieldPayload: Partial<Pick<ISchoolBoard, 'name' | 'code'>> = { name: boardData.name };
  if (boardData.code) {
    uniqueFieldPayload.code = boardData.code;
  }

  await ensureUniqueSchoolBoardFields(uniqueFieldPayload);

  if (await Auth.isEmailTaken(superAdmin.email)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Super admin email already taken');
  }

  const user = await userService.createUser({
    name: superAdmin.name,
    email: superAdmin.email,
    accountType: 'client',
    role: 'school-board-admin',
    isVerified: true,
    ...(superAdmin.phoneNumber ? { phoneNumber: superAdmin.phoneNumber } : {}),
  });

  await authService.createAuth({
    user: user.id,
    email: superAdmin.email,
    password: superAdmin.password,
    provider: 'email',
  });

  const schoolBoard = await SchoolBoard.create({
    ...boardData,
    superAdminUser: user.id,
  });

  user.schoolBoardId = schoolBoard.id;
  await user.save();

  return schoolBoard;
};

export const querySchoolBoards = async (filter: any, options: any, actor?: IUserDoc) => {
  let accessFilter = filter;

  if (actor && actor.accountType === 'client') {
    // School board admins and school admins can only see their own school board
    if (actor.schoolBoardId) {
      accessFilter = { ...filter, _id: actor.schoolBoardId };
    }
  }

  return SchoolBoard.paginate(accessFilter, {
    ...options,
    populate: 'superAdminUser',
  });
};

export const getSchoolBoardById = async (schoolBoardId: string, actor?: IUserDoc) => {
  // Check access control for non-internal users
  if (actor && actor.accountType === 'client') {
    if (!actor.schoolBoardId || actor.schoolBoardId !== schoolBoardId) {
      throw new ApiError(httpStatus.FORBIDDEN, 'You do not have access to this school board');
    }
  }

  return SchoolBoard.findById(schoolBoardId).populate('superAdminUser');
};

export const updateSchoolBoardById = async (schoolBoardId: string, updateBody: Partial<ISchoolBoard>) => {
  const schoolBoard = await getSchoolBoardById(schoolBoardId);
  if (!schoolBoard) {
    throw new ApiError(httpStatus.NOT_FOUND, 'School board not found');
  }

  const updateUniqueFieldPayload: Partial<Pick<ISchoolBoard, 'name' | 'code'>> = {};
  if (updateBody.name) {
    updateUniqueFieldPayload.name = updateBody.name;
  }
  if (updateBody.code) {
    updateUniqueFieldPayload.code = updateBody.code;
  }

  await ensureUniqueSchoolBoardFields(updateUniqueFieldPayload, schoolBoardId);

  Object.assign(schoolBoard, updateBody);
  await schoolBoard.save();
  return schoolBoard;
};

export const deleteSchoolBoardById = async (schoolBoardId: string) => {
  const schoolBoard = await getSchoolBoardById(schoolBoardId);
  if (!schoolBoard) {
    throw new ApiError(httpStatus.NOT_FOUND, 'School board not found');
  }

  await schoolBoard.deleteOne();
  await User.updateMany({ schoolBoardId }, { $set: { schoolBoardId: null, schoolId: null } });

  return schoolBoard;
};
