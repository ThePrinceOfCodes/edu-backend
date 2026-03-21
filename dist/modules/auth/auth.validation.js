"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyToken = exports.resetPassword = exports.forgotPassword = exports.verifyEmail = exports.login = exports.register = void 0;
const joi_1 = __importDefault(require("joi"));
const password = (value, helpers) => {
    if (value.length < 8) {
        return helpers.message({ custom: 'password must be at least 8 characters' });
    }
    if (!value.match(/\d/) || !value.match(/[a-zA-Z]/)) {
        return helpers.message({ custom: 'password must contain at least 1 letter and 1 number' });
    }
    return value;
};
exports.register = {
    body: joi_1.default.object().keys({
        name: joi_1.default.string().required().messages({
            'any.required': 'Name is required',
        }),
        workEmail: joi_1.default.string().email().required().messages({
            'any.required': 'Work Email is required',
            'string.email': 'Work Email must be a valid email',
        }),
        password: joi_1.default.string().required().custom(password).messages({
            'any.required': 'Password is required',
        }),
    }),
};
exports.login = {
    body: joi_1.default.object().keys({
        email: joi_1.default.string().required().email(),
        password: joi_1.default.string().required(),
    }),
};
exports.verifyEmail = {
    body: joi_1.default.object().keys({
        email: joi_1.default.string().email().required(),
        otp: joi_1.default.string().length(6).required(),
    }),
};
exports.forgotPassword = {
    body: joi_1.default.object().keys({
        email: joi_1.default.string().email().required(),
    }),
};
exports.resetPassword = {
    body: joi_1.default.object().keys({
        password: joi_1.default.string().required().custom(password),
        token: joi_1.default.string().required(),
    }),
};
exports.verifyToken = {
    body: joi_1.default.object().keys({
        token: joi_1.default.string().required(),
    }),
};
//# sourceMappingURL=auth.validation.js.map