"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getActiveTerm = exports.deleteTerm = exports.updateTerm = exports.getTerm = exports.getTerms = exports.createTerm = void 0;
const joi_1 = __importDefault(require("joi"));
exports.createTerm = {
    body: joi_1.default.object().keys({
        termName: joi_1.default.string().trim().required(),
        academicSessionId: joi_1.default.string().trim().required(),
        schoolBoard: joi_1.default.string().trim().optional(),
        school: joi_1.default.string().trim().allow(null, '').optional(),
        startDate: joi_1.default.date().required(),
        endDate: joi_1.default.date().required(),
        isActive: joi_1.default.boolean().optional(),
    }),
};
exports.getTerms = {
    query: joi_1.default.object().keys({
        name: joi_1.default.string(),
        termName: joi_1.default.string(),
        academicSessionId: joi_1.default.string(),
        schoolBoard: joi_1.default.string(),
        school: joi_1.default.string(),
        isActive: joi_1.default.boolean(),
        sortBy: joi_1.default.string(),
        limit: joi_1.default.number().integer(),
        page: joi_1.default.number().integer(),
    }),
};
exports.getTerm = {
    params: joi_1.default.object().keys({
        termId: joi_1.default.string().required(),
    }),
};
exports.updateTerm = {
    params: joi_1.default.object().keys({
        termId: joi_1.default.string().required(),
    }),
    body: joi_1.default.object()
        .keys({
        termName: joi_1.default.string().trim(),
        school: joi_1.default.string().trim().allow(null, ''),
        startDate: joi_1.default.date(),
        endDate: joi_1.default.date(),
        isActive: joi_1.default.boolean(),
    })
        .min(1),
};
exports.deleteTerm = {
    params: joi_1.default.object().keys({
        termId: joi_1.default.string().required(),
    }),
};
exports.getActiveTerm = {
    query: joi_1.default.object().keys({
        school: joi_1.default.string().trim().optional(),
    }),
};
//# sourceMappingURL=term.validation.js.map