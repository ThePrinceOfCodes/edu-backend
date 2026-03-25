import httpStatus from 'http-status';
import { ApiError } from '../errors';
import { IUserDoc } from '../users/user.interfaces';
import { AcademicSession } from '../academic-session';
import { School } from '../school';
import Term from './term.model';
import { ITerm } from './term.interfaces';

type CreateTermPayload = Omit<ITerm, 'name' | 'schoolBoard' | 'school'> & {
  schoolBoard?: string;
  school?: string | null;
};

const formatDatePart = (value: Date) => {
  return value.toISOString().slice(0, 10);
};

const buildGeneratedTermName = (
  academicSession: { startYear: number; endYear: number },
  termName: string,
  startDate: Date,
  endDate: Date
) => {
  const academicYear = `${academicSession.startYear}/${academicSession.endYear}`;
  const dateRange = `${formatDatePart(startDate)} - ${formatDatePart(endDate)}`;
  return `${academicYear} ${termName} (${dateRange})`;
};

const getNow = () => new Date();

const buildTermAccessFilter = (actor: IUserDoc) => {
  if (actor.accountType === 'internal') {
    return {};
  }

  if (actor.role === 'school-board-admin') {
    if (!actor.schoolBoardId) {
      throw new ApiError(httpStatus.FORBIDDEN, 'School board context is missing for this user');
    }

    return { schoolBoard: actor.schoolBoardId };
  }

  if (actor.role === 'school-admin' || actor.role === 'teacher' || actor.role === 'staff') {
    if (!actor.schoolId) {
      throw new ApiError(httpStatus.FORBIDDEN, 'School context is missing for this user');
    }

    const schoolId = actor.schoolId;
    return {
      $or: [{ school: schoolId }, { school: null }],
    };
  }

  throw new ApiError(httpStatus.FORBIDDEN, 'You are not allowed to access terms');
};

const ensureDateRangeValid = (startDate: Date, endDate: Date) => {
  if (endDate < startDate) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'endDate must be after startDate');
  }
};

const resolveSchoolBoardAndSchool = async (
  payload: { schoolBoard?: string; school?: string | null },
  actor: IUserDoc
) => {
  let schoolBoardId = payload.schoolBoard || null;
  let schoolId = payload.school || null;

  if (actor.accountType !== 'internal') {
    if (actor.role === 'school-admin') {
      if (!actor.schoolId || !actor.schoolBoardId) {
        throw new ApiError(httpStatus.FORBIDDEN, 'School context is missing for this user');
      }

      if (schoolId && schoolId !== actor.schoolId) {
        throw new ApiError(httpStatus.FORBIDDEN, 'Cannot create terms outside your school');
      }

      schoolBoardId = actor.schoolBoardId;
      schoolId = actor.schoolId;
    } else {
      if (actor.role !== 'school-board-admin' || !actor.schoolBoardId) {
        throw new ApiError(httpStatus.FORBIDDEN, 'Only school board admin or school admin can create terms');
      }

      if (schoolBoardId && schoolBoardId !== actor.schoolBoardId) {
        throw new ApiError(httpStatus.FORBIDDEN, 'Cannot create terms outside your school board');
      }

      schoolBoardId = actor.schoolBoardId;
    }
  }

  if (!schoolBoardId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'schoolBoard is required');
  }

  if (schoolId) {
    const school = await School.findById(schoolId);

    if (!school) {
      throw new ApiError(httpStatus.NOT_FOUND, 'School not found');
    }

    if (school.schoolBoard !== schoolBoardId) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'School does not belong to the selected school board');
    }
  }

  return { schoolBoardId, schoolId };
};

const ensureAcademicSessionInSchoolBoard = async (academicSessionId: string, schoolBoardId: string) => {
  const academicSession = await AcademicSession.findById(academicSessionId);

  if (!academicSession) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Academic session not found');
  }

  if (academicSession.schoolBoard !== schoolBoardId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Academic session does not belong to the selected school board');
  }

  return academicSession;
};

const disableActiveTermsInSameScope = async (schoolBoardId: string, schoolId: string | null, currentTermId?: string) => {
  const filter: Record<string, any> = {
    schoolBoard: schoolBoardId,
    school: schoolId,
    isActive: true,
  };

  if (currentTermId) {
    filter['_id'] = { $ne: currentTermId };
  }

  await Term.updateMany(filter, { $set: { isActive: false } });
};

export const getActiveTermForSchool = async (schoolId: string) => {
  const school = await School.findById(schoolId);

  if (!school) {
    throw new ApiError(httpStatus.NOT_FOUND, 'School not found');
  }

  const now = getNow();

  const schoolTerm = await Term.findOne({
    school: schoolId,
    isActive: true,
    startDate: { $lte: now },
    endDate: { $gte: now },
  }).sort({ startDate: -1 });

  if (schoolTerm) {
    return schoolTerm;
  }

  const boardTerm = await Term.findOne({
    schoolBoard: school.schoolBoard,
    school: null,
    isActive: true,
    startDate: { $lte: now },
    endDate: { $gte: now },
  }).sort({ startDate: -1 });

  return boardTerm;
};

export const getActiveTermForRequest = async (actor: IUserDoc, schoolId?: string) => {
  let effectiveSchoolId = schoolId;

  if (actor.accountType !== 'internal') {
    if (actor.role === 'school-admin' || actor.role === 'teacher' || actor.role === 'staff') {
      if (!actor.schoolId) {
        throw new ApiError(httpStatus.FORBIDDEN, 'School context is missing for this user');
      }

      if (effectiveSchoolId && effectiveSchoolId !== actor.schoolId) {
        throw new ApiError(httpStatus.FORBIDDEN, 'Cannot access active term for another school');
      }

      effectiveSchoolId = actor.schoolId;
    }

    if (actor.role === 'school-board-admin') {
      if (!actor.schoolBoardId) {
        throw new ApiError(httpStatus.FORBIDDEN, 'School board context is missing for this user');
      }

      if (!effectiveSchoolId) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'school is required for school-board-admin');
      }

      const school = await School.findById(effectiveSchoolId);
      if (!school || school.schoolBoard !== actor.schoolBoardId) {
        throw new ApiError(httpStatus.FORBIDDEN, 'School is outside your school board');
      }
    }
  }

  if (!effectiveSchoolId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'school is required');
  }

  const activeTerm = await getActiveTermForSchool(effectiveSchoolId);

  if (!activeTerm) {
    throw new ApiError(httpStatus.NOT_FOUND, 'No active term found for the school');
  }

  return activeTerm;
};

export const createTerm = async (payload: CreateTermPayload, actor: IUserDoc) => {
  const startDate = new Date(payload.startDate);
  const endDate = new Date(payload.endDate);
  ensureDateRangeValid(startDate, endDate);

  const { schoolBoardId, schoolId } = await resolveSchoolBoardAndSchool(payload, actor);

  const academicSession = await ensureAcademicSessionInSchoolBoard(payload.academicSessionId, schoolBoardId);

  const normalizedTermName = payload.termName.trim();
  const generatedName = buildGeneratedTermName(academicSession, normalizedTermName, startDate, endDate);

  const existing = await Term.findOne({
    schoolBoard: schoolBoardId,
    school: schoolId,
    academicSessionId: payload.academicSessionId,
    termName: normalizedTermName,
  });

  if (existing) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Term already exists for this scope and academic session');
  }

  if (payload.isActive) {
    await disableActiveTermsInSameScope(schoolBoardId, schoolId);
  }

  return Term.create({
    name: generatedName,
    termName: normalizedTermName,
    academicSessionId: payload.academicSessionId,
    schoolBoard: schoolBoardId,
    school: schoolId,
    startDate,
    endDate,
    isActive: payload.isActive || false,
  });
};

export const queryTerms = async (filter: any, options: any, actor: IUserDoc) => {
  const accessFilter = buildTermAccessFilter(actor);
  return Term.paginate({ ...filter, ...accessFilter }, options);
};

export const getTermById = async (termId: string, actor: IUserDoc) => {
  const accessFilter = buildTermAccessFilter(actor);
  const found = await Term.findOne({ _id: termId, ...accessFilter });

  if (!found) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Term not found');
  }

  return found;
};

export const updateTermById = async (termId: string, payload: Partial<ITerm>, actor: IUserDoc) => {
  const found = await getTermById(termId, actor);

  if (payload.schoolBoard || payload.academicSessionId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'schoolBoard and academicSessionId cannot be updated');
  }

  let schoolId = found.school || null;

  if (payload.school !== undefined) {
    if (actor.accountType !== 'internal' && actor.role !== 'school-board-admin') {
      throw new ApiError(httpStatus.FORBIDDEN, 'Only school board admin can change term scope');
    }

    schoolId = payload.school || null;

    if (schoolId) {
      const school = await School.findById(schoolId);
      if (!school) {
        throw new ApiError(httpStatus.NOT_FOUND, 'School not found');
      }

      if (school.schoolBoard !== found.schoolBoard) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'School does not belong to the term school board');
      }
    }
  }

  const startDate = payload.startDate ? new Date(payload.startDate) : found.startDate;
  const endDate = payload.endDate ? new Date(payload.endDate) : found.endDate;
  ensureDateRangeValid(startDate, endDate);

  const nextTermName = payload.termName !== undefined ? payload.termName.trim() : found.termName;

  if (!nextTermName) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'termName is required');
  }

  if (payload.termName !== undefined || payload.startDate !== undefined || payload.endDate !== undefined) {
    const duplicate = await Term.findOne({
      _id: { $ne: found.id },
      schoolBoard: found.schoolBoard,
      school: schoolId,
      academicSessionId: found.academicSessionId,
      termName: nextTermName,
    });

    if (duplicate) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Term already exists for this scope and academic session');
    }
  }

  const academicSession = await ensureAcademicSessionInSchoolBoard(found.academicSessionId, found.schoolBoard);
  const generatedName = buildGeneratedTermName(academicSession, nextTermName, startDate, endDate);

  if (payload.isActive) {
    await disableActiveTermsInSameScope(found.schoolBoard, schoolId, found.id);
  }

  found.name = generatedName;
  found.termName = nextTermName;
  found.school = schoolId;
  found.startDate = startDate;
  found.endDate = endDate;

  if (payload.isActive !== undefined) {
    found.isActive = payload.isActive;
  }

  await found.save();

  return found;
};

export const deleteTermById = async (termId: string, actor: IUserDoc) => {
  const found = await getTermById(termId, actor);
  await found.deleteOne();
  return found;
};
