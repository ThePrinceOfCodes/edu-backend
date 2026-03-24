import express from 'express';
import validate from '../../modules/validate/validate.middleware';
import { authenticate, authorize } from '../../modules/auth';
import * as classValidation from '../../modules/class/class.validation';
import * as classController from '../../modules/class/class.controller';

const router = express.Router();

router
  .route('/')
  .post(authenticate, authorize('classes.write'), validate(classValidation.createClass), classController.createClass)
  .get(authenticate, authorize('classes.read'), validate(classValidation.getClasses), classController.getClasses);

router
  .route('/:classId')
  .get(authenticate, authorize('classes.read'), validate(classValidation.getClass), classController.getClass)
  .patch(authenticate, authorize('classes.write'), validate(classValidation.updateClass), classController.updateClass)
  .delete(authenticate, authorize('classes.write'), validate(classValidation.deleteClass), classController.deleteClass);

export default router;
