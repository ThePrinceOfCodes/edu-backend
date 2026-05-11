import httpStatus from 'http-status';
import { ApiError } from '../errors';
import Attendance from '../attendance/attendance.model';
import { Student } from '../student';
import { School } from '../school';
import { findStudentIdsForPlacement } from '../student/studentEnrollment.helpers';
import { normaliseStatusMark } from './attendant-parser.service';
import { getWorkingDays, zipMarksToWorkingDays } from './attendant-dates.util';

const flattenAttendanceMarks = (attendance: Record<string, string>): string[] => {
  return Object.keys(attendance)
    .sort((a, b) => {
      const aMatch = a.match(/^week_(\d+)$/);
      const bMatch = b.match(/^week_(\d+)$/);

      if (aMatch && bMatch) return Number(aMatch[1]) - Number(bMatch[1]);
      if (aMatch) return -1;
      if (bMatch) return 1;
      return a.localeCompare(b);
    })
    .flatMap((weekKey) => {
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
  /** Ordered Mon–Fri working days for the attendance period */
  workingDays: Date[];
  rows: Array<{ admissionNumber?: string | null; studentName?: string | null; statusMarks?: string[] }>;
}) => {
  const school = await School.findById(payload.schoolId);
  if (!school) throw new ApiError(httpStatus.NOT_FOUND, 'School not found');

  const allowedStudentIds = new Set(
    await findStudentIdsForPlacement({
      schoolId: payload.schoolId,
    })
  );

  const created: any[] = [];

  for (const row of payload.rows) {
    // Resolve the student record by admission number first, then name
    const matchedByRegNumber = row.admissionNumber
      ? await Student.findOne({ regNumber: row.admissionNumber })
      : null;

    const matchedByName = !matchedByRegNumber && row.studentName
      ? await Student.findOne({
          _id: { $in: Array.from(allowedStudentIds) },
          $or: [
            { firstName: new RegExp(row.studentName, 'i') },
            { lastName: new RegExp(row.studentName, 'i') },
          ],
        })
      : null;

    const student = matchedByRegNumber && allowedStudentIds.has(matchedByRegNumber.id)
      ? matchedByRegNumber
      : row.studentName
        ? matchedByName
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
          regNumber: student.regNumber,
          schoolId: school.id,
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
    workingDays: getWorkingDays(payload.startDate, payload.endDate),
    rows: payload.students.map((student) => ({
      admissionNumber: student.admission_number,
      studentName: student.student_name,
      statusMarks: flattenAttendanceMarks(student.attendance),
    })),
  });
};
