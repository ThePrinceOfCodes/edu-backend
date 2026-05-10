import httpStatus from 'http-status';
import { ApiError } from '../errors';
import { IUserDoc } from '../users/user.interfaces';

import { School } from '../school';
import { ClassModel } from '../class';
import { Student } from '../student';
import { termService, Term } from '../term';
import Attendance from './attendance.model';
import { buildExtractionImageUrl } from '../attendant-extraction/attendant-extraction.service';
import AttendantExtraction from '../attendant-extraction/attendant-extraction.model';
import AttendantReview from '../attendant-review/attendant-review.model';
import { getWorkingDays } from '../attendant-extraction/attendant-dates.util';

const ATTENDED_STATUSES = new Set(['present']);

type AttendanceContextOptions = {
  schoolId?: string;
  termId?: string;
  classId?: string;
};

type CalendarSummaryContext = {
  classId: string;
  schoolId: string;
  termId: string;
  academicSessionId: string;
  month?: number;
  year?: number;
  publicBaseUrl?: string;
};



const toDateKey = (value: Date) => value.toISOString().slice(0, 10);

const isWeekend = (date: Date) => {
  const day = date.getUTCDay();
  return day === 0 || day === 6;
};

const normalizeStatus = (status: string | undefined): string => {
  if (!status) return '-';
  if (status === 'present' || status === 'late') return 'present';
  if (status === 'absent' || status === 'excused') return 'absent';
  return '-';
};

const buildDayList = (startDate: Date, endDate: Date) => {
  const days: Array<{ date: string; label: string }> = [];

  const current = new Date(startDate);
  current.setUTCHours(0, 0, 0, 0);

  const last = new Date(endDate);
  last.setUTCHours(0, 0, 0, 0);

  while (current <= last) {
    if (!isWeekend(current)) {
      const date = toDateKey(current);
      const dayOfMonth = current.getUTCDate();

      days.push({
        date,
        label: String(dayOfMonth),
      });
    }

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

const resolveClassContext = async (schoolId: string, classId: string) => {
  const classDoc = await ClassModel.findById(classId);
  if (!classDoc) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Class not found');
  }

  const matchingStudent = await Student.findOne({ school: schoolId, classId });
  if (!matchingStudent) {
    // class exists but no student in that school/class scope
    // keep the endpoint strict so mobile doesn't silently show wrong data
    throw new ApiError(httpStatus.FORBIDDEN, 'Class is outside the requested school scope');
  }

  return classDoc;
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

  if (activeTerm) {
    return activeTerm;
  }

  const school = await School.findById(schoolId);

  if (!school) {
    throw new ApiError(httpStatus.NOT_FOUND, 'School not found');
  }

  if (!school.schoolBoard) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'School does not belong to a school board');
  }

  const boardTerm = await termService.getActiveTermForSchoolBoard(school.schoolBoard);

  if (boardTerm) {
    return boardTerm;
  }

  throw new ApiError(httpStatus.NOT_FOUND, 'No active term found for this school or school board');
};

export const queryAttendance = async (
  filter: any,
  options: any,
  actor: IUserDoc,
  context: AttendanceContextOptions
) => {
  const school = await resolveSchoolContext(actor, context.schoolId);
  const term = await resolveTermForAttendance(school.id, context.termId);
  const studentFilter: { school: string; classId?: string } = { school: school.id };

  if (context.classId) {
    const allowedClassIds = school.classes || [];
    if (!allowedClassIds.includes(context.classId)) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Selected class does not belong to this school');
    }

    studentFilter.classId = context.classId;
  }

  const students = await Student.find(studentFilter).select('_id');
  const studentIds = students.map((student) => student.id);

  return Attendance.paginate(
    {
      ...filter,
      school: school.id,
      termId: term.id,
      student: { $in: studentIds },
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
  const studentFilter: { school: string; classId?: string } = { school: school.id };

  if (context.classId) {
    const allowedClassIds = school.classes || [];
    if (!allowedClassIds.includes(context.classId)) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Selected class does not belong to this school');
    }

    studentFilter.classId = context.classId;
  }

  const students = await Student.find(studentFilter).sort({ lastName: 1, firstName: 1 });
  const classIds = Array.from(new Set(students.map((student) => student.classId).filter(Boolean)));
  const classes = classIds.length > 0 ? await ClassModel.find({ _id: { $in: classIds } }) : [];
  const classById = new Map(classes.map((classItem) => [classItem.id, classItem]));

  const records = await Attendance.find({
    school: school.id,
    termId: term.id,
    student: { $in: students.map((student) => student.id) },
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
    const studentClass = classById.get(student.classId);

    const statusByDate = dayKeys.reduce(
      (acc: Record<string, string>, dateKey) => {
        acc[dateKey] = normalizeStatus(statusMap.get(dateKey));
        return acc;
      },
      {}
    );

    const daysWithRecord = dayKeys.filter((dateKey) => statusMap.has(dateKey));
    const attendedDays = daysWithRecord.reduce((count, dateKey) => {
      const status = normalizeStatus(statusMap.get(dateKey));
      return ATTENDED_STATUSES.has(status) ? count + 1 : count;
    }, 0);

    const attendancePercentage =
      daysWithRecord.length > 0 ? Number(((attendedDays / daysWithRecord.length) * 100).toFixed(2)) : 0;

    return {
      studentId: student.id,
      studentName: `${student.firstName} ${student.lastName}`,
      regNumber: student.regNumber,
      gender: student.gender,
      classId: student.classId,
      classCode: studentClass?.code ?? null,
      className: studentClass?.name ?? null,
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
      academicSession: term.academicSession,
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

const buildDateKey = (value: Date) => value.toISOString().slice(0, 10);

const buildDayGrid = (startDate: Date, endDate: Date) => {
  return getWorkingDays(startDate, endDate).map((date) => ({
    date: buildDateKey(date),
    label: String(new Date(date).getUTCDate()),
  }));
};

const buildMonthWindow = (termStartDate: Date, termEndDate: Date, month?: number, year?: number) => {
  if (!month || !year) {
    return {
      startDate: termStartDate,
      endDate: termEndDate,
    };
  }

  const monthStartDate = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
  const monthEndDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

  return {
    startDate: monthStartDate > termStartDate ? monthStartDate : termStartDate,
    endDate: monthEndDate < termEndDate ? monthEndDate : termEndDate,
  };
};

const buildDateRangeKeys = (startDate: Date, endDate: Date) => {
  const keys: string[] = [];
  const current = new Date(Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth(), startDate.getUTCDate()));
  const end = new Date(Date.UTC(endDate.getUTCFullYear(), endDate.getUTCMonth(), endDate.getUTCDate()));

  while (current <= end) {
    keys.push(buildDateKey(current));
    current.setUTCDate(current.getUTCDate() + 1);
  }

  return keys;
};

export const getAttendanceCalendarSummary = async (actor: IUserDoc, context: CalendarSummaryContext) => {
  const school = await resolveSchoolContext(actor, context.schoolId);
  await resolveClassContext(school.id, context.classId);

  const term = await Term.findById(context.termId);
  if (!term) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Term not found');
  }

  if (term.academicSession !== context.academicSessionId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Selected term does not belong to the requested academic session');
  }

  if (term.school && term.school !== school.id) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Selected term is scoped to a different school');
  }

  if (!term.school && school.schoolBoard !== term.schoolBoard) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Selected global term does not match school board');
  }

  const monthWindow = buildMonthWindow(new Date(term.startDate), new Date(term.endDate), context.month, context.year);
  if (monthWindow.startDate > monthWindow.endDate) {
    return {
      school: {
        id: school.id,
        name: school.name,
      },
      term: {
        id: term.id,
        name: term.name,
        academicSession: term.academicSession,
        schoolBoard: term.schoolBoard,
        school: term.school,
        startDate: term.startDate,
        endDate: term.endDate,
        isActive: term.isActive,
        resolvedScope: term.school ? 'school' : 'school-board',
      },
      class: {
        id: context.classId,
      },
      days: [],
      rows: [],
      extractions: [],
      reviewSummary: {
        pending: 0,
        resolved: 0,
        ignored: 0,
      },
    };
  }

  const extractions = await AttendantExtraction.find({
    schoolId: school.id,
    termId: term.id,
    academicSessionId: context.academicSessionId,
    status: { $in: ['parsed', 'attendance_created', 'needs_review'] },
    startDate: { $lte: monthWindow.endDate },
    endDate: { $gte: monthWindow.startDate },
  }).sort({ createdAt: 1 });

  const classStudents = await Student.find({ school: school.id, classId: context.classId }).sort({ lastName: 1, firstName: 1 });

  const reviewMap = new Map<string, { resolvedStatus: string; resolvedStudentId?: string }>();
  const reviewIds = extractions.flatMap((item) => item.pendingReviewIds || []);
  if (reviewIds.length) {
    const reviews = await AttendantReview.find({ _id: { $in: reviewIds } });
    reviews.forEach((review) => {
      reviewMap.set(review.id, {
        resolvedStatus: review.resolvedStatus,
        ...(review.resolvedStudentId ? { resolvedStudentId: review.resolvedStudentId } : {}),
      });
    });
  }

  const byStudentDate = new Map<string, Map<string, string>>();

  const attendanceRecords = await Attendance.find({
    school: school.id,
    termId: term.id,
    academicSessionId: context.academicSessionId,
    source: 'attendant-extraction',
    date: {
      $gte: monthWindow.startDate,
      $lte: monthWindow.endDate,
    },
  });

  attendanceRecords.forEach((record) => {
    const studentKey = record.student;
    const dateKey = buildDateKey(new Date(record.date));

    const statusMap = byStudentDate.get(studentKey) || new Map<string, string>();
    statusMap.set(dateKey, record.status);
    byStudentDate.set(studentKey, statusMap);
  });

  const days = buildDayGrid(monthWindow.startDate, monthWindow.endDate);

  const dayKeys = days.map((item) => item.date);

  const rows = classStudents.map((student) => {
    const statusMap = byStudentDate.get(student.id) || new Map<string, string>();
    const statusByDate = dayKeys.reduce((acc: Record<string, string>, dateKey) => {
      acc[dateKey] = statusMap.get(dateKey) || '-';
      return acc;
    }, {});

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
      academicSession: term.academicSession,
      schoolBoard: term.schoolBoard,
      school: term.school,
      startDate: term.startDate,
      endDate: term.endDate,
      isActive: term.isActive,
      resolvedScope: term.school ? 'school' : 'school-board',
    },
    class: {
      id: context.classId,
    },
    days,
    rows,
    extractions: extractions.map((item) => ({
      id: item.id,
      status: item.status,
      startDate: item.startDate,
      endDate: item.endDate,
      dateRange: buildDateRangeKeys(new Date(item.startDate), new Date(item.endDate)),
      createdAt: (item as any).createdAt,
      imageUrl: buildExtractionImageUrl(item.imagePath || item.originalImagePath, context.publicBaseUrl),
      pendingReviewCount: item.pendingReviewIds?.length || 0,
    })),
    reviewSummary: {
      pending: reviewMap.size ? Array.from(reviewMap.values()).filter((item) => item.resolvedStatus === 'pending').length : 0,
      resolved: reviewMap.size ? Array.from(reviewMap.values()).filter((item) => item.resolvedStatus === 'resolved').length : 0,
      ignored: reviewMap.size ? Array.from(reviewMap.values()).filter((item) => item.resolvedStatus === 'ignored').length : 0,
    },
  };
};

