import httpStatus from 'http-status';
import { ApiError } from '../errors';
import { IUserDoc } from '../users/user.interfaces';
import { School } from '../school';
import Term from './term.model';
import { ITerm } from './term.interfaces';

type CreateTermPayload = Omit<ITerm, 'name' | 'schoolBoard' | 'school'> & {
  schoolBoard?: string;
  school?: string | null;
};

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTH_NAMES_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const formatFriendlyDate = (value: Date) => {
  const dayName = DAY_NAMES[value.getUTCDay()];
  const day = value.getUTCDate();
  const month = MONTH_NAMES_SHORT[value.getUTCMonth()];
  return `${dayName} ${day} ${month}`;
};

const buildGeneratedTermName = (
  academicSession: string,
  termName: string,
  startDate: Date,
  endDate: Date
) => {
  const dateRange = `${formatFriendlyDate(startDate)} - ${formatFriendlyDate(endDate)}`;
  return `${academicSession} - ${termName} - (${dateRange})`;
};

const getNow = () => new Date();

const buildBoardWideSchoolClauses = () => [{ school: null }, { school: { $exists: false } }];

const buildBoardWideTermFilter = (schoolBoardId: string) => ({
  schoolBoard: schoolBoardId,
  $or: buildBoardWideSchoolClauses(),
});

const buildScopedTermFilter = (schoolBoardId: string, schoolId: string | null) => {
  if (schoolId) {
    return {
      schoolBoard: schoolBoardId,
      school: schoolId,
    };
  }

  return buildBoardWideTermFilter(schoolBoardId);
};

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
      $or: [{ school: schoolId }, ...buildBoardWideSchoolClauses()],
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

const disableActiveTermsInSameScope = async (schoolBoardId: string, schoolId: string | null, currentTermId?: string) => {
  const filter: Record<string, any> = {
    ...buildScopedTermFilter(schoolBoardId, schoolId),
    isActive: true,
  };

  if (currentTermId) {
    filter['_id'] = { $ne: currentTermId };
  }

  await Term.updateMany(filter, { $set: { isActive: false } });
};

export const getActiveTermForSchoolBoard = async (schoolBoardId: string) => {
  const now = getNow();

  return Term.findOne({
    ...buildBoardWideTermFilter(schoolBoardId),
    isActive: true,
    startDate: { $lte: now },
    endDate: { $gte: now },
  }).sort({ startDate: -1 });
};

export const getActiveTermForSchool = async (schoolId: string) => {
  const school = await School.findById(schoolId);

  if (!school) {
    throw new ApiError(httpStatus.NOT_FOUND, 'School not found');
  }

  if (!school.schoolBoard) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'School does not belong to a school board');
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

  const boardTerm = await getActiveTermForSchoolBoard(school.schoolBoard);

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
  if (actor.role !== 'school-board-admin' && actor.role !== 'school-admin') {
    throw new ApiError(httpStatus.FORBIDDEN, 'Only school board admin and school admin can create terms');
  }

  const startDate = new Date(payload.startDate);
  const endDate = new Date(payload.endDate);
  ensureDateRangeValid(startDate, endDate);

  const { schoolBoardId, schoolId } = await resolveSchoolBoardAndSchool(payload, actor);

  const normalizedTermName = payload.termName.trim();
  const generatedName = buildGeneratedTermName(payload.academicSession, normalizedTermName, startDate, endDate);

  const existing = await Term.findOne({
    ...buildScopedTermFilter(schoolBoardId, schoolId),
    academicSession: payload.academicSession,
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
    academicSession: payload.academicSession,
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

  if (payload.schoolBoard || payload.academicSession) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'schoolBoard and academicSession cannot be updated');
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
      ...buildScopedTermFilter(found.schoolBoard, schoolId),
      academicSession: found.academicSession,
      termName: nextTermName,
    });

    if (duplicate) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Term already exists for this scope and academic session');
    }
  }

  const generatedName = buildGeneratedTermName(found.academicSession, nextTermName, startDate, endDate);

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
