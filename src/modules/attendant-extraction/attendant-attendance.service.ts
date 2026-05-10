import httpStatus from 'http-status';
import { ApiError } from '../errors';
import Attendance from '../attendance/attendance.model';
import { Student } from '../student';
import { Term } from '../term';
import { School } from '../school';
import { normaliseStatusMark } from './attendant-parser.service';
import { getWorkingDays, zipMarksToWorkingDays } from './attendant-dates.util';

const flattenAttendanceMarks = (attendance: Record<string, string>): string[] => {
  const weekKeys = ['week_1', 'week_2', 'week_3', 'week_4', 'week_5'] as const;
  return weekKeys.flatMap((weekKey) => {
    const marks = String(attendance[weekKey] || '')
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 5);

    while (marks.length < 5) {
      marks.push('X');
    }

    return marks;
  });
};

export const createAttendanceFromParsedRows = async (payload: {
  schoolId: string;
  termId: string;
  academicSessionId: string;
  /** Ordered Mon–Fri working days for the attendance period */
  workingDays: Date[];
  rows: Array<{ admissionNumber?: string | null; studentName?: string | null; statusMarks?: string[] }>;
}) => {
  const school = await School.findById(payload.schoolId);
  if (!school) throw new ApiError(httpStatus.NOT_FOUND, 'School not found');

  const term = await Term.findById(payload.termId);
  if (!term) throw new ApiError(httpStatus.NOT_FOUND, 'Term not found');

  const created: any[] = [];

  for (const row of payload.rows) {
    // Resolve the student record by admission number first, then name
    const student = row.admissionNumber
      ? await Student.findOne({ school: payload.schoolId, regNumber: row.admissionNumber })
      : row.studentName
        ? await Student.findOne({
            school: payload.schoolId,
            $or: [
              { firstName: new RegExp(row.studentName, 'i') },
              { lastName: new RegExp(row.studentName, 'i') },
            ],
          })
        : null;

    if (!student) continue;

    // Map each raw mark to its corresponding working day
    const dayEntries = zipMarksToWorkingDays(payload.workingDays, row.statusMarks ?? []);

    for (const { date, rawMark } of dayEntries) {
      const resolvedStatus = normaliseStatusMark(rawMark);
      if (!resolvedStatus) continue; // unrecognised mark — skip

      const attendance = await Attendance.findOneAndUpdate(
        { student: student.id, date },
        {
          student: student.id,
          schoolBoard: school.schoolBoard,
          school: school.id,
          academicSessionId: payload.academicSessionId,
          termId: term.id,
          date,
          status: resolvedStatus,
          source: 'attendant-extraction',
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      created.push(attendance);
    }
  }

  return created;
};

export const createAttendanceFromExtractionPayload = async (payload: {
  schoolId: string;
  termId: string;
  academicSessionId: string;
  startDate: Date;
  endDate: Date;
  students: Array<{
    admission_number: string;
    student_name: string;
    attendance: Record<string, string>;
  }>;
}) => {
  return createAttendanceFromParsedRows({
    schoolId: payload.schoolId,
    termId: payload.termId,
    academicSessionId: payload.academicSessionId,
    workingDays: getWorkingDays(payload.startDate, payload.endDate),
    rows: payload.students.map((student) => ({
      admissionNumber: student.admission_number,
      studentName: student.student_name,
      statusMarks: flattenAttendanceMarks(student.attendance),
    })),
  });
};
