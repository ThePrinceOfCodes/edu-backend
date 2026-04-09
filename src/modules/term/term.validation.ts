import Joi from 'joi';

export const createTerm = {
  body: Joi.object().keys({
    termName: Joi.string().trim().required(),
    academicSession: Joi.string().trim().required(),
    schoolBoard: Joi.string().trim().optional(),
    school: Joi.string().trim().allow(null, '').optional(),
    startDate: Joi.date().required(),
    endDate: Joi.date().required(),
    isActive: Joi.boolean().optional(),
  }),
};

export const getTerms = {
  query: Joi.object().keys({
    name: Joi.string(),
    termName: Joi.string(),
    academicSession: Joi.string(),
    schoolBoard: Joi.string(),
    school: Joi.string(),
    isActive: Joi.boolean(),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

export const getTerm = {
  params: Joi.object().keys({
    termId: Joi.string().required(),
  }),
};

export const updateTerm = {
  params: Joi.object().keys({
    termId: Joi.string().required(),
  }),
  body: Joi.object()
    .keys({
      termName: Joi.string().trim(),
      school: Joi.string().trim().allow(null, ''),
      startDate: Joi.date(),
      endDate: Joi.date(),
      isActive: Joi.boolean(),
    })
    .min(1),
};

export const deleteTerm = {
  params: Joi.object().keys({
    termId: Joi.string().required(),
  }),
};

export const getActiveTerm = {
  query: Joi.object().keys({
    school: Joi.string().trim().optional(),
  }),
};
