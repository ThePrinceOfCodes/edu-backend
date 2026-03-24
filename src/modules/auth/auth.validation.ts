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

export const register = {
    body: Joi.object().keys({
        name: Joi.string().required().messages({
            'any.required': 'Name is required',
        }),
        workEmail: Joi.string().email().required().messages({
            'any.required': 'Work Email is required',
            'string.email': 'Work Email must be a valid email',
        }),
        password: Joi.string().required().custom(password).messages({
            'any.required': 'Password is required',
        }),
    }),
};

export const login = {
    body: Joi.object().keys({
        email: Joi.string().required().email(),
        password: Joi.string().required(),
    }),
};

export const verifyEmail = {
    body: Joi.object().keys({
        email: Joi.string().email().required(),
        otp: Joi.string().length(6).required(),
    }),
};

export const forgotPassword = {
    body: Joi.object().keys({
        email: Joi.string().email().required(),
    }),
};

export const resetPassword = {
    body: Joi.object().keys({
        password: Joi.string().required().custom(password),
        token: Joi.string().required(),
    }),
};

export const verifyToken = {
    body: Joi.object().keys({
        token: Joi.string().required(),
    }),
};

export const changePassword = {
    body: Joi.object().keys({
        currentPassword: Joi.string().required(),
        newPassword: Joi.string().required().custom(password),
    }),
};
