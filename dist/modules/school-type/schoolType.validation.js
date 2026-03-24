"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteSchoolType = exports.updateSchoolType = exports.getSchoolType = exports.getSchoolTypes = exports.createSchoolType = void 0;
const joi_1 = __importDefault(require("joi"));
exports.createSchoolType = {
    body: joi_1.default.object().keys({
        name: joi_1.default.string().trim().required(),
    }),
};
exports.getSchoolTypes = {
    query: joi_1.default.object().keys({
        name: joi_1.default.string(),
        sortBy: joi_1.default.string(),
        limit: joi_1.default.number().integer(),
        page: joi_1.default.number().integer(),
    }),
};
exports.getSchoolType = {
    params: joi_1.default.object().keys({
        schoolTypeId: joi_1.default.string().required(),
    }),
};
exports.updateSchoolType = {
    params: joi_1.default.object().keys({
        schoolTypeId: joi_1.default.string().required(),
    }),
    body: joi_1.default.object()
        .keys({
        name: joi_1.default.string().trim(),
    })
        .min(1),
};
exports.deleteSchoolType = {
    params: joi_1.default.object().keys({
        schoolTypeId: joi_1.default.string().required(),
    }),
};
//# sourceMappingURL=schoolType.validation.js.map