import Joi from 'joi';

export const createClass = {
  body: Joi.object().keys({
    name: Joi.string().trim().required(),
    code: Joi.string().trim().required(),
    schoolTypeId: Joi.string().trim().required(),
  }),
};

export const getClasses = {
  query: Joi.object().keys({
    name: Joi.string(),
    code: Joi.string(),
    schoolTypeId: Joi.string(),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

export const getClass = {
  params: Joi.object().keys({
    classId: Joi.string().required(),
  }),
};

export const updateClass = {
  params: Joi.object().keys({
    classId: Joi.string().required(),
  }),
  body: Joi.object()
    .keys({
      name: Joi.string().trim(),
      code: Joi.string().trim(),
      schoolTypeId: Joi.string().trim(),
    })
    .min(1),
};

export const deleteClass = {
  params: Joi.object().keys({
    classId: Joi.string().required(),
  }),
};
