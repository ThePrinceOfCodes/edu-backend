"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.bulkResolveReviews = exports.resolveReview = exports.queryPendingReviewsForAccount = exports.createReview = exports.queryPendingReviews = void 0;
const attendant_review_model_1 = __importDefault(require("./attendant-review.model"));
const errors_1 = require("../errors");
const http_status_1 = __importDefault(require("http-status"));
const queryPendingReviews = (filter, options) => attendant_review_model_1.default.paginate(Object.assign(Object.assign({}, filter), { resolvedStatus: 'pending' }), options);
exports.queryPendingReviews = queryPendingReviews;
const createReview = (data) => attendant_review_model_1.default.create(data);
exports.createReview = createReview;
const canAccessReview = (account, reviewSchoolId) => {
    if (account.accountType === 'internal') {
        return true;
    }
    return account.role === 'school-admin' && account.schoolId === reviewSchoolId;
};
const queryPendingReviewsForAccount = async (filter, options, account) => {
    const scopedFilter = account.accountType === 'internal' ? filter : Object.assign(Object.assign({}, filter), { schoolId: account.schoolId });
    return attendant_review_model_1.default.paginate(Object.assign(Object.assign({}, scopedFilter), { resolvedStatus: 'pending' }), options);
};
exports.queryPendingReviewsForAccount = queryPendingReviewsForAccount;
const resolveReview = async (reviewId, updates, account) => {
    const review = await attendant_review_model_1.default.findById(reviewId);
    if (!review) {
        throw new errors_1.ApiError(http_status_1.default.NOT_FOUND, 'Review not found');
    }
    if (!canAccessReview(account, review.schoolId)) {
        throw new errors_1.ApiError(http_status_1.default.FORBIDDEN, 'You do not have permission to access this review');
    }
    if (updates.resolvedStudentId)
        review.resolvedStudentId = updates.resolvedStudentId;
    if (updates.resolvedStatus)
        review.resolvedStatus = updates.resolvedStatus;
    await review.save();
    return review;
};
exports.resolveReview = resolveReview;
const bulkResolveReviews = async (reviewIds, updates, account) => {
    const reviews = await attendant_review_model_1.default.find({ _id: { $in: reviewIds } });
    const unauthorized = reviews.find((review) => !canAccessReview(account, review.schoolId));
    if (unauthorized) {
        throw new errors_1.ApiError(http_status_1.default.FORBIDDEN, 'You do not have permission to access one or more reviews');
    }
    return attendant_review_model_1.default.updateMany({ _id: { $in: reviewIds } }, { $set: updates });
};
exports.bulkResolveReviews = bulkResolveReviews;
//# sourceMappingURL=attendant-review.service.js.map