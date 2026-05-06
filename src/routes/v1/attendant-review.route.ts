import express from 'express';
import validate from '../../modules/validate/validate.middleware';
import { authenticate, authorize } from '../../modules/auth';
import { attendantReviewController } from '../../modules/attendant-review';
import * as attendantReviewValidation from '../../modules/attendant-review/attendant-review.validation';

const router = express.Router();

router.get('/', authenticate, authorize('attendance.read'), validate(attendantReviewValidation.listPendingReviews), attendantReviewController.listPendingReviews);
router.patch('/:id', authenticate, authorize('attendance.write'), validate(attendantReviewValidation.resolveReview), attendantReviewController.resolveReview);
router.post('/bulk-resolve', authenticate, authorize('attendance.write'), validate(attendantReviewValidation.bulkResolveReviews), attendantReviewController.bulkResolveReviews);

export default router;
