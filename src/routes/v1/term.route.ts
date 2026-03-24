import express from 'express';
import validate from '../../modules/validate/validate.middleware';
import { authenticate, authorize } from '../../modules/auth';
import * as termValidation from '../../modules/term/term.validation';
import * as termController from '../../modules/term/term.controller';

const router = express.Router();

router.get(
  '/active',
  authenticate,
  authorize('terms.read'),
  validate(termValidation.getActiveTerm),
  termController.getActiveTerm
);

router
  .route('/')
  .post(authenticate, authorize('terms.write'), validate(termValidation.createTerm), termController.createTerm)
  .get(authenticate, authorize('terms.read'), validate(termValidation.getTerms), termController.getTerms);

router
  .route('/:termId')
  .get(authenticate, authorize('terms.read'), validate(termValidation.getTerm), termController.getTerm)
  .patch(authenticate, authorize('terms.write'), validate(termValidation.updateTerm), termController.updateTerm)
  .delete(authenticate, authorize('terms.write'), validate(termValidation.deleteTerm), termController.deleteTerm);

export default router;
