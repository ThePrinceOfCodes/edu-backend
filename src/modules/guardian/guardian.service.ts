import httpStatus from 'http-status';
import { ApiError } from '../errors';
import { IUserDoc } from '../users/user.interfaces';
import { userService } from '../users';
import { authService } from '../auth';
import { getPermissionsForRole } from '../users/user.constants';
import User from '../users/user.model';
import Student from '../student/student.model';
import StudentEnrollment from '../student/studentEnrollment.model';
import { getCurrentEnrollmentMap, getEffectivePlacement } from '../student/studentEnrollment.helpers';
import School from '../school/school.model';
import ClassModel from '../class/class.model';
import Attendance from '../attendance/attendance.model';
import Result from '../result/result.model';
import Term from '../term/term.model';
import AcademicSession from '../academic-session/academicSession.model';

type CreateGuardianPayload = {
  name: string;
  email: string;
  password: string;
  phoneNumber?: string;
  studentIds: string[];
  relationshipType: 'parent' | 'caretaker';
  parentType?: 'father' | 'mother' | null;
  isPrimary?: boolean;
};

type MutateGuardianStudentLinksPayload = {
  guardianId: string;
  studentIds: string[];
  relationshipType: 'parent' | 'caretaker';
  parentType?: 'father' | 'mother' | null;
  isPrimary?: boolean;
};

const canManageGuardians = (actor: IUserDoc) => {
  if (actor.accountType === 'internal') {
    return true;
  }

  return actor.role === 'school-board-admin' || actor.role === 'school-admin';
};

const isEnrollmentInActorScope = (actor: IUserDoc, enrollment: any | null | undefined) => {
  if (actor.accountType === 'internal') {
    return true;
  }

  if (!enrollment) {
    return false;
  }

  if (actor.role === 'school-admin') {
    return enrollment.school === actor.schoolId;
  }

  if (actor.role === 'school-board-admin') {
    return enrollment.schoolBoard === actor.schoolBoardId;
  }

  return false;
};

const getCurrentEnrollmentByStudentId = async (studentIds: string[]) => {
  if (studentIds.length === 0) {
    return new Map<string, any>();
  }

  const enrollments = await StudentEnrollment.find({
    student: { $in: studentIds },
    isCurrent: true,
  })
    .select('student school schoolBoard classId academicSession')
    .lean();

  return new Map(enrollments.map((item: any) => [item.student, item]));
};

const getGuardianById = async (guardianId: string) => {
  const guardian = await User.findById(guardianId);
  if (!guardian || guardian.role !== 'guardian') {
    throw new ApiError(httpStatus.NOT_FOUND, 'Guardian not found');
  }

  return guardian;
};

const buildGuardianLink = (
  guardianId: string,
  relationshipType: 'parent' | 'caretaker',
  parentType?: 'father' | 'mother' | null,
  isPrimary = false
) => ({
  guardianId,
  relationshipType,
  parentType: relationshipType === 'parent' ? parentType || null : null,
  isPrimary,
});

const applyGuardianLink = (
  student: any,
  link: ReturnType<typeof buildGuardianLink>,
  removeGuardianId?: string
) => {
  const existingLinks = Array.isArray(student.guardianLinks) ? [...student.guardianLinks] : [];
  let nextLinks = removeGuardianId
    ? existingLinks.filter((item: any) => item.guardianId !== removeGuardianId)
    : existingLinks.filter((item: any) => item.guardianId !== link.guardianId);

  if (!removeGuardianId) {
    if (link.isPrimary) {
      nextLinks = nextLinks.map((item: any) => ({
        ...item,
        isPrimary: false,
      }));
    }

    const existingIndex = nextLinks.findIndex((item: any) => item.guardianId === link.guardianId);
    if (existingIndex >= 0) {
      nextLinks[existingIndex] = {
        ...nextLinks[existingIndex],
        ...link,
      };
    } else {
      nextLinks.push(link);
    }
  }

  if (nextLinks.length > 0 && !nextLinks.some((item: any) => item.isPrimary)) {
    nextLinks[0].isPrimary = true;
  }

  student.guardianLinks = nextLinks;
  student.guardianIds = Array.from(new Set(nextLinks.map((item: any) => item.guardianId)));
  student.primaryGuardianId = nextLinks.find((item: any) => item.isPrimary)?.guardianId || null;
};

const ensureActorCanManageStudents = async (actor: IUserDoc, studentIds: string[]) => {
  const students = await Student.find({ _id: { $in: studentIds } });
  if (students.length !== studentIds.length) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'One or more student IDs are invalid');
  }

  if (actor.accountType === 'internal') {
    return students;
  }

  if (actor.role === 'school-admin') {
    if (!actor.schoolId) {
      throw new ApiError(httpStatus.FORBIDDEN, 'School context is missing for this user');
    }

    const enrollments = await StudentEnrollment.find({ student: { $in: studentIds }, isCurrent: true });
    if (enrollments.length !== studentIds.length) {
      throw new ApiError(
        httpStatus.FORBIDDEN,
        'Cannot assign guardian because some students do not have current school placement'
      );
    }
    const invalid = enrollments.some((item) => item.school !== actor.schoolId);
    if (invalid) {
      throw new ApiError(httpStatus.FORBIDDEN, 'Cannot assign guardians to students outside your school');
    }

    return students;
  }

  if (actor.role === 'school-board-admin') {
    if (!actor.schoolBoardId) {
      throw new ApiError(httpStatus.FORBIDDEN, 'School board context is missing for this user');
    }

    const enrollments = await StudentEnrollment.find({ student: { $in: studentIds }, isCurrent: true });
    if (enrollments.length !== studentIds.length) {
      throw new ApiError(
        httpStatus.FORBIDDEN,
        'Cannot assign guardian because some students do not have current school-board placement'
      );
    }
    const invalid = enrollments.some((item) => item.schoolBoard !== actor.schoolBoardId);
    if (invalid) {
      throw new ApiError(httpStatus.FORBIDDEN, 'Cannot assign guardians to students outside your school board');
    }

    return students;
  }

  throw new ApiError(httpStatus.FORBIDDEN, 'You are not allowed to manage guardians');
};

export const createGuardian = async (payload: CreateGuardianPayload, actor: IUserDoc) => {
  if (!canManageGuardians(actor)) {
    throw new ApiError(httpStatus.FORBIDDEN, 'You are not allowed to create guardians');
  }

  const studentIds = Array.from(new Set(payload.studentIds.filter(Boolean)));
  if (studentIds.length === 0) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'studentIds must contain at least one student');
  }

  await ensureActorCanManageStudents(actor, studentIds);

  const guardian = await userService.createUser({
    name: payload.name,
    email: payload.email,
    accountType: 'client',
    role: 'guardian',
    permissions: getPermissionsForRole('guardian'),
    isVerified: true,
    status: 'active',
    ...(payload.phoneNumber ? { phoneNumber: payload.phoneNumber } : {}),
  } as any);

  await authService.createAuth({
    user: guardian.id,
    email: payload.email,
    password: payload.password,
    provider: 'email',
  });

  const students = await Student.find({ _id: { $in: studentIds } });
  for (const student of students) {
    applyGuardianLink(
      student,
      buildGuardianLink(guardian.id, payload.relationshipType, payload.parentType, payload.isPrimary)
    );
    await student.save();
  }

  return {
    guardian,
    linkedStudentsCount: studentIds.length,
    linkedStudentIds: studentIds,
  };
};

export const getGuardians = async (actor: IUserDoc, query?: { q?: string }) => {
  if (!canManageGuardians(actor)) {
    throw new ApiError(httpStatus.FORBIDDEN, 'You are not allowed to view guardians');
  }

  const guardians = await User.find({ role: 'guardian', accountType: 'client' })
    .select('_id name email phoneNumber status')
    .sort({ createdAt: -1 })
    .lean();

  if (guardians.length === 0) {
    return { results: [] };
  }

  const guardianIds = guardians.map((item: any) => item._id);
  const students = await Student.find({
    $or: [{ guardianIds: { $in: guardianIds } }, { 'guardianLinks.guardianId': { $in: guardianIds } }],
  })
    .select('_id firstName middleName lastName regNumber guardianIds guardianLinks primaryGuardianId')
    .lean();

  const enrollmentByStudentId = await getCurrentEnrollmentByStudentId(students.map((item: any) => item._id));
  const schoolIds = new Set<string>();
  students.forEach((student: any) => {
    const enrollment = enrollmentByStudentId.get(student._id);
    if (enrollment?.school) {
      schoolIds.add(enrollment.school);
    }
  });

  const schools = await School.find({ _id: { $in: Array.from(schoolIds) } }).select('_id name').lean();
  const schoolNameMap = new Map(schools.map((item: any) => [item._id, item.name]));

  const guardianStudentMap = new Map<string, any[]>();

  students.forEach((student: any) => {
    const enrollment = enrollmentByStudentId.get(student._id);
    if (!isEnrollmentInActorScope(actor, enrollment)) {
      return;
    }

    const fullName = `${student.firstName} ${student.middleName || ''} ${student.lastName}`.replace(/\s+/g, ' ').trim();
    const schoolName = enrollment?.school ? schoolNameMap.get(enrollment.school) || enrollment.school : null;

    const guardianLinks = Array.isArray((student as any).guardianLinks) ? (student as any).guardianLinks : [];

    (student.guardianIds || []).forEach((guardianId: string) => {
      const guardianLink = guardianLinks.find((item: any) => item.guardianId === guardianId);
      const list = guardianStudentMap.get(guardianId) || [];
      list.push({
        id: student._id,
        fullName,
        regNumber: student.regNumber,
        schoolId: enrollment?.school || null,
        schoolName,
        relationshipType: guardianLink?.relationshipType || null,
        parentType: guardianLink?.parentType || null,
        isPrimary: Boolean(guardianLink?.isPrimary || (student as any).primaryGuardianId === guardianId),
      });
      guardianStudentMap.set(guardianId, list);
    });
  });

  const q = query?.q?.trim().toLowerCase();

  const results = guardians
    .map((guardian: any) => {
      const linkedStudents = guardianStudentMap.get(guardian._id) || [];
      return {
        id: guardian._id,
        name: guardian.name,
        email: guardian.email,
        phoneNumber: guardian.phoneNumber || null,
        status: guardian.status || 'active',
        linkedStudentsCount: linkedStudents.length,
        linkedStudents,
      };
    })
    .filter((item) => {
      if (actor.accountType !== 'internal' && item.linkedStudentsCount === 0) {
        return false;
      }

      if (!q) {
        return true;
      }

      return item.name.toLowerCase().includes(q) || item.email.toLowerCase().includes(q);
    });

  return { results };
};

export const linkStudentsToGuardian = async (payload: MutateGuardianStudentLinksPayload, actor: IUserDoc) => {
  if (!canManageGuardians(actor)) {
    throw new ApiError(httpStatus.FORBIDDEN, 'You are not allowed to update guardian links');
  }

  const guardian = await getGuardianById(payload.guardianId);
  const studentIds = Array.from(new Set(payload.studentIds.filter(Boolean)));

  if (studentIds.length === 0) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'studentIds must contain at least one student');
  }

  await ensureActorCanManageStudents(actor, studentIds);

  const students = await Student.find({ _id: { $in: studentIds } });
  for (const student of students) {
    applyGuardianLink(
      student,
      buildGuardianLink(guardian.id, payload.relationshipType, payload.parentType, payload.isPrimary)
    );
    await student.save();
  }

  return {
    guardianId: guardian.id,
    linkedStudentIds: studentIds,
    linkedStudentsCount: studentIds.length,
  };
};

export const unlinkStudentsFromGuardian = async (payload: MutateGuardianStudentLinksPayload, actor: IUserDoc) => {
  if (!canManageGuardians(actor)) {
    throw new ApiError(httpStatus.FORBIDDEN, 'You are not allowed to update guardian links');
  }

  const guardian = await getGuardianById(payload.guardianId);
  const studentIds = Array.from(new Set(payload.studentIds.filter(Boolean)));

  if (studentIds.length === 0) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'studentIds must contain at least one student');
  }

  await ensureActorCanManageStudents(actor, studentIds);

  const students = await Student.find({ _id: { $in: studentIds } });
  for (const student of students) {
    applyGuardianLink(student, buildGuardianLink(guardian.id, 'caretaker', null, false), guardian.id);
    await student.save();
  }

  return {
    guardianId: guardian.id,
    unlinkedStudentIds: studentIds,
    unlinkedStudentsCount: studentIds.length,
  };
};

export const getMyStudentsOverview = async (actor: IUserDoc) => {
  if (actor.role !== 'guardian') {
    throw new ApiError(httpStatus.FORBIDDEN, 'Only guardians can access this section');
  }

  const guardianId = actor.id;
  const students = await Student.find({
    $or: [{ guardianIds: guardianId }, { 'guardianLinks.guardianId': guardianId }],
  });
  const studentIds = students.map((item) => item.id);

  if (studentIds.length === 0) {
    return {
      guardian: {
        id: guardianId,
        name: actor.name,
        email: actor.email,
      },
      students: [],
    };
  }

  const currentEnrollmentMap = await getCurrentEnrollmentMap(studentIds);
  const attendanceRows = await Attendance.find({ student: { $in: studentIds } }).sort({ date: -1 });
  const resultRows = await Result.find({ student: { $in: studentIds } }).sort({ createdAt: -1 });

  const schoolIds = new Set<string>();
  const classIds = new Set<string>();
  const termIds = new Set<string>();
  const sessionIds = new Set<string>();

  students.forEach((student) => {
    const placement = getEffectivePlacement(student as any, null, currentEnrollmentMap.get(student.id));
    if (placement?.school) schoolIds.add(placement.school);
    if (placement?.classId) classIds.add(placement.classId);
  });

  resultRows.forEach((item) => {
    if (item.school) schoolIds.add(item.school);
    const guardianLinks = Array.isArray(student.guardianLinks) ? student.guardianLinks : [];
    const linkedGuardianIds = new Set([
      ...(Array.isArray(student.guardianIds) ? student.guardianIds : []),
      ...guardianLinks.map((link: any) => link.guardianId),
    ]);
    if (item.classId) classIds.add(item.classId);
    Array.from(linkedGuardianIds).forEach((guardianId: string) => {
    if (item.academicSessionId) sessionIds.add(item.academicSessionId);
  });

  const [schools, classes, terms, sessions] = await Promise.all([
    School.find({ _id: { $in: Array.from(schoolIds) } }).select('_id name').lean(),
    ClassModel.find({ _id: { $in: Array.from(classIds) } }).select('_id code name').lean(),
    Term.find({ _id: { $in: Array.from(termIds) } }).select('_id name termName').lean(),
    AcademicSession.find({ _id: { $in: Array.from(sessionIds) } }).select('_id name startYear endYear').lean(),
  ]);

  const schoolNameMap = new Map(schools.map((item: any) => [item._id, item.name]));
  const classMap = new Map(classes.map((item: any) => [item._id, `${item.code} - ${item.name}`]));
  const termMap = new Map(terms.map((item: any) => [item._id, item.name || item.termName]));
  const sessionMap = new Map(
    sessions.map((item: any) => [item._id, item.name || `${item.startYear}/${item.endYear}`])
  );

  const attendanceByStudent = new Map<string, any[]>();
  attendanceRows.forEach((item: any) => {
    const list = attendanceByStudent.get(item.student) || [];
    list.push(item);
    attendanceByStudent.set(item.student, list);
  });

  const resultsByStudent = new Map<string, any[]>();
  resultRows.forEach((item: any) => {
    const list = resultsByStudent.get(item.student) || [];
    list.push(item);
    resultsByStudent.set(item.student, list);
  });

  const studentOverview = students.map((student) => {
    const placement = getEffectivePlacement(student as any, null, currentEnrollmentMap.get(student.id));
    const attendance = attendanceByStudent.get(student.id) || [];
    const presentCount = attendance.filter((item) => item.status === 'present' || item.status === 'late').length;
    const absentCount = attendance.filter((item) => item.status === 'absent' || item.status === 'excused').length;
    const totalMarked = presentCount + absentCount;
    const attendanceRate = totalMarked > 0 ? Number(((presentCount / totalMarked) * 100).toFixed(2)) : 0;

    const results = (resultsByStudent.get(student.id) || []).map((item) => ({
      id: item.id,
      subject: item.subject,
      testScore: item.testScore,
      examScore: item.examScore,
      totalScore: item.totalScore,
      termId: item.termId,
      termName: termMap.get(item.termId) || item.termId,
      academicSessionId: item.academicSessionId,
      academicSessionName: sessionMap.get(item.academicSessionId) || item.academicSessionId,
      assessmentDate: item.assessmentDate,
      remark: item.remark,
      classId: item.classId,
      className: classMap.get(item.classId) || item.classId,
      schoolId: item.school,
      schoolName: schoolNameMap.get(item.school) || item.school,
    }));

    const fullName = `${student.firstName} ${student.middleName || ''} ${student.lastName}`.replace(/\s+/g, ' ').trim();

    return {
      id: student.id,
      fullName,
      firstName: student.firstName,
      middleName: student.middleName,
      lastName: student.lastName,
      regNumber: student.regNumber,
      gender: student.gender,
      dateOfBirth: student.dateOfBirth,
      stateOfOrigin: student.stateOfOrigin,
      localGovernment: student.localGovernment,
      status: student.status,
      currentPlacement: placement
        ? {
            schoolId: placement.school,
            schoolName: schoolNameMap.get(placement.school) || placement.school,
            classId: placement.classId,
            className: classMap.get(placement.classId) || placement.classId,
            academicSession: placement.academicSession,
            academicSessionId: placement.academicSessionId,
          }
        : null,
      attendance: {
        totalMarked,
        presentCount,
        absentCount,
        attendanceRate,
        lastMarkedDate: attendance[0]?.date || null,
      },
      results,
    };
  });

  return {
    guardian: {
      id: guardianId,
      name: actor.name,
      email: actor.email,
    },
    students: studentOverview,
  };
};
