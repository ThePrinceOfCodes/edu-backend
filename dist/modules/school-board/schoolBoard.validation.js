"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteSchoolBoard = exports.updateSchoolBoard = exports.getSchoolBoard = exports.getSchoolBoards = exports.createSchoolBoard = void 0;
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
exports.createSchoolBoard = {
    body: joi_1.default.object().keys({
        name: joi_1.default.string().trim().required(),
        description: joi_1.default.string().trim().optional().allow(null, ''),
        code: joi_1.default.string().trim().optional().allow(null, ''),
        status: joi_1.default.string().valid('active', 'inactive').optional(),
        superAdmin: joi_1.default.object()
            .keys({
            name: joi_1.default.string().trim().required(),
            email: joi_1.default.string().trim().email().required(),
            password: joi_1.default.string().required().custom(password),
            phoneNumber: joi_1.default.string().trim().optional().allow(null, ''),
        })
            .required(),
    }),
};
exports.getSchoolBoards = {
    query: joi_1.default.object().keys({
        name: joi_1.default.string(),
        code: joi_1.default.string(),
        status: joi_1.default.string().valid('active', 'inactive'),
        sortBy: joi_1.default.string(),
        limit: joi_1.default.number().integer(),
        page: joi_1.default.number().integer(),
    }),
};
exports.getSchoolBoard = {
    params: joi_1.default.object().keys({
        schoolBoardId: joi_1.default.string().required(),
    }),
};
exports.updateSchoolBoard = {
    params: joi_1.default.object().keys({
        schoolBoardId: joi_1.default.string().required(),
    }),
    body: joi_1.default.object()
        .keys({
        name: joi_1.default.string().trim(),
        description: joi_1.default.string().trim().allow(null, ''),
        code: joi_1.default.string().trim().allow(null, ''),
        status: joi_1.default.string().valid('active', 'inactive'),
        superAdminUser: joi_1.default.string().trim(),
    })
        .min(1),
};
exports.deleteSchoolBoard = {
    params: joi_1.default.object().keys({
        schoolBoardId: joi_1.default.string().required(),
    }),
};
//# sourceMappingURL=schoolBoard.validation.js.map