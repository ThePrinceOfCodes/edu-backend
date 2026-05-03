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
