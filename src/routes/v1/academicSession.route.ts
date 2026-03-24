import express from 'express';
import validate from '../../modules/validate/validate.middleware';
import { authenticate, authorize } from '../../modules/auth';
import * as academicSessionValidation from '../../modules/academic-session/academicSession.validation';
import * as academicSessionController from '../../modules/academic-session/academicSession.controller';

const router = express.Router();

router
  .route('/')
  .post(
    authenticate,
    authorize('academicSessions.write'),
    validate(academicSessionValidation.createAcademicSession),
    academicSessionController.createAcademicSession
  )
  .get(
    authenticate,
    authorize('academicSessions.read'),
    validate(academicSessionValidation.getAcademicSessions),
    academicSessionController.getAcademicSessions
  );

router
  .route('/:academicSessionId')
  .get(
    authenticate,
    authorize('academicSessions.read'),
    validate(academicSessionValidation.getAcademicSession),
    academicSessionController.getAcademicSession
  )
  .patch(
    authenticate,
    authorize('academicSessions.write'),
    validate(academicSessionValidation.updateAcademicSession),
    academicSessionController.updateAcademicSession
  )
  .delete(
    authenticate,
    authorize('academicSessions.write'),
    validate(academicSessionValidation.deleteAcademicSession),
    academicSessionController.deleteAcademicSession
  );

export default router;
