import httpStatus from 'http-status';
import { Auth, authService } from '../auth';
import { ApiError } from '../errors';
import { IUserDoc } from '../users/user.interfaces';
import { userService, User } from '../users';
import { SchoolBoard } from '../school-board';
import { SchoolType } from '../school-type';
import { ClassModel } from '../class';
import School from './school.model';
import { ISchool } from './school.interfaces';

type CreateSchoolPayload = Omit<ISchool, 'adminUser' | 'classes'> & {
  adminUserId?: string;
  admin?: {
    name: string;
    email: string;
    password: string;
    phoneNumber?: string;
  };
};

const buildSchoolAccessFilter = (actor: IUserDoc) => {
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

    return { _id: actor.schoolId };
  }

  throw new ApiError(httpStatus.FORBIDDEN, 'Only school board admin or school admin can access schools');
};

const resolveSchoolBoardIdForCreate = (payloadSchoolBoard: string | null | undefined, actor: IUserDoc) => {
  const normalizedPayloadSchoolBoard = payloadSchoolBoard ? payloadSchoolBoard : null;

  if (actor.accountType === 'internal') {
    return normalizedPayloadSchoolBoard;
  }

  if (!actor.schoolBoardId) {
    throw new ApiError(httpStatus.FORBIDDEN, 'School board context is missing for this user');
  }

  if (normalizedPayloadSchoolBoard && normalizedPayloadSchoolBoard !== actor.schoolBoardId) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Cannot create a school outside your school board');
  }

  return actor.schoolBoardId;
};

const resolveSchoolAdminUser = async (schoolBoardId: string | null, payload: CreateSchoolPayload) => {
  if (payload.adminUserId && payload.admin) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Provide either adminUserId or admin payload, not both');
  }

  if (payload.adminUserId) {
    const adminUser = await userService.getUserById(payload.adminUserId);
    if (!adminUser) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Assigned school admin user not found');
    }

    adminUser.accountType = 'client';
    adminUser.role = 'school-admin';
    adminUser.schoolBoardId = schoolBoardId;
    await adminUser.save();

    return adminUser;
  }

  if (!payload.admin) {
    return null;
  }

  if (await Auth.isEmailTaken(payload.admin.email)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'School admin email already taken');
  }

  const adminUser = await userService.createUser({
    name: payload.admin.name,
    email: payload.admin.email,
    accountType: 'client',
    role: 'school-admin',
    schoolBoardId,
    isVerified: true,
    ...(payload.admin.phoneNumber ? { phoneNumber: payload.admin.phoneNumber } : {}),
  });

  await authService.createAuth({
    user: adminUser.id,
    email: payload.admin.email,
    password: payload.admin.password,
    provider: 'email',
  });

  return adminUser;
};

const resolveSchoolTypeAndClassSelection = async (schoolTypeIds: string[] | undefined) => {
  const normalizedSchoolTypeIds = [...new Set((schoolTypeIds || []).filter(Boolean))];

  if (normalizedSchoolTypeIds.length === 0) {
    return { schoolTypes: [], classes: [] };
  }

  const schoolTypes = await SchoolType.find({ _id: { $in: normalizedSchoolTypeIds } });

  if (schoolTypes.length !== normalizedSchoolTypeIds.length) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'One or more school types are invalid');
  }

  const classes = await ClassModel.find({ schoolTypeId: { $in: normalizedSchoolTypeIds } });

  return {
    schoolTypes: normalizedSchoolTypeIds,
    classes: classes.map((item) => item.id),
  };
};

export const createSchool = async (schoolBody: CreateSchoolPayload, actor: IUserDoc) => {
  const schoolBoardId = resolveSchoolBoardIdForCreate(schoolBody.schoolBoard, actor);
  const schoolTypeSelection = await resolveSchoolTypeAndClassSelection(schoolBody.schoolTypes);

  if (schoolBoardId) {
    const schoolBoard = await SchoolBoard.findById(schoolBoardId);
    if (!schoolBoard) {
      throw new ApiError(httpStatus.NOT_FOUND, 'School board not found');
    }
  }

  const existingSchool = await School.findOne({ name: schoolBody.name, schoolBoard: schoolBoardId || null });
  if (existingSchool) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'School already exists in this scope');
  }

  const adminUser = await resolveSchoolAdminUser(schoolBoardId, schoolBody);

  const school = await School.create({
    name: schoolBody.name,
    schoolBoard: schoolBoardId || null,
    schoolTypes: schoolTypeSelection.schoolTypes,
    classes: schoolTypeSelection.classes,
    adminUser: adminUser?.id ?? null,
    address: schoolBody.address,
    state: schoolBody.state,
    localGovernment: schoolBody.localGovernment,
    district: schoolBody.district,
    longitude: schoolBody.longitude,
    latitude: schoolBody.latitude,
    status: schoolBody.status,
  });

  if (adminUser) {
    adminUser.schoolId = school.id;
    await adminUser.save();
  }

  return school;
};

export const querySchools = async (filter: any, options: any, actor: IUserDoc) => {
  const accessFilter = buildSchoolAccessFilter(actor);
  return School.paginate({ ...filter, ...accessFilter }, options);
};

export const getSchoolById = async (schoolId: string, actor: IUserDoc) => {
  const accessFilter = buildSchoolAccessFilter(actor);
  const school = await School.findOne({ _id: schoolId, ...accessFilter });

  if (!school) {
    throw new ApiError(httpStatus.NOT_FOUND, 'School not found');
  }

  return school;
};

export const updateSchoolById = async (schoolId: string, updateBody: Partial<ISchool>, actor: IUserDoc) => {
  const school = await getSchoolById(schoolId, actor);

  if (updateBody.name) {
    const existingSchool = await School.findOne({
      _id: { $ne: schoolId },
      schoolBoard: school.schoolBoard || null,
      name: updateBody.name,
    });

    if (existingSchool) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'School name already exists in this school board');
    }
  }

  if (updateBody.schoolTypes) {
    const schoolTypeSelection = await resolveSchoolTypeAndClassSelection(updateBody.schoolTypes);
    updateBody.schoolTypes = schoolTypeSelection.schoolTypes;
    updateBody.classes = schoolTypeSelection.classes;
  }

  Object.assign(school, updateBody);
  await school.save();

  return school;
};

export const deleteSchoolById = async (schoolId: string, actor: IUserDoc) => {
  const school = await getSchoolById(schoolId, actor);

  await school.deleteOne();
  await User.updateMany({ schoolId: school.id }, { $set: { schoolId: null } });

export const createSchoolsBulk = async (schools: CreateSchoolPayload[], actor: IUserDoc) => {
  const created: any[] = [];
  const failed: Array<{ row: number; name?: string; reason: string }> = [];

  for (const [index, payload] of schools.entries()) {
    try {
      const school = await createSchool(payload, actor);
      created.push(school);
    } catch (error) {
      failed.push({
        row: index + 1,
        name: payload.name,
        reason: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return {
    total: schools.length,
    createdCount: created.length,
    failedCount: failed.length,
    created,
    failed,
  };
};

  return school;
};
