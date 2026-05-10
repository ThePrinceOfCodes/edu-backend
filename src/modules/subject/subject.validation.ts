import Joi from 'joi';

export const createSubject = {
  body: Joi.object().keys({
    name: Joi.string().trim().required(),
    code: Joi.string().trim().required(),
  }),
};

export const getSubjects = {
  query: Joi.object().keys({
    name: Joi.string(),
    code: Joi.string(),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

export const getSubject = {
  params: Joi.object().keys({
    subjectId: Joi.string().required(),
  }),
};

export const updateSubject = {
  params: Joi.object().keys({
    subjectId: Joi.string().required(),
  }),
  body: Joi.object()
    .keys({
      name: Joi.string().trim(),
      code: Joi.string().trim(),
    })
    .min(1),
};

export const deleteSubject = {
  params: Joi.object().keys({
    subjectId: Joi.string().required(),
  }),
};
