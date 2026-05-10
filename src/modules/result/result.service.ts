import httpStatus from 'http-status';
import { ApiError } from '../errors';
import { IUserDoc } from '../users/user.interfaces';
import School from '../school/school.model';
import Student from '../student/student.model';
import StudentEnrollment from '../student/studentEnrollment.model';
import ClassModel from '../class/class.model';
import Term from '../term/term.model';
import AcademicSession from '../academic-session/academicSession.model';
import Result from './result.model';
import { IResult } from './result.interfaces';

type CreateResultPayload = {
  student: string;
  school: string;
  classId: string;
  termId: string;
  academicSessionId: string;
  subject: string;
  testScore: number;
  examScore: number;
  remark?: string | null;
  assessmentDate?: Date;
};

type UpdateResultPayload = Partial<Pick<IResult, 'subject' | 'testScore' | 'examScore' | 'remark' | 'assessmentDate'>>;

const buildAccessFilter = (actor: IUserDoc) => {
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

    return { school: actor.schoolId };
  }

  throw new ApiError(httpStatus.FORBIDDEN, 'You are not allowed to access results');
};

const ensureActorCanWriteToSchool = async (actor: IUserDoc, schoolId: string) => {
  const school = await School.findById(schoolId);
  if (!school) {
    throw new ApiError(httpStatus.NOT_FOUND, 'School not found');
  }

  if (!school.schoolBoard) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'School board is missing for this school');
  }

  if (actor.accountType !== 'internal') {
    if (actor.role === 'school-board-admin') {
      if (!actor.schoolBoardId || school.schoolBoard !== actor.schoolBoardId) {
        throw new ApiError(httpStatus.FORBIDDEN, 'School is outside your school board');
      }
    }

    if (actor.role === 'school-admin' || actor.role === 'teacher' || actor.role === 'staff') {
      if (!actor.schoolId || actor.schoolId !== school.id) {
        throw new ApiError(httpStatus.FORBIDDEN, 'Cannot create results for another school');
      }
    }
  }

  return school;
};

const ensureResultPlacementValid = async (payload: CreateResultPayload, schoolBoardId: string) => {
  const [student, classDoc, term, academicSession] = await Promise.all([
    Student.findById(payload.student),
    ClassModel.findById(payload.classId),
    Term.findById(payload.termId),
    AcademicSession.findById(payload.academicSessionId),
  ]);

  if (!student) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Student not found');
  }

  if (!classDoc) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Class not found');
  }

  if (!term) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Term not found');
  }

  if (!academicSession) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Academic session not found');
  }

  if (term.schoolBoard !== schoolBoardId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Term does not belong to this school board');
  }

  if (term.school && term.school !== payload.school) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Term does not belong to this school');
  }

  if (academicSession.schoolBoard !== schoolBoardId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Academic session does not belong to this school board');
  }

  const sessionLabel = academicSession.name || `${academicSession.startYear}/${academicSession.endYear}`;
  const enrollment = await StudentEnrollment.findOne({
    student: payload.student,
    school: payload.school,
    classId: payload.classId,
    $or: [{ academicSessionId: payload.academicSessionId }, { academicSession: sessionLabel }],
  });

  const fallbackPlacementMatches = student.school === payload.school && student.classId === payload.classId;

  if (!enrollment && !fallbackPlacementMatches) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'Student is not enrolled in the selected school/class for the selected academic session'
    );
  }
};

const ensureCanAccessResult = (actor: IUserDoc, resultDoc: any) => {
  if (actor.accountType === 'internal') {
    return;
  }

  if (actor.role === 'school-board-admin') {
    if (!actor.schoolBoardId || resultDoc.schoolBoard !== actor.schoolBoardId) {
      throw new ApiError(httpStatus.FORBIDDEN, 'Result is outside your school board');
    }
    return;
  }

  if (actor.role === 'school-admin' || actor.role === 'teacher' || actor.role === 'staff') {
    if (!actor.schoolId || resultDoc.school !== actor.schoolId) {
      throw new ApiError(httpStatus.FORBIDDEN, 'Result is outside your school');
    }
    return;
  }

  throw new ApiError(httpStatus.FORBIDDEN, 'You are not allowed to access results');
};

export const createResult = async (payload: CreateResultPayload, actor: IUserDoc) => {
  const school = await ensureActorCanWriteToSchool(actor, payload.school);
  await ensureResultPlacementValid(payload, school.schoolBoard);

  const normalizedSubject = payload.subject.trim();
  const totalScore = payload.testScore + payload.examScore;

  return Result.create({
    student: payload.student,
    schoolBoard: school.schoolBoard,
    school: school.id,
    classId: payload.classId,
    termId: payload.termId,
    academicSessionId: payload.academicSessionId,
    subject: normalizedSubject,
    testScore: payload.testScore,
    examScore: payload.examScore,
    totalScore,
    remark: payload.remark || null,
    assessmentDate: payload.assessmentDate || new Date(),
    recordedBy: actor.id,
  });
};

export const queryResults = async (filter: any, options: any, actor: IUserDoc) => {
  const accessFilter = buildAccessFilter(actor);
  return Result.paginate({ ...filter, ...accessFilter }, options);
};

export const getResultById = async (resultId: string, actor: IUserDoc) => {
  const resultDoc = await Result.findById(resultId);
  if (!resultDoc) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Result not found');
  }

  ensureCanAccessResult(actor, resultDoc);
  return resultDoc;
};

export const updateResultById = async (resultId: string, payload: UpdateResultPayload, actor: IUserDoc) => {
  const resultDoc = await getResultById(resultId, actor);

  if (payload.subject !== undefined) {
    resultDoc.subject = payload.subject.trim();
  }

  if (payload.testScore !== undefined) {
    resultDoc.testScore = payload.testScore;
  }

  if (payload.examScore !== undefined) {
    resultDoc.examScore = payload.examScore;
  }

  if (payload.remark !== undefined) {
    resultDoc.remark = payload.remark || null;
  }

  if (payload.assessmentDate !== undefined) {
    resultDoc.assessmentDate = payload.assessmentDate;
  }

  resultDoc.totalScore = resultDoc.testScore + resultDoc.examScore;

  await resultDoc.save();
  return resultDoc;
};

export const deleteResultById = async (resultId: string, actor: IUserDoc) => {
  const resultDoc = await getResultById(resultId, actor);
  await resultDoc.deleteOne();
  return resultDoc;
};
