import express from 'express';
import validate from '../../modules/validate/validate.middleware';
import { authenticate, authorize } from '../../modules/auth';
import * as guardianController from '../../modules/guardian/guardian.controller';
import * as guardianValidation from '../../modules/guardian/guardian.validation';

const router = express.Router();

router
  .route('/')
  .post(
    authenticate,
    authorize('guardians.write'),
    validate(guardianValidation.createGuardian),
    guardianController.createGuardian
  )
  .get(
    authenticate,
    authorize('guardians.read'),
    validate(guardianValidation.getGuardians),
    guardianController.getGuardians
  );

router.post(
  '/:guardianId/link-students',
  authenticate,
  authorize('guardians.write'),
  validate(guardianValidation.mutateGuardianLinks),
  guardianController.linkStudentsToGuardian
);

router.post(
  '/:guardianId/unlink-students',
  authenticate,
  authorize('guardians.write'),
  validate(guardianValidation.unlinkGuardianLinks),
  guardianController.unlinkStudentsFromGuardian
);

router.get('/me/students-overview', authenticate, authorize('guardians.read'), guardianController.getMyStudentsOverview);

export default router;
