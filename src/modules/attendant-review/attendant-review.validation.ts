import Joi from 'joi';

export const listPendingReviews = {
  query: Joi.object().keys({
    extractionId: Joi.string().optional(),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

export const resolveReview = {
  body: Joi.object().keys({
    resolvedStudentId: Joi.string().optional(),
    resolvedStatus: Joi.string().valid('resolved', 'ignored').optional(),
  }),
};

export const bulkResolveReviews = {
  body: Joi.object().keys({
    reviewIds: Joi.array().items(Joi.string().required()).min(1).required(),
    resolvedStudentId: Joi.string().optional(),
    resolvedStatus: Joi.string().valid('resolved', 'ignored').optional(),
  }),
};
