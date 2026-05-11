"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteResult = exports.updateResult = exports.getResult = exports.getResults = exports.createResultsBulk = exports.createResult = void 0;
const joi_1 = __importDefault(require("joi"));
exports.createResult = {
    body: joi_1.default.object().keys({
        student: joi_1.default.string().trim().required(),
        school: joi_1.default.string().trim().required(),
        classId: joi_1.default.string().trim().required(),
        termId: joi_1.default.string().trim().required(),
        academicSessionId: joi_1.default.string().trim().required(),
        subject: joi_1.default.string().trim().required(),
        testScore: joi_1.default.number().min(0).max(100).required(),
        examScore: joi_1.default.number().min(0).max(100).required(),
        remark: joi_1.default.string().trim().allow(null, '').optional(),
        assessmentDate: joi_1.default.date().optional(),
    }),
};
exports.createResultsBulk = {
    body: joi_1.default.object().keys({
        results: joi_1.default.array()
            .items(joi_1.default.object().keys({
            student: joi_1.default.string().trim().required(),
            school: joi_1.default.string().trim().required(),
            classId: joi_1.default.string().trim().required(),
            termId: joi_1.default.string().trim().required(),
            academicSessionId: joi_1.default.string().trim().required(),
            subject: joi_1.default.string().trim().required(),
            testScore: joi_1.default.number().min(0).max(100).required(),
            examScore: joi_1.default.number().min(0).max(100).required(),
            remark: joi_1.default.string().trim().allow(null, '').optional(),
            assessmentDate: joi_1.default.date().optional(),
        }))
            .min(1)
            .required(),
    }),
};
exports.getResults = {
    query: joi_1.default.object().keys({
        student: joi_1.default.string().trim(),
        school: joi_1.default.string().trim(),
        classId: joi_1.default.string().trim(),
        termId: joi_1.default.string().trim(),
        academicSessionId: joi_1.default.string().trim(),
        subject: joi_1.default.string().trim(),
        sortBy: joi_1.default.string(),
        limit: joi_1.default.number().integer(),
        page: joi_1.default.number().integer(),
    }),
};
exports.getResult = {
    params: joi_1.default.object().keys({
        resultId: joi_1.default.string().required(),
    }),
};
exports.updateResult = {
    params: joi_1.default.object().keys({
        resultId: joi_1.default.string().required(),
    }),
    body: joi_1.default.object()
        .keys({
        subject: joi_1.default.string().trim(),
        testScore: joi_1.default.number().min(0).max(100),
        examScore: joi_1.default.number().min(0).max(100),
        remark: joi_1.default.string().trim().allow(null, ''),
        assessmentDate: joi_1.default.date(),
    })
        .min(1),
};
exports.deleteResult = {
    params: joi_1.default.object().keys({
        resultId: joi_1.default.string().required(),
    }),
};
//# sourceMappingURL=result.validation.js.map