import express from 'express';
import validate from '../../modules/validate/validate.middleware';
import { authenticate, authorize } from '../../modules/auth';
import * as staffValidation from '../../modules/staff/staff.validation';
import * as staffController from '../../modules/staff/staff.controller';

const router = express.Router();

router
  .route('/')
  .post(authenticate, authorize('staff.write'), validate(staffValidation.createStaff), staffController.createStaff)
  .get(authenticate, authorize('staff.read'), validate(staffValidation.getStaff), staffController.getStaff);

router
  .route('/:staffId')
  .get(authenticate, authorize('staff.read'), validate(staffValidation.getStaffById), staffController.getStaffById)
  .patch(authenticate, authorize('staff.write'), validate(staffValidation.updateStaff), staffController.updateStaff)
  .delete(authenticate, authorize('staff.write'), validate(staffValidation.deleteStaff), staffController.deleteStaff);

export default router;
