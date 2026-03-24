import httpStatus from 'http-status';
import { ApiError } from '../errors';
import { IUserDoc } from '../users/user.interfaces';
import { SchoolBoard } from '../school-board';
import AcademicSession from './academicSession.model';
import { IAcademicSession } from './academicSession.interfaces';

type CreateAcademicSessionPayload = Omit<IAcademicSession, 'schoolBoard'> & {
  schoolBoard?: string;
};

const buildAcademicSessionAccessFilter = (actor: IUserDoc) => {
  if (actor.accountType === 'internal') {
    return {};
  }

  if (actor.role === 'school-board-admin') {
    if (!actor.schoolBoardId) {
      throw new ApiError(httpStatus.FORBIDDEN, 'School board context is missing for this user');
    }

    return { schoolBoard: actor.schoolBoardId };
  }

  throw new ApiError(httpStatus.FORBIDDEN, 'Only school board admin can access academic sessions');
};

const resolveSchoolBoardForWrite = (payloadSchoolBoard: string | undefined, actor: IUserDoc) => {
  if (actor.accountType === 'internal') {
    if (!payloadSchoolBoard) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'schoolBoard is required');
    }

    return payloadSchoolBoard;
  }

  if (actor.role === 'school-board-admin' && actor.schoolBoardId) {
    if (payloadSchoolBoard && payloadSchoolBoard !== actor.schoolBoardId) {
      throw new ApiError(httpStatus.FORBIDDEN, 'Cannot manage sessions outside your school board');
    }

    return actor.schoolBoardId;
  }

  throw new ApiError(httpStatus.FORBIDDEN, 'Only school board admin can manage academic sessions');
};

const ensureSessionYearsValid = (startYear: number, endYear: number) => {
  if (endYear !== startYear + 1) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'endYear must be startYear + 1');
  }
};

const deactivateOtherSessions = async (schoolBoard: string, currentId?: string) => {
  const filter: Record<string, any> = { schoolBoard, isActive: true };

  if (currentId) {
    filter['_id'] = { $ne: currentId };
  }

  await AcademicSession.updateMany(filter, { $set: { isActive: false } });
};

export const createAcademicSession = async (payload: CreateAcademicSessionPayload, actor: IUserDoc) => {
  ensureSessionYearsValid(payload.startYear, payload.endYear);

  const schoolBoardId = resolveSchoolBoardForWrite(payload.schoolBoard, actor);
  const schoolBoard = await SchoolBoard.findById(schoolBoardId);

  if (!schoolBoard) {
    throw new ApiError(httpStatus.NOT_FOUND, 'School board not found');
  }

  const existing = await AcademicSession.findOne({
    schoolBoard: schoolBoardId,
    startYear: payload.startYear,
    endYear: payload.endYear,
  });

  if (existing) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Academic session already exists for this school board');
  }

  if (payload.isActive) {
    await deactivateOtherSessions(schoolBoardId);
  }

  const name = payload.name?.trim() || `${payload.startYear}/${payload.endYear}`;

  return AcademicSession.create({
    name,
    startYear: payload.startYear,
    endYear: payload.endYear,
    schoolBoard: schoolBoardId,
    isActive: payload.isActive || false,
  });
};

export const queryAcademicSessions = async (filter: any, options: any, actor: IUserDoc) => {
  const accessFilter = buildAcademicSessionAccessFilter(actor);
  return AcademicSession.paginate({ ...filter, ...accessFilter }, options);
};

export const getAcademicSessionById = async (academicSessionId: string, actor: IUserDoc) => {
  const accessFilter = buildAcademicSessionAccessFilter(actor);
  const found = await AcademicSession.findOne({ _id: academicSessionId, ...accessFilter });

  if (!found) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Academic session not found');
  }

  return found;
};

export const updateAcademicSessionById = async (
  academicSessionId: string,
  payload: Partial<IAcademicSession>,
  actor: IUserDoc
) => {
  const found = await getAcademicSessionById(academicSessionId, actor);

  const startYear = payload.startYear ?? found.startYear;
  const endYear = payload.endYear ?? found.endYear;
  ensureSessionYearsValid(startYear, endYear);

  if (payload.isActive) {
    await deactivateOtherSessions(found.schoolBoard, found.id);
  }

  if (payload.name !== undefined) {
    found.name = payload.name || `${startYear}/${endYear}`;
  }

  found.startYear = startYear;
  found.endYear = endYear;

  if (payload.isActive !== undefined) {
    found.isActive = payload.isActive;
  }

  await found.save();

  return found;
};

export const deleteAcademicSessionById = async (academicSessionId: string, actor: IUserDoc) => {
  const found = await getAcademicSessionById(academicSessionId, actor);
  await found.deleteOne();
  return found;
};
