import express from 'express';
import validate from '../../modules/validate/validate.middleware';
import { authenticate, authorize } from '../../modules/auth';
import * as schoolValidation from '../../modules/school/school.validation';
import * as schoolController from '../../modules/school/school.controller';

const router = express.Router();

router
  .route('/')
  .post(authenticate, authorize('schools.write'), validate(schoolValidation.createSchool), schoolController.createSchool)
  .get(authenticate, authorize('schools.read'), validate(schoolValidation.getSchools), schoolController.getSchools);

router
  .route('/:schoolId')
  .get(authenticate, authorize('schools.read'), validate(schoolValidation.getSchool), schoolController.getSchool)
  .patch(authenticate, authorize('schools.write'), validate(schoolValidation.updateSchool), schoolController.updateSchool)
  .delete(authenticate, authorize('schools.write'), validate(schoolValidation.deleteSchool), schoolController.deleteSchool);

export default router;
