"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteStudent = exports.promoteStudent = exports.updateStudent = exports.getStudentById = exports.getStudents = exports.createStudentsBulk = exports.createStudent = void 0;
const joi_1 = __importDefault(require("joi"));
exports.createStudent = {
    body: joi_1.default.object().keys({
        firstName: joi_1.default.string().trim().required(),
        middleName: joi_1.default.string().trim().optional().allow(null, ''),
        lastName: joi_1.default.string().trim().required(),
        regNumber: joi_1.default.string().trim().required(),
        stateOfOrigin: joi_1.default.string().trim().required(),
        localGovernment: joi_1.default.string().trim().required(),
        gender: joi_1.default.string().valid('male', 'female').required(),
        dateOfBirth: joi_1.default.date().required(),
        school: joi_1.default.string().trim().required(),
        classId: joi_1.default.string().trim().required(),
        status: joi_1.default.string().valid('active', 'inactive').optional(),
    }),
};
exports.createStudentsBulk = {
    body: joi_1.default.object().keys({
        students: joi_1.default.array()
            .items(joi_1.default.object().keys({
            firstName: joi_1.default.string().trim().required(),
            middleName: joi_1.default.string().trim().optional().allow(null, ''),
            lastName: joi_1.default.string().trim().required(),
            regNumber: joi_1.default.string().trim().required(),
            stateOfOrigin: joi_1.default.string().trim().required(),
            localGovernment: joi_1.default.string().trim().required(),
            gender: joi_1.default.string().valid('male', 'female').required(),
            dateOfBirth: joi_1.default.date().required(),
            school: joi_1.default.string().trim().required(),
            classId: joi_1.default.string().trim().required(),
            status: joi_1.default.string().valid('active', 'inactive').optional(),
        }))
            .min(1)
            .required(),
    }),
};
exports.getStudents = {
    query: joi_1.default.object().keys({
        firstName: joi_1.default.string(),
        lastName: joi_1.default.string(),
        regNumber: joi_1.default.string(),
        stateOfOrigin: joi_1.default.string(),
        localGovernment: joi_1.default.string(),
        gender: joi_1.default.string().valid('male', 'female'),
        school: joi_1.default.string(),
        classId: joi_1.default.string(),
        status: joi_1.default.string().valid('active', 'inactive'),
        sortBy: joi_1.default.string(),
        limit: joi_1.default.number().integer(),
        page: joi_1.default.number().integer(),
    }),
};
exports.getStudentById = {
    params: joi_1.default.object().keys({
        studentId: joi_1.default.string().required(),
    }),
};
exports.updateStudent = {
    params: joi_1.default.object().keys({
        studentId: joi_1.default.string().required(),
    }),
    body: joi_1.default.object()
        .keys({
        firstName: joi_1.default.string().trim(),
        middleName: joi_1.default.string().trim().allow(null, ''),
        lastName: joi_1.default.string().trim(),
        stateOfOrigin: joi_1.default.string().trim(),
        localGovernment: joi_1.default.string().trim(),
        gender: joi_1.default.string().valid('male', 'female'),
        dateOfBirth: joi_1.default.date(),
        status: joi_1.default.string().valid('active', 'inactive'),
    })
        .min(1),
};
exports.promoteStudent = {
    params: joi_1.default.object().keys({
        studentId: joi_1.default.string().required(),
    }),
    body: joi_1.default.object()
        .keys({
        school: joi_1.default.string().trim().optional(),
        classId: joi_1.default.string().trim().required(),
    })
        .required(),
};
exports.deleteStudent = {
    params: joi_1.default.object().keys({
        studentId: joi_1.default.string().required(),
    }),
};
//# sourceMappingURL=student.validation.js.map