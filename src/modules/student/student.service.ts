import httpStatus from 'http-status';
import { IUserDoc } from '../users/user.interfaces';
import { ApiError } from '../errors';
import { School } from '../school';
import { ClassModel } from '../class';
import Student from './student.model';
import { IStudent } from './student.interfaces';

type CreateStudentPayload = Omit<IStudent, 'schoolBoard' | 'promotionHistory'>;

type PromoteStudentPayload = {
  school?: string;
  classId: string;
};

const buildStudentAccessFilter = (actor: IUserDoc) => {
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

const createStudentInternal = async (studentBody: CreateStudentPayload, actor: IUserDoc) => {
  const { school, classItem } = await validateSchoolAndClass(studentBody.school, studentBody.classId, actor);

  const regNumber = studentBody.regNumber.trim().toUpperCase();

  const existingStudent = await Student.findOne({ regNumber });
  if (existingStudent) {
    throw new ApiError(httpStatus.BAD_REQUEST, `Student regNumber already exists: ${regNumber}`);
  }

  return Student.create({
    firstName: studentBody.firstName,
    middleName: studentBody.middleName || null,
    lastName: studentBody.lastName,
    regNumber,
    stateOfOrigin: studentBody.stateOfOrigin,
    localGovernment: studentBody.localGovernment,
    gender: studentBody.gender,
    dateOfBirth: studentBody.dateOfBirth,
    schoolBoard: school.schoolBoard || null,
    school: school.id,
    classId: classItem.id,
    status: studentBody.status || 'active',
    promotionHistory: [
      {
        fromSchool: null,
        toSchool: school.id,
        fromClassId: null,
        toClassId: classItem.id,
        action: 'created',
        changedAt: new Date(),
      },
    ],
  });
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
  const accessFilter = buildStudentAccessFilter(actor);
  return Student.paginate({ ...filter, ...accessFilter }, options);
};

export const getStudentById = async (studentId: string, actor: IUserDoc) => {
  const accessFilter = buildStudentAccessFilter(actor);
  const student = await Student.findOne({ _id: studentId, ...accessFilter });

  if (!student) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Student not found');
  }

  return student;
};

export const updateStudentById = async (studentId: string, updateBody: Partial<IStudent>, actor: IUserDoc) => {
  const student = await getStudentById(studentId, actor);

  if (updateBody.regNumber) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'regNumber cannot be updated');
  }

  if (updateBody.school || updateBody.classId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Use promote endpoint to change school or class');
  }

  Object.assign(student, updateBody);
  await student.save();

  return student;
};

export const promoteStudentById = async (studentId: string, payload: PromoteStudentPayload, actor: IUserDoc) => {
  const student = await getStudentById(studentId, actor);
  const nextSchoolId = payload.school || student.school;

  const { school, classItem } = await validateSchoolAndClass(nextSchoolId, payload.classId, actor);

  if (student.school === school.id && student.classId === classItem.id) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Student is already in the selected class and school');
  }

  const action = student.school === school.id ? 'promoted' : 'transferred';

  student.promotionHistory = [
    ...(student.promotionHistory || []),
    {
      fromSchool: student.school,
      toSchool: school.id,
      fromClassId: student.classId,
      toClassId: classItem.id,
      action,
      changedAt: new Date(),
    },
  ];

  student.school = school.id;
  student.schoolBoard = school.schoolBoard || null;
  student.classId = classItem.id;

  await student.save();

  return student;
};

export const deleteStudentById = async (studentId: string, actor: IUserDoc) => {
  const student = await getStudentById(studentId, actor);
  await student.deleteOne();
  return student;
};
