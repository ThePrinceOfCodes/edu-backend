"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUserById = exports.deactivateUserById = exports.updateUserById = exports.getUserById = exports.getUsers = exports.createInternalUser = void 0;
const joi_1 = __importDefault(require("joi"));
const user_constants_1 = require("./user.constants");
const permission = joi_1.default.string().trim().required();
const password = (value, helpers) => {
    if (value.length < 8) {
        return helpers.message({ custom: 'password must be at least 8 characters' });
    }
    if (!value.match(/\d/) || !value.match(/[a-zA-Z]/)) {
        return helpers.message({ custom: 'password must contain at least 1 letter and 1 number' });
    }
    return value;
};
exports.createInternalUser = {
    body: joi_1.default.object().keys({
        name: joi_1.default.string().trim().required(),
        email: joi_1.default.string().trim().email().required(),
        password: joi_1.default.string().required().custom(password),
        phoneNumber: joi_1.default.string().trim().optional().allow(null, ''),
        role: joi_1.default.string()
            .valid(...user_constants_1.INTERNAL_USER_ROLES)
            .default('admin'),
        permissions: joi_1.default.array().items(permission).optional(),
    }),
};
exports.getUsers = {
    query: joi_1.default.object().keys({
        name: joi_1.default.string(),
        email: joi_1.default.string(),
        role: joi_1.default.string().valid(...user_constants_1.USER_ROLES),
        status: joi_1.default.string().valid('active', 'disabled'),
        accountType: joi_1.default.string().valid('internal', 'client'),
        sortBy: joi_1.default.string(),
        limit: joi_1.default.number().integer(),
        page: joi_1.default.number().integer(),
    }),
};
exports.getUserById = {
    params: joi_1.default.object().keys({
        userId: joi_1.default.string().required(),
    }),
};
exports.updateUserById = {
    params: joi_1.default.object().keys({
        userId: joi_1.default.string().required(),
    }),
    body: joi_1.default.object()
        .keys({
        name: joi_1.default.string().trim(),
        email: joi_1.default.string().trim().email(),
        phoneNumber: joi_1.default.string().trim().allow(null, ''),
        role: joi_1.default.string().valid(...user_constants_1.INTERNAL_USER_ROLES),
        permissions: joi_1.default.array().items(permission),
        status: joi_1.default.string().valid('active', 'disabled'),
    })
        .min(1),
};
exports.deactivateUserById = {
    params: joi_1.default.object().keys({
        userId: joi_1.default.string().required(),
    }),
};
exports.deleteUserById = {
    params: joi_1.default.object().keys({
        userId: joi_1.default.string().required(),
    }),
};
//# sourceMappingURL=user.validation.js.map