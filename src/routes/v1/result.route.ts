import express from 'express';
import validate from '../../modules/validate/validate.middleware';
import { authenticate, authorize } from '../../modules/auth';
import * as resultValidation from '../../modules/result/result.validation';
import * as resultController from '../../modules/result/result.controller';

const router = express.Router();

router
  .route('/')
  .post(authenticate, authorize('results.write'), validate(resultValidation.createResult), resultController.createResult)
  .get(authenticate, authorize('results.read'), validate(resultValidation.getResults), resultController.getResults);

router.post(
  '/bulk-import',
  authenticate,
  authorize('results.write'),
  validate(resultValidation.createResultsBulk),
  resultController.createResultsBulk
);

router
  .route('/:resultId')
  .get(authenticate, authorize('results.read'), validate(resultValidation.getResult), resultController.getResult)
  .patch(authenticate, authorize('results.write'), validate(resultValidation.updateResult), resultController.updateResult)
  .delete(authenticate, authorize('results.write'), validate(resultValidation.deleteResult), resultController.deleteResult);

export default router;
