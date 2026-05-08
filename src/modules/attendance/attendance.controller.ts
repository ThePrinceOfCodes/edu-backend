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
  const termId = req.query['termId'] as string;
  const academicSessionId = req.query['academicSessionId'] as string;
  const month = req.query['month'] ? Number(req.query['month']) : undefined;
  const year = req.query['year'] ? Number(req.query['year']) : undefined;

  const context: {
    classId: string;
    schoolId: string;
    termId: string;
    academicSessionId: string;
    month?: number;
    year?: number;
    publicBaseUrl?: string;
  } = {
    classId,
    schoolId,
    termId,
    academicSessionId,
    publicBaseUrl: `${req.protocol}://${req.get('host') || ''}`,
  };

  if (month !== undefined) {
    context.month = month;
  }

  if (year !== undefined) {
    context.year = year;
  }

  const summary = await attendanceService.getAttendanceCalendarSummary(req.account, context);

  res.send(summary);
});
