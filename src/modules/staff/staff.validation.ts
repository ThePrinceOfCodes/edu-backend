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

export const createStaff = {
  body: Joi.object().keys({
    schoolBoard: Joi.string().trim().optional(),
    school: Joi.string().trim().optional(),
    userId: Joi.string().trim().optional(),
    user: Joi.object()
      .keys({
        name: Joi.string().trim().required(),
        email: Joi.string().trim().email().required(),
        password: Joi.string().required().custom(password),
        phoneNumber: Joi.string().trim().optional().allow(null, ''),
        role: Joi.string().valid('teacher', 'staff').optional(),
      })
      .optional(),
    employeeId: Joi.string().trim().optional().allow(null, ''),
    designation: Joi.string().trim().optional().allow(null, ''),
    employmentType: Joi.string().valid('teacher', 'staff').optional(),
    isActive: Joi.boolean().optional(),
  }),
};

export const getStaff = {
  query: Joi.object().keys({
    user: Joi.string(),
    schoolBoard: Joi.string(),
    school: Joi.string(),
    employmentType: Joi.string().valid('teacher', 'staff'),
    isActive: Joi.boolean(),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

export const getStaffById = {
  params: Joi.object().keys({
    staffId: Joi.string().required(),
  }),
};

export const updateStaff = {
  params: Joi.object().keys({
    staffId: Joi.string().required(),
  }),
  body: Joi.object()
    .keys({
      school: Joi.string().trim().allow(null, ''),
      employeeId: Joi.string().trim().allow(null, ''),
      designation: Joi.string().trim().allow(null, ''),
      employmentType: Joi.string().valid('teacher', 'staff'),
      isActive: Joi.boolean(),
    })
    .min(1),
};

export const deleteStaff = {
  params: Joi.object().keys({
    staffId: Joi.string().required(),
  }),
};
