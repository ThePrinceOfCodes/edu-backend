import { Request, Response } from 'express';
import { catchAsync, pick } from '../utils';
import * as attendanceService from './attendance.service';

export const getAttendance = catchAsync(async (req: Request, res: Response) => {
  const filter = pick(req.query, ['student', 'status']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const schoolId = req.query['school'] as string | undefined;
  const termId = req.query['termId'] as string | undefined;
  const classId = req.query['classId'] as string | undefined;

  const context: { schoolId?: string; termId?: string; classId?: string } = {};
  if (schoolId) {
    context.schoolId = schoolId;
  }
  if (termId) {
    context.termId = termId;
  }
  if (classId) {
    context.classId = classId;
  }

  const result = await attendanceService.queryAttendance(filter, options, req.account, context);

  res.send(result);
});

export const getAttendanceSummary = catchAsync(async (req: Request, res: Response) => {
  const schoolId = req.query['school'] as string | undefined;
  const termId = req.query['termId'] as string | undefined;
  const classId = req.query['classId'] as string | undefined;

  const context: { schoolId?: string; termId?: string; classId?: string } = {};
  if (schoolId) {
    context.schoolId = schoolId;
  }
  if (termId) {
    context.termId = termId;
  }
  if (classId) {
    context.classId = classId;
  }

  const summary = await attendanceService.getAttendanceSummary(req.account, context);

  res.send(summary);
});

export const getAttendanceCalendarSummary = catchAsync(async (req: Request, res: Response) => {
  const classId = req.query['classId'] as string;
  const schoolId = req.query['schoolId'] as string;
  const month = req.query['month'] ? Number(req.query['month']) : undefined;
  const year = req.query['year'] ? Number(req.query['year']) : undefined;

  let foundTermId: string | undefined;
  let foundAcademicSessionId: string | undefined;

  // Try to find term by date range - but don't fail if not found
  if (month !== undefined && year !== undefined) {
    try {
      const startOfMonth = new Date(year, month - 1, 1);
      const endOfMonth = new Date(year, month, 0);
      const termServiceModule = await import('../term/term.service');
      const term = await termServiceModule.getTermForDateRange(startOfMonth, endOfMonth, req.account, schoolId);
      foundTermId = term?._id?.toString();
      foundAcademicSessionId = term?.academicSession;
    } catch (e) {
      // Term lookup failed - continue without termId (term is optional)
    }
  }

  const context: any = {
    classId,
    schoolId,
    publicBaseUrl: `${req.protocol}://${req.get('host') || ''}`,
  };

  if (foundTermId) {
    context.termId = foundTermId;
  }
  if (foundAcademicSessionId) {
    context.academicSessionId = foundAcademicSessionId;
  }
  if (month !== undefined) {
    context.month = month;
  }
  if (year !== undefined) {
    context.year = year;
  }

  const summary = await attendanceService.getAttendanceCalendarSummary(req.account, context);

  res.send(summary);
});
