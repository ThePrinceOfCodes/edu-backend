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

export const createSchool = {
  body: Joi.object().keys({
    name: Joi.string().trim().required(),
    schoolBoard: Joi.string().trim().optional().allow(null, ''),
    address: Joi.string().trim().optional().allow(null, ''),
    status: Joi.string().valid('active', 'inactive').optional(),
    adminUserId: Joi.string().trim().optional(),
    admin: Joi.object()
      .keys({
        name: Joi.string().trim().required(),
        email: Joi.string().trim().email().required(),
        password: Joi.string().required().custom(password),
        phoneNumber: Joi.string().trim().optional().allow(null, ''),
      })
      .optional(),
  }),
};

export const getSchools = {
  query: Joi.object().keys({
    name: Joi.string(),
    schoolBoard: Joi.string(),
    status: Joi.string().valid('active', 'inactive'),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

export const getSchool = {
  params: Joi.object().keys({
    schoolId: Joi.string().required(),
  }),
};

export const updateSchool = {
  params: Joi.object().keys({
    schoolId: Joi.string().required(),
  }),
  body: Joi.object()
    .keys({
      name: Joi.string().trim(),
      address: Joi.string().trim().allow(null, ''),
      adminUser: Joi.string().trim().allow(null, ''),
      status: Joi.string().valid('active', 'inactive'),
    })
    .min(1),
};

export const deleteSchool = {
  params: Joi.object().keys({
    schoolId: Joi.string().required(),
  }),
};
