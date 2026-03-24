"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteSchool = exports.updateSchool = exports.getSchool = exports.getSchools = exports.createSchool = void 0;
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
exports.createSchool = {
    body: joi_1.default.object().keys({
        name: joi_1.default.string().trim().required(),
        schoolBoard: joi_1.default.string().trim().optional().allow(null, ''),
        schoolTypes: joi_1.default.array().items(joi_1.default.string().trim()).min(1).optional(),
        address: joi_1.default.string().trim().optional().allow(null, ''),
        state: joi_1.default.string().trim().optional().allow(null, ''),
        localGovernment: joi_1.default.string().trim().optional().allow(null, ''),
        district: joi_1.default.string().trim().optional().allow(null, ''),
        longitude: joi_1.default.number().optional(),
        latitude: joi_1.default.number().optional(),
        status: joi_1.default.string().valid('active', 'inactive').optional(),
        adminUserId: joi_1.default.string().trim().optional(),
        admin: joi_1.default.object()
            .keys({
            name: joi_1.default.string().trim().required(),
            email: joi_1.default.string().trim().email().required(),
            password: joi_1.default.string().required().custom(password),
            phoneNumber: joi_1.default.string().trim().optional().allow(null, ''),
        })
            .optional(),
    }),
};
exports.getSchools = {
    query: joi_1.default.object().keys({
        name: joi_1.default.string(),
        schoolBoard: joi_1.default.string(),
        state: joi_1.default.string(),
        localGovernment: joi_1.default.string(),
        district: joi_1.default.string(),
        status: joi_1.default.string().valid('active', 'inactive'),
        sortBy: joi_1.default.string(),
        limit: joi_1.default.number().integer(),
        page: joi_1.default.number().integer(),
    }),
};
exports.getSchool = {
    params: joi_1.default.object().keys({
        schoolId: joi_1.default.string().required(),
    }),
};
exports.updateSchool = {
    params: joi_1.default.object().keys({
        schoolId: joi_1.default.string().required(),
    }),
    body: joi_1.default.object()
        .keys({
        name: joi_1.default.string().trim(),
        schoolTypes: joi_1.default.array().items(joi_1.default.string().trim()).min(1),
        address: joi_1.default.string().trim().allow(null, ''),
        state: joi_1.default.string().trim().allow(null, ''),
        localGovernment: joi_1.default.string().trim().allow(null, ''),
        district: joi_1.default.string().trim().allow(null, ''),
        longitude: joi_1.default.number(),
        latitude: joi_1.default.number(),
        adminUser: joi_1.default.string().trim().allow(null, ''),
        status: joi_1.default.string().valid('active', 'inactive'),
    })
        .min(1),
};
exports.deleteSchool = {
    params: joi_1.default.object().keys({
        schoolId: joi_1.default.string().required(),
    }),
};
//# sourceMappingURL=school.validation.js.map