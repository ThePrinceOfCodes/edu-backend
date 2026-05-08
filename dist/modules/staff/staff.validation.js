"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteStaff = exports.updateStaff = exports.getStaffById = exports.getStaff = exports.createStaff = void 0;
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
exports.createStaff = {
    body: joi_1.default.object().keys({
        schoolBoard: joi_1.default.string().trim().optional(),
        school: joi_1.default.string().trim().optional(),
        userId: joi_1.default.string().trim().optional(),
        user: joi_1.default.object()
            .keys({
            name: joi_1.default.string().trim().required(),
            email: joi_1.default.string().trim().email().required(),
            password: joi_1.default.string().required().custom(password),
            phoneNumber: joi_1.default.string().trim().optional().allow(null, ''),
            role: joi_1.default.string().valid('teacher', 'staff').optional(),
        })
            .optional(),
        employeeId: joi_1.default.string().trim().optional().allow(null, ''),
        designation: joi_1.default.string().trim().optional().allow(null, ''),
        employmentType: joi_1.default.string().valid('teacher', 'staff').optional(),
        isActive: joi_1.default.boolean().optional(),
    }),
};
exports.getStaff = {
    query: joi_1.default.object().keys({
        user: joi_1.default.string(),
        schoolBoard: joi_1.default.string(),
        school: joi_1.default.string(),
        employmentType: joi_1.default.string().valid('teacher', 'staff'),
        isActive: joi_1.default.boolean(),
        sortBy: joi_1.default.string(),
        limit: joi_1.default.number().integer(),
        page: joi_1.default.number().integer(),
    }),
};
exports.getStaffById = {
    params: joi_1.default.object().keys({
        staffId: joi_1.default.string().required(),
    }),
};
exports.updateStaff = {
    params: joi_1.default.object().keys({
        staffId: joi_1.default.string().required(),
    }),
    body: joi_1.default.object()
        .keys({
        school: joi_1.default.string().trim().allow(null, ''),
        employeeId: joi_1.default.string().trim().allow(null, ''),
        designation: joi_1.default.string().trim().allow(null, ''),
        employmentType: joi_1.default.string().valid('teacher', 'staff'),
        isActive: joi_1.default.boolean(),
    })
        .min(1),
};
exports.deleteStaff = {
    params: joi_1.default.object().keys({
        staffId: joi_1.default.string().required(),
    }),
};
//# sourceMappingURL=staff.validation.js.map