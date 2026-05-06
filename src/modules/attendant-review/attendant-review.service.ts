import AttendantReview from './attendant-review.model';
import { ApiError } from '../errors';
import httpStatus from 'http-status';

export const queryPendingReviews = (filter: any, options: any) => AttendantReview.paginate({ ...filter, resolvedStatus: 'pending' }, options);

export const createReview = (data: any) => AttendantReview.create(data);

const canAccessReview = (account: any, reviewSchoolId: string) => {
  if (account.accountType === 'internal') {
    return true;
  }

  return account.role === 'school-admin' && account.schoolId === reviewSchoolId;
};

export const queryPendingReviewsForAccount = async (filter: any, options: any, account: any) => {
  const scopedFilter = account.accountType === 'internal' ? filter : { ...filter, schoolId: account.schoolId };
  return AttendantReview.paginate({ ...scopedFilter, resolvedStatus: 'pending' }, options);
};

export const resolveReview = async (
  reviewId: string,
  updates: { resolvedStudentId?: string; resolvedStatus?: 'resolved' | 'ignored' },
  account: any
) => {
  const review = await AttendantReview.findById(reviewId);
  if (!review) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Review not found');
  }

  if (!canAccessReview(account, review.schoolId)) {
    throw new ApiError(httpStatus.FORBIDDEN, 'You do not have permission to access this review');
  }

  if (updates.resolvedStudentId) review.resolvedStudentId = updates.resolvedStudentId;
  if (updates.resolvedStatus) review.resolvedStatus = updates.resolvedStatus;
  await review.save();
  return review;
};

export const bulkResolveReviews = async (
  reviewIds: string[],
  updates: { resolvedStudentId?: string; resolvedStatus?: 'resolved' | 'ignored' },
  account: any
) => {
  const reviews = await AttendantReview.find({ _id: { $in: reviewIds } });
  const unauthorized = reviews.find((review) => !canAccessReview(account, review.schoolId));

  if (unauthorized) {
    throw new ApiError(httpStatus.FORBIDDEN, 'You do not have permission to access one or more reviews');
  }

  return AttendantReview.updateMany({ _id: { $in: reviewIds } }, { $set: updates });
};
