import Joi from 'joi';

export const createAcademicSession = {
  body: Joi.object().keys({
    name: Joi.string().trim().optional().allow('', null),
    startYear: Joi.number().integer().min(1900).required(),
    endYear: Joi.number().integer().min(1900).required(),
    schoolBoard: Joi.string().trim().optional(),
    isActive: Joi.boolean().optional(),
  }),
};

export const getAcademicSessions = {
  query: Joi.object().keys({
    schoolBoard: Joi.string(),
    isActive: Joi.boolean(),
    startYear: Joi.number().integer(),
    endYear: Joi.number().integer(),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

export const getAcademicSession = {
  params: Joi.object().keys({
    academicSessionId: Joi.string().required(),
  }),
};

export const updateAcademicSession = {
  params: Joi.object().keys({
    academicSessionId: Joi.string().required(),
  }),
  body: Joi.object()
    .keys({
      name: Joi.string().trim().allow('', null),
      startYear: Joi.number().integer().min(1900),
      endYear: Joi.number().integer().min(1900),
      isActive: Joi.boolean(),
    })
    .min(1),
};

export const deleteAcademicSession = {
  params: Joi.object().keys({
    academicSessionId: Joi.string().required(),
  }),
};
