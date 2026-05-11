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

export const createGuardian = {
  body: Joi.object().keys({
    name: Joi.string().trim().required(),
    email: Joi.string().trim().email().required(),
    password: Joi.string().required().custom(password),
    phoneNumber: Joi.string().trim().allow(null, '').optional(),
    studentIds: Joi.array().items(Joi.string().trim().required()).min(1).required(),
  }),
};

export const getGuardians = {
  query: Joi.object().keys({
    q: Joi.string().trim().optional(),
  }),
};

export const mutateGuardianLinks = {
  params: Joi.object().keys({
    guardianId: Joi.string().required(),
  }),
  body: Joi.object().keys({
    studentIds: Joi.array().items(Joi.string().trim().required()).min(1).required(),
  }),
};
