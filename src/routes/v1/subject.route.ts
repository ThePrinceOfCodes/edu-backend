import express from 'express';
import validate from '../../modules/validate/validate.middleware';
import { authenticate, authorize } from '../../modules/auth';
import * as subjectValidation from '../../modules/subject/subject.validation';
import * as subjectController from '../../modules/subject/subject.controller';

const router = express.Router();

router
  .route('/')
  .post(authenticate, authorize('schoolTypes.write'), validate(subjectValidation.createSubject), subjectController.createSubject)
  .get(authenticate, authorize('schoolTypes.read'), validate(subjectValidation.getSubjects), subjectController.getSubjects);

router
  .route('/:subjectId')
  .get(authenticate, authorize('schoolTypes.read'), validate(subjectValidation.getSubject), subjectController.getSubject)
  .patch(authenticate, authorize('schoolTypes.write'), validate(subjectValidation.updateSubject), subjectController.updateSubject)
  .delete(authenticate, authorize('schoolTypes.write'), validate(subjectValidation.deleteSubject), subjectController.deleteSubject);

export default router;
