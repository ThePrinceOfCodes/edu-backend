import httpStatus from 'http-status';
import { IUserDoc } from '../users/user.interfaces';
import { ApiError } from '../errors';
import { School } from '../school';
import { ClassModel } from '../class';
import Student from './student.model';
import StudentEnrollment from './studentEnrollment.model';
import { IStudent } from './student.interfaces';
import {
  getAcademicSessionEnrollmentMap,
  getCurrentEnrollmentMap,
  getEffectivePlacement,
  upsertStudentEnrollment,
} from './studentEnrollment.helpers';

type CreateStudentPayload = IStudent & {
  school: string;
  classId: string;
};

type PromoteStudentPayload = {
  school?: string;
  classId: string;
};

const assertStudentReadAccessRole = (actor: IUserDoc) => {
  if (actor.accountType === 'internal') {
    return;
  }

  if (actor.role === 'school-board-admin') {
    if (!actor.schoolBoardId) {
      throw new ApiError(httpStatus.FORBIDDEN, 'School board context is missing for this user');
    }

    return;
  }

  if (actor.role === 'school-admin') {
    if (!actor.schoolId) {
      throw new ApiError(httpStatus.FORBIDDEN, 'School context is missing for this user');
    }

    return;
  }

  if (actor.role === 'guardian') {
    return;
  }

  throw new ApiError(httpStatus.FORBIDDEN, 'You are not allowed to access students');
};

const assertStudentWriteAccessRole = (actor: IUserDoc) => {
  if (actor.accountType === 'internal') {
    return;
  }

  if (actor.role === 'school-board-admin') {
    if (!actor.schoolBoardId) {
      throw new ApiError(httpStatus.FORBIDDEN, 'School board context is missing for this user');
    }

    return;
  }

  if (actor.role === 'school-admin') {
    if (!actor.schoolId) {
      throw new ApiError(httpStatus.FORBIDDEN, 'School context is missing for this user');
    }

    return;
  }

  throw new ApiError(httpStatus.FORBIDDEN, 'Only school board admin or school admin can access students');
};

const validateSchoolAndClass = async (schoolId: string, classId: string, actor: IUserDoc) => {
  const school = await School.findById(schoolId);
  if (!school) {
    throw new ApiError(httpStatus.NOT_FOUND, 'School not found');
  }

  if (actor.accountType !== 'internal') {
    if (actor.role === 'school-admin' && actor.schoolId !== school.id) {
      throw new ApiError(httpStatus.FORBIDDEN, 'Cannot manage students outside your school');
    }

    if (actor.role === 'school-board-admin' && school.schoolBoard !== actor.schoolBoardId) {
      throw new ApiError(httpStatus.FORBIDDEN, 'Cannot manage students outside your school board');
    }
  }

  const classItem = await ClassModel.findById(classId);
  if (!classItem) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Class not found');
  }

  if (school.classes && school.classes.length > 0 && !school.classes.includes(classItem.id)) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'Selected class is not configured for the selected school via school types'
    );
  }

  return { school, classItem };
};

const sortStudents = (students: any[], sortBy?: string) => {
  if (!sortBy) {
    return [...students].sort((left, right) => {
      const leftTime = left.createdAt instanceof Date ? left.createdAt.getTime() : new Date(left.createdAt).getTime();
      const rightTime = right.createdAt instanceof Date ? right.createdAt.getTime() : new Date(right.createdAt).getTime();
      return leftTime - rightTime;
    });
  }

  const [sortField, sortOrder] = sortBy.split(':');
  if (!sortField) {
    return students;
  }
  const direction = sortOrder === 'desc' ? -1 : 1;

  return [...students].sort((left, right) => {
    const leftValue = left[sortField];
    const rightValue = right[sortField];

    if (leftValue === rightValue) {
      return 0;
    }

    if (leftValue === undefined || leftValue === null) {
      return 1;
    }

    if (rightValue === undefined || rightValue === null) {
      return -1;
    }

    return leftValue > rightValue ? direction : -direction;
  });
};

const paginateStudents = (students: any[], options: any) => {
  const limit = options.limit && parseInt(options.limit.toString(), 10) > 0 ? parseInt(options.limit.toString(), 10) : 10;
  const page = options.page && parseInt(options.page.toString(), 10) > 0 ? parseInt(options.page.toString(), 10) : 1;
  const sorted = sortStudents(students, options.sortBy);
  const totalResults = sorted.length;
  const totalPages = Math.ceil(totalResults / limit) || 1;
  const start = (page - 1) * limit;

  return {
    results: sorted.slice(start, start + limit),
    page,
    limit,
    totalPages,
    totalResults,
  };
};

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const serializeStudent = (student: any, placement: any | null) => {
  const json = typeof student.toJSON === 'function' ? student.toJSON() : student;

  return {
    ...json,
    ...(placement
      ? {
          schoolBoard: placement.schoolBoard || null,
          school: placement.school,
          classId: placement.classId,
          currentEnrollment: {
            schoolBoard: placement.schoolBoard || null,
            school: placement.school,
            classId: placement.classId,
            academicSession: placement.academicSession || null,
            academicSessionId: placement.academicSessionId || null,
            isCurrent: placement.isCurrent !== false,
          },
        }
      : { currentEnrollment: null }),
  };
};

const getStudentWithPlacement = async (studentId: string) => {
  const student = await Student.findById(studentId);
  if (!student) {
    return { student: null, placement: null };
  }

  const currentMap = await getCurrentEnrollmentMap([student.id]);
  return {
    student,
    placement: getEffectivePlacement(student as any, null, currentMap.get(student.id)),
  };
};

const canActorAccessPlacement = (
  actor: IUserDoc,
  placement: any | null,
  schoolBoardSchoolIds?: Set<string>
) => {
  if (actor.accountType === 'internal') {
    return true;
  }

  if (!placement) {
    return false;
  }

  if (actor.role === 'school-board-admin') {
    if (placement.schoolBoard === actor.schoolBoardId) {
      return true;
    }

    // Backward-compatible fallback for enrollment rows without schoolBoard.
    return Boolean(schoolBoardSchoolIds && schoolBoardSchoolIds.has(placement.school));
  }

  if (actor.role === 'school-admin') {
    return placement.school === actor.schoolId;
  }

  if (actor.role === 'guardian') {
    const guardianIds = Array.isArray((placement as any)?.guardianIds) ? (placement as any).guardianIds : [];
    return guardianIds.includes(actor.id);
  }

  return false;
};

const createStudentInternal = async (studentBody: CreateStudentPayload, actor: IUserDoc) => {
  assertStudentWriteAccessRole(actor);
  const { school, classItem } = await validateSchoolAndClass(studentBody.school, studentBody.classId, actor);

  const regNumber = studentBody.regNumber.trim().toUpperCase();

  const existingStudent = await Student.findOne({ regNumber });
  if (existingStudent) {
    throw new ApiError(httpStatus.BAD_REQUEST, `Student regNumber already exists: ${regNumber}`);
  }

  const student = await Student.create({
    firstName: studentBody.firstName,
    middleName: studentBody.middleName || null,
    lastName: studentBody.lastName,
    regNumber,
    stateOfOrigin: studentBody.stateOfOrigin,
    localGovernment: studentBody.localGovernment,
    gender: studentBody.gender,
    dateOfBirth: studentBody.dateOfBirth,
    guardianIds: Array.isArray(studentBody.guardianIds) ? studentBody.guardianIds : [],
    status: studentBody.status || 'active',
  });

  const enrollment = await upsertStudentEnrollment({
    studentId: student.id,
    schoolBoardId: school.schoolBoard || null,
    schoolId: school.id,
    classId: classItem.id,
  });

  return serializeStudent(student, enrollment);
};

export const createStudent = async (studentBody: CreateStudentPayload, actor: IUserDoc) => {
  return createStudentInternal(studentBody, actor);
};

export const createStudentsBulk = async (students: CreateStudentPayload[], actor: IUserDoc) => {
  const created: any[] = [];
  const failed: Array<{ row: number; regNumber?: string; reason: string }> = [];

  for (const [index, payload] of students.entries()) {

    try {
      const student = await createStudentInternal(payload, actor);
      created.push(student);
    } catch (error) {
      failed.push({
        row: index + 1,
        regNumber: payload.regNumber,
        reason: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return {
    total: students.length,
    createdCount: created.length,
    failedCount: failed.length,
    created,
    failed,
  };
};

export const queryStudents = async (filter: any, options: any, actor: IUserDoc) => {
  assertStudentReadAccessRole(actor);

  const { q, school, classId, academicSession, academicSessionId, ...studentFilter } = filter;

  if (q && typeof q === 'string' && q.trim()) {
    const safe = escapeRegex(q.trim());
    const searchRegex = new RegExp(safe, 'i');
    studentFilter['$or'] = [
      { firstName: searchRegex },
      { middleName: searchRegex },
      { lastName: searchRegex },
      { regNumber: searchRegex },
      { stateOfOrigin: searchRegex },
      { localGovernment: searchRegex },
    ];
  }

  // Enforce strict school scope for school-admin
  if (actor.accountType !== 'internal' && actor.role === 'school-admin' && school && school !== actor.schoolId) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Cannot access students from another school');
  }

  const students = await Student.find(studentFilter);
  const studentIds = students.map((student) => student.id);
  const currentMap = await getCurrentEnrollmentMap(studentIds);
  const sessionMap = await getAcademicSessionEnrollmentMap(studentIds, academicSession, academicSessionId);

  let schoolBoardSchoolIds: Set<string> | undefined;
  if (actor.accountType !== 'internal' && actor.role === 'school-board-admin' && actor.schoolBoardId) {
    const schools = await School.find({ schoolBoard: actor.schoolBoardId }).select('_id').lean();
    schoolBoardSchoolIds = new Set(schools.map((item: any) => item._id));
  }

  const serialized = students
    .map((student) => {
      const placement = getEffectivePlacement(student as any, sessionMap.get(student.id), currentMap.get(student.id));
      const placementWithGuardianIds = {
        ...(placement || {}),
        guardianIds: Array.isArray((student as any).guardianIds) ? (student as any).guardianIds : [],
      };
      return {
        student,
        placement: placementWithGuardianIds,
      };
    })
    .filter(({ placement }) => canActorAccessPlacement(actor, placement, schoolBoardSchoolIds))
    .filter(({ placement }) => {
      if (school && placement?.school !== school) {
        return false;
      }

      if (classId && placement?.classId !== classId) {
        return false;
      }

      return true;
    })
    .map(({ student, placement }) => serializeStudent(student, placement));

  return paginateStudents(serialized, options);
};

export const getStudentById = async (studentId: string, actor: IUserDoc) => {
  assertStudentReadAccessRole(actor);
  const { student, placement } = await getStudentWithPlacement(studentId);

  const placementWithGuardianIds = {
    ...(placement || {}),
    guardianIds: student && Array.isArray((student as any).guardianIds) ? (student as any).guardianIds : [],
  };

  if (!student || !canActorAccessPlacement(actor, placementWithGuardianIds)) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Student not found');
  }

  return serializeStudent(student, placement);
};

export const updateStudentById = async (studentId: string, updateBody: Partial<IStudent>, actor: IUserDoc) => {
  assertStudentWriteAccessRole(actor);
  const { student, placement } = await getStudentWithPlacement(studentId);

  if (!student || !canActorAccessPlacement(actor, placement)) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Student not found');
  }

  if ((updateBody as any).regNumber) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'regNumber cannot be updated');
  }

  if ((updateBody as any).school || (updateBody as any).classId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Use promote endpoint to change school or class');
  }

  Object.assign(student, updateBody);
  await student.save();

  return serializeStudent(student, placement);
};

export const promoteStudentById = async (studentId: string, payload: PromoteStudentPayload, actor: IUserDoc) => {
  assertStudentWriteAccessRole(actor);
  const { student, placement } = await getStudentWithPlacement(studentId);

  if (!student || !canActorAccessPlacement(actor, placement)) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Student not found');
  }

  const nextSchoolId = payload.school || placement?.school;

  if (!nextSchoolId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'school is required to place this student');
  }

  const { school, classItem } = await validateSchoolAndClass(nextSchoolId, payload.classId, actor);

  if (placement?.school === school.id && placement?.classId === classItem.id) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Student is already in the selected class and school');
  }

  const enrollment = await upsertStudentEnrollment({
    studentId: student.id,
    schoolBoardId: school.schoolBoard || null,
    schoolId: school.id,
    classId: classItem.id,
  });

  return serializeStudent(student, enrollment);
};

export const deleteStudentById = async (studentId: string, actor: IUserDoc) => {
  assertStudentWriteAccessRole(actor);
  const { student, placement } = await getStudentWithPlacement(studentId);

  if (!student || !canActorAccessPlacement(actor, placement)) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Student not found');
  }

  await StudentEnrollment.deleteMany({ student: student.id });
  await student.deleteOne();
  return serializeStudent(student, placement);
};
