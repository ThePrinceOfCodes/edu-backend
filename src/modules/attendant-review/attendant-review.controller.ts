import httpStatus from 'http-status';
import { Request, Response } from 'express';
import { catchAsync, pick } from '../utils';
import * as attendantReviewService from './attendant-review.service';

export const listPendingReviews = catchAsync(async (req: Request, res: Response) => {
  const filter = pick(req.query, ['extractionId']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await attendantReviewService.queryPendingReviewsForAccount(filter, options, req.account);
  res.send(result);
});

export const resolveReview = catchAsync(async (req: Request, res: Response) => {
  const review = await attendantReviewService.resolveReview(req.params['id'] as string, req.body, req.account);
  res.status(httpStatus.OK).send(review);
});

export const bulkResolveReviews = catchAsync(async (req: Request, res: Response) => {
  const result = await attendantReviewService.bulkResolveReviews(req.body.reviewIds, req.body, req.account);
  res.status(httpStatus.OK).send(result);
});
