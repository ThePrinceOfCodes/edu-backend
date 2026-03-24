import httpStatus from 'http-status';
import { ApiError } from '../errors';
import { IUserDoc } from '../users/user.interfaces';
import { School } from '../school';
import { Student } from '../student';
import { termService, Term } from '../term';
import Attendance from './attendance.model';

const ATTENDED_STATUSES = new Set(['present', 'late', 'excused']);

type AttendanceContextOptions = {
  schoolId?: string;
  termId?: string;
};

const toDateKey = (value: Date) => value.toISOString().slice(0, 10);

const buildDayList = (startDate: Date, endDate: Date) => {
  const days: Array<{ date: string; label: string }> = [];

  const current = new Date(startDate);
  current.setUTCHours(0, 0, 0, 0);

  const last = new Date(endDate);
  last.setUTCHours(0, 0, 0, 0);

  while (current <= last) {
    const date = toDateKey(current);
    const dayOfMonth = new Date(current).getUTCDate();

    days.push({
      date,
      label: String(dayOfMonth),
    });

    current.setUTCDate(current.getUTCDate() + 1);
  }

  return days;
};

const resolveSchoolContext = async (actor: IUserDoc, schoolId?: string) => {
  if (actor.accountType !== 'internal') {
    if (actor.role === 'school-admin' || actor.role === 'teacher' || actor.role === 'staff') {
      if (!actor.schoolId) {
        throw new ApiError(httpStatus.FORBIDDEN, 'School context is missing for this user');
      }

      if (schoolId && schoolId !== actor.schoolId) {
        throw new ApiError(httpStatus.FORBIDDEN, 'Cannot access attendance for another school');
      }

      schoolId = actor.schoolId;
    }

    if (actor.role === 'school-board-admin') {
      if (!actor.schoolBoardId) {
        throw new ApiError(httpStatus.FORBIDDEN, 'School board context is missing for this user');
      }

      if (!schoolId) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'school is required for school-board-admin');
      }

      const school = await School.findById(schoolId);
      if (!school || school.schoolBoard !== actor.schoolBoardId) {
        throw new ApiError(httpStatus.FORBIDDEN, 'School is outside your school board');
      }
    }
  }

  if (!schoolId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'school is required');
  }

  const school = await School.findById(schoolId);

  if (!school) {
    throw new ApiError(httpStatus.NOT_FOUND, 'School not found');
  }

  return school;
};

const resolveTermForAttendance = async (schoolId: string, termId?: string) => {
  if (termId) {
    const explicitTerm = await Term.findById(termId);

    if (!explicitTerm) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Term not found');
    }

    if (explicitTerm.school && explicitTerm.school !== schoolId) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Selected term is scoped to a different school');
    }

    if (!explicitTerm.school) {
      const school = await School.findById(schoolId);

      if (!school || explicitTerm.schoolBoard !== school.schoolBoard) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Selected global term does not match school board');
      }
    }

    return explicitTerm;
  }

  const activeTerm = await termService.getActiveTermForSchool(schoolId);

  if (!activeTerm) {
    throw new ApiError(httpStatus.NOT_FOUND, 'No active term found for this school');
  }

  return activeTerm;
};

export const queryAttendance = async (
  filter: any,
  options: any,
  actor: IUserDoc,
  context: AttendanceContextOptions
) => {
  const school = await resolveSchoolContext(actor, context.schoolId);
  const term = await resolveTermForAttendance(school.id, context.termId);

  return Attendance.paginate(
    {
      ...filter,
      school: school.id,
      termId: term.id,
      date: {
        $gte: term.startDate,
        $lte: term.endDate,
      },
    },
    options
  );
};

export const getAttendanceSummary = async (actor: IUserDoc, context: AttendanceContextOptions) => {
  const school = await resolveSchoolContext(actor, context.schoolId);
  const term = await resolveTermForAttendance(school.id, context.termId);

  const students = await Student.find({ school: school.id }).sort({ lastName: 1, firstName: 1 });

  const records = await Attendance.find({
    school: school.id,
    termId: term.id,
    date: {
      $gte: term.startDate,
      $lte: term.endDate,
    },
  });

  const days = buildDayList(new Date(term.startDate), new Date(term.endDate));
  const dayKeys = days.map((item) => item.date);

  const byStudentDate = new Map<string, Map<string, string>>();

  records.forEach((record) => {
    const studentKey = record.student;
    const dateKey = toDateKey(new Date(record.date));

    const rowMap = byStudentDate.get(studentKey) || new Map<string, string>();
    rowMap.set(dateKey, record.status);
    byStudentDate.set(studentKey, rowMap);
  });

  const rows = students.map((student) => {
    const statusMap = byStudentDate.get(student.id) || new Map<string, string>();

    const statusByDate = dayKeys.reduce(
      (acc: Record<string, string>, dateKey) => {
        acc[dateKey] = statusMap.get(dateKey) || '-';
        return acc;
      },
      {}
    );

    const attendedDays = dayKeys.reduce((count, dateKey) => {
      const status = statusMap.get(dateKey);
      return ATTENDED_STATUSES.has(status || '') ? count + 1 : count;
    }, 0);

    const attendancePercentage = dayKeys.length > 0 ? Number(((attendedDays / dayKeys.length) * 100).toFixed(2)) : 0;

    return {
      studentId: student.id,
      studentName: `${student.firstName} ${student.lastName}`,
      regNumber: student.regNumber,
      attendancePercentage,
      statusByDate,
    };
  });

  return {
    school: {
      id: school.id,
      name: school.name,
    },
    term: {
      id: term.id,
      name: term.name,
      academicSessionId: term.academicSessionId,
      schoolBoard: term.schoolBoard,
      school: term.school,
      startDate: term.startDate,
      endDate: term.endDate,
      isActive: term.isActive,
      resolvedScope: term.school ? 'school' : 'school-board',
    },
    days,
    rows,
  };
};
