"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mutateGuardianLinks = exports.getGuardians = exports.createGuardian = void 0;
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
exports.createGuardian = {
    body: joi_1.default.object().keys({
        name: joi_1.default.string().trim().required(),
        email: joi_1.default.string().trim().email().required(),
        password: joi_1.default.string().required().custom(password),
        phoneNumber: joi_1.default.string().trim().allow(null, '').optional(),
        studentIds: joi_1.default.array().items(joi_1.default.string().trim().required()).min(1).required(),
    }),
};
exports.getGuardians = {
    query: joi_1.default.object().keys({
        q: joi_1.default.string().trim().optional(),
    }),
};
exports.mutateGuardianLinks = {
    params: joi_1.default.object().keys({
        guardianId: joi_1.default.string().required(),
    }),
    body: joi_1.default.object().keys({
        studentIds: joi_1.default.array().items(joi_1.default.string().trim().required()).min(1).required(),
    }),
};
//# sourceMappingURL=guardian.validation.js.map