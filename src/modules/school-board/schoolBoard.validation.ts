import Joi from 'joi';

const password = (value: string, helpers: Joi.CustomHelpers) => {
  if (value.length < 8) {
    return helpers.message({ custom: 'password must be at least 8 characters' });
  }
  if (!value.match(/\d/) || !value.match(/[a-zA-Z]/)) {
    return helpers.message({ custom: 'password must contain at least 1 letter and 1 number' });
  }
  return value;
};

export const createSchoolBoard = {
  body: Joi.object().keys({
    name: Joi.string().trim().required(),
    description: Joi.string().trim().optional().allow(null, ''),
    code: Joi.string().trim().optional().allow(null, ''),
    status: Joi.string().valid('active', 'inactive').optional(),
    superAdmin: Joi.object()
      .keys({
        name: Joi.string().trim().required(),
        email: Joi.string().trim().email().required(),
        password: Joi.string().required().custom(password),
        phoneNumber: Joi.string().trim().optional().allow(null, ''),
      })
      .required(),
  }),
};

export const getSchoolBoards = {
  query: Joi.object().keys({
    name: Joi.string(),
    code: Joi.string(),
    status: Joi.string().valid('active', 'inactive'),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

export const getSchoolBoard = {
  params: Joi.object().keys({
    schoolBoardId: Joi.string().required(),
  }),
};

export const updateSchoolBoard = {
  params: Joi.object().keys({
    schoolBoardId: Joi.string().required(),
  }),
  body: Joi.object()
    .keys({
      name: Joi.string().trim(),
      description: Joi.string().trim().allow(null, ''),
      code: Joi.string().trim().allow(null, ''),
      status: Joi.string().valid('active', 'inactive'),
      superAdminUser: Joi.string().trim(),
    })
    .min(1),
};

export const deleteSchoolBoard = {
  params: Joi.object().keys({
    schoolBoardId: Joi.string().required(),
  }),
};
