import express from 'express';
import validate from '../../modules/validate/validate.middleware';
import { authenticate, authorize } from '../../modules/auth';
import * as attendanceValidation from '../../modules/attendance/attendance.validation';
import * as attendanceController from '../../modules/attendance/attendance.controller';

const router = express.Router();

router.get(
  '/summary',
  authenticate,
  authorize('attendance.read'),
  validate(attendanceValidation.getAttendanceSummary),
  attendanceController.getAttendanceSummary
);

router.get(
  '/',
  authenticate,
  authorize('attendance.read'),
  validate(attendanceValidation.getAttendance),
  attendanceController.getAttendance
);

export default router;
