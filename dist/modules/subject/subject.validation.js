"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteSubject = exports.updateSubject = exports.getSubject = exports.getSubjects = exports.createSubject = void 0;
const joi_1 = __importDefault(require("joi"));
exports.createSubject = {
    body: joi_1.default.object().keys({
        name: joi_1.default.string().trim().required(),
        code: joi_1.default.string().trim().required(),
    }),
};
exports.getSubjects = {
    query: joi_1.default.object().keys({
        name: joi_1.default.string(),
        code: joi_1.default.string(),
        sortBy: joi_1.default.string(),
        limit: joi_1.default.number().integer(),
        page: joi_1.default.number().integer(),
    }),
};
exports.getSubject = {
    params: joi_1.default.object().keys({
        subjectId: joi_1.default.string().required(),
    }),
};
exports.updateSubject = {
    params: joi_1.default.object().keys({
        subjectId: joi_1.default.string().required(),
    }),
    body: joi_1.default.object()
        .keys({
        name: joi_1.default.string().trim(),
        code: joi_1.default.string().trim(),
    })
        .min(1),
};
exports.deleteSubject = {
    params: joi_1.default.object().keys({
        subjectId: joi_1.default.string().required(),
    }),
};
//# sourceMappingURL=subject.validation.js.map