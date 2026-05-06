import Joi from 'joi';

export const listExtractions = {
  query: Joi.object().keys({
    status: Joi.string().valid('uploaded', 'queued', 'processing', 'parsed', 'attendance_created', 'needs_review', 'failed').optional(),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};
