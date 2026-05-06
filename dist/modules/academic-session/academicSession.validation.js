"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteAcademicSession = exports.updateAcademicSession = exports.getAcademicSession = exports.getAcademicSessions = exports.createAcademicSession = void 0;
const joi_1 = __importDefault(require("joi"));
exports.createAcademicSession = {
    body: joi_1.default.object().keys({
        name: joi_1.default.string().trim().optional().allow('', null),
        startYear: joi_1.default.number().integer().min(1900).required(),
        endYear: joi_1.default.number().integer().min(1900).required(),
        schoolBoard: joi_1.default.string().trim().optional(),
        isActive: joi_1.default.boolean().optional(),
    }),
};
exports.getAcademicSessions = {
    query: joi_1.default.object().keys({
        schoolBoard: joi_1.default.string(),
        isActive: joi_1.default.boolean(),
        startYear: joi_1.default.number().integer(),
        endYear: joi_1.default.number().integer(),
        sortBy: joi_1.default.string(),
        limit: joi_1.default.number().integer(),
        page: joi_1.default.number().integer(),
    }),
};
exports.getAcademicSession = {
    params: joi_1.default.object().keys({
        academicSessionId: joi_1.default.string().required(),
    }),
};
exports.updateAcademicSession = {
    params: joi_1.default.object().keys({
        academicSessionId: joi_1.default.string().required(),
    }),
    body: joi_1.default.object()
        .keys({
        name: joi_1.default.string().trim().allow('', null),
        startYear: joi_1.default.number().integer().min(1900),
        endYear: joi_1.default.number().integer().min(1900),
        isActive: joi_1.default.boolean(),
    })
        .min(1),
};
exports.deleteAcademicSession = {
    params: joi_1.default.object().keys({
        academicSessionId: joi_1.default.string().required(),
    }),
};
//# sourceMappingURL=academicSession.validation.js.map