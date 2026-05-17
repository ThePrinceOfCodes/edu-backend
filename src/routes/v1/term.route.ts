import express from 'express';
import validate from '../../modules/validate/validate.middleware';
import { authenticate, authorize } from '../../modules/auth';
import * as termValidation from '../../modules/term/term.validation';
import * as termController from '../../modules/term/term.controller';

const router = express.Router();

router.get(
  '/active',
  authenticate,
  validate(termValidation.getActiveTerm),
  termController.getActiveTerm
);

router.get(
  '/by-date-range',
  authenticate,
  validate(termValidation.getTermByDateRange),
  termController.getTermByDateRange
);

router
  .route('/')
  .post(authenticate, authorize('terms.write'), validate(termValidation.createTerm), termController.createTerm)
  .get(authenticate, validate(termValidation.getTerms), termController.getTerms);

router
  .route('/:termId')
  .get(authenticate, validate(termValidation.getTerm), termController.getTerm)
  .patch(authenticate, authorize('terms.write'), validate(termValidation.updateTerm), termController.updateTerm)
  .delete(authenticate, authorize('terms.write'), validate(termValidation.deleteTerm), termController.deleteTerm);

export default router;
