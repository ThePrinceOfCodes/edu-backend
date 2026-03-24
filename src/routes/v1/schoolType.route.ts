import express from 'express';
import validate from '../../modules/validate/validate.middleware';
import { authenticate, authorize } from '../../modules/auth';
import * as schoolTypeValidation from '../../modules/school-type/schoolType.validation';
import * as schoolTypeController from '../../modules/school-type/schoolType.controller';

const router = express.Router();

router
  .route('/')
  .post(authenticate, authorize('schoolTypes.write'), validate(schoolTypeValidation.createSchoolType), schoolTypeController.createSchoolType)
  .get(authenticate, authorize('schoolTypes.read'), validate(schoolTypeValidation.getSchoolTypes), schoolTypeController.getSchoolTypes);

router
  .route('/:schoolTypeId')
  .get(authenticate, authorize('schoolTypes.read'), validate(schoolTypeValidation.getSchoolType), schoolTypeController.getSchoolType)
  .patch(authenticate, authorize('schoolTypes.write'), validate(schoolTypeValidation.updateSchoolType), schoolTypeController.updateSchoolType)
  .delete(authenticate, authorize('schoolTypes.write'), validate(schoolTypeValidation.deleteSchoolType), schoolTypeController.deleteSchoolType);

export default router;
