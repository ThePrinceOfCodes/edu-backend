import Joi from 'joi';

export const createSchoolType = {
  body: Joi.object().keys({
    name: Joi.string().trim().required(),
  }),
};

export const getSchoolTypes = {
  query: Joi.object().keys({
    name: Joi.string(),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

export const getSchoolType = {
  params: Joi.object().keys({
    schoolTypeId: Joi.string().required(),
  }),
};

export const updateSchoolType = {
  params: Joi.object().keys({
    schoolTypeId: Joi.string().required(),
  }),
  body: Joi.object()
    .keys({
      name: Joi.string().trim(),
    })
    .min(1),
};

export const deleteSchoolType = {
  params: Joi.object().keys({
    schoolTypeId: Joi.string().required(),
  }),
};
