import httpStatus from 'http-status';
import { ApiError } from '../errors';
import AcademicSession from '../academic-session/academicSession.model';
import Student from './student.model';
import StudentEnrollment from './studentEnrollment.model';

export type StudentPlacement = {
  schoolBoard?: string | null;
  school: string;
  classId: string;
  academicSession?: string | null;
  academicSessionId?: string | null;
  isCurrent?: boolean;
};

export const getLegacyPlacement = (student: any): StudentPlacement | null => {
  if (!student?.school || !student?.classId) {
    return null;
  }

  return {
    schoolBoard: student.schoolBoard || null,
    school: student.school,
    classId: student.classId,
    academicSession: null,
    academicSessionId: null,
    isCurrent: true,
  };
};

export const getCurrentEnrollmentMap = async (studentIds: string[]) => {
  if (studentIds.length === 0) {
    return new Map<string, any>();
  }

  const enrollments = await StudentEnrollment.find({
    student: { $in: studentIds },
    isCurrent: true,
  });

  return new Map(enrollments.map((item) => [item.student, item]));
};

export const getAcademicSessionEnrollmentMap = async (
  studentIds: string[],
  academicSession?: string | null,
  academicSessionId?: string | null
) => {
  if ((!academicSession && !academicSessionId) || studentIds.length === 0) {
    return new Map<string, any>();
  }

  const enrollmentFilter: Record<string, any> = {
    student: { $in: studentIds },
  };

  if (academicSessionId) {
    enrollmentFilter['academicSessionId'] = academicSessionId;
  } else if (academicSession) {
    enrollmentFilter['academicSession'] = academicSession;
  }

  const enrollments = await StudentEnrollment.find(enrollmentFilter);

  return new Map(enrollments.map((item) => [item.student, item]));
};

export const getEffectivePlacement = (
  student: any,
  sessionPlacement?: any | null,
  currentPlacement?: any | null
): StudentPlacement | null => {
  if (sessionPlacement) {
    return {
      schoolBoard: sessionPlacement.schoolBoard || null,
      school: sessionPlacement.school,
      classId: sessionPlacement.classId,
      academicSession: sessionPlacement.academicSession,
      academicSessionId: sessionPlacement.academicSessionId || null,
      isCurrent: sessionPlacement.isCurrent,
    };
  }

  if (currentPlacement) {
    return {
      schoolBoard: currentPlacement.schoolBoard || null,
      school: currentPlacement.school,
      classId: currentPlacement.classId,
      academicSession: currentPlacement.academicSession,
      academicSessionId: currentPlacement.academicSessionId || null,
      isCurrent: currentPlacement.isCurrent,
    };
  }

  return getLegacyPlacement(student);
};

export const resolveActiveAcademicSessionForSchoolBoard = async (schoolBoardId?: string | null) => {
  if (!schoolBoardId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'School does not belong to a school board');
  }

  const session = await AcademicSession.findOne({ schoolBoard: schoolBoardId, isActive: true }).sort({
    startYear: -1,
  });

  if (!session) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'No active academic session found for this school board');
  }

  return {
    id: session.id,
    name: session.name || `${session.startYear}/${session.endYear}`,
  };
};

export const upsertStudentEnrollment = async (payload: {
  studentId: string;
  schoolBoardId?: string | null;
  schoolId: string;
  classId: string;
}) => {
  const session = await resolveActiveAcademicSessionForSchoolBoard(payload.schoolBoardId);

  await StudentEnrollment.updateMany(
    { student: payload.studentId, isCurrent: true, academicSession: { $ne: session.name } },
    { $set: { isCurrent: false } }
  );

  const enrollment = await StudentEnrollment.findOneAndUpdate(
    {
      student: payload.studentId,
      academicSession: session.name,
    },
    {
      student: payload.studentId,
      schoolBoard: payload.schoolBoardId || null,
      school: payload.schoolId,
      classId: payload.classId,
      academicSession: session.name,
      academicSessionId: session.id,
      isCurrent: true,
    },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    }
  );

  await StudentEnrollment.updateMany(
    {
      student: payload.studentId,
      _id: { $ne: enrollment.id },
      isCurrent: true,
    },
    { $set: { isCurrent: false } }
  );

  return enrollment;
};

export const findStudentIdsForPlacement = async (payload: {
  schoolId: string;
  classId?: string;
  academicSession?: string | null;
}) => {
  const enrollmentFilter: Record<string, any> = {
    school: payload.schoolId,
  };

  if (payload.classId) {
    enrollmentFilter['classId'] = payload.classId;
  }

  if (payload.academicSession) {
    enrollmentFilter['academicSession'] = payload.academicSession;
  } else {
    enrollmentFilter['isCurrent'] = true;
  }

  const enrollments = await StudentEnrollment.find(enrollmentFilter).select('student');

  const studentIds = new Set<string>();
  enrollments.forEach((item) => studentIds.add(item.student));

  // Legacy fallback: only use old student-level placement fields when no enrollment rows exist.
  // This avoids mixing old and new placement sources, which can skew attendance summaries.
  if (studentIds.size === 0) {
    const legacyStudents = await Student.find({
      school: payload.schoolId,
      ...(payload.classId ? { classId: payload.classId } : {}),
    } as any).select('_id');

    legacyStudents.forEach((item) => studentIds.add(item.id));
  }

  return Array.from(studentIds);
};