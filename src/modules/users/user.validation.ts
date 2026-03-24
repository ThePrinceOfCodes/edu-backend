import Joi from 'joi';
import { INTERNAL_USER_ROLES, USER_ROLES } from './user.constants';

const permission = Joi.string().trim().required();

const password = (value: string, helpers: Joi.CustomHelpers) => {
  if (value.length < 8) {
    return helpers.message({ custom: 'password must be at least 8 characters' });
  }
  if (!value.match(/\d/) || !value.match(/[a-zA-Z]/)) {
    return helpers.message({ custom: 'password must contain at least 1 letter and 1 number' });
  }
  return value;
};

export const createInternalUser = {
  body: Joi.object().keys({
    name: Joi.string().trim().required(),
    email: Joi.string().trim().email().required(),
    password: Joi.string().required().custom(password),
    phoneNumber: Joi.string().trim().optional().allow(null, ''),
    role: Joi.string()
      .valid(...INTERNAL_USER_ROLES)
      .default('admin'),
    permissions: Joi.array().items(permission).optional(),
  }),
};

export const getUsers = {
  query: Joi.object().keys({
    name: Joi.string(),
    email: Joi.string(),
    role: Joi.string().valid(...USER_ROLES),
    status: Joi.string().valid('active', 'disabled'),
    accountType: Joi.string().valid('internal', 'client'),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

export const getUserById = {
  params: Joi.object().keys({
    userId: Joi.string().required(),
  }),
};

export const updateUserById = {
  params: Joi.object().keys({
    userId: Joi.string().required(),
  }),
  body: Joi.object()
    .keys({
      name: Joi.string().trim(),
      email: Joi.string().trim().email(),
      phoneNumber: Joi.string().trim().allow(null, ''),
      role: Joi.string().valid(...INTERNAL_USER_ROLES),
      permissions: Joi.array().items(permission),
      status: Joi.string().valid('active', 'disabled'),
    })
    .min(1),
};

export const deactivateUserById = {
  params: Joi.object().keys({
    userId: Joi.string().required(),
  }),
};

export const deleteUserById = {
  params: Joi.object().keys({
    userId: Joi.string().required(),
  }),
};
