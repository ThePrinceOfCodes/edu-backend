"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteStudent = exports.promoteStudent = exports.updateStudent = exports.getStudentById = exports.getStudents = exports.createStudentsBulk = exports.createStudent = void 0;
const http_status_1 = __importDefault(require("http-status"));
const utils_1 = require("../utils");
const studentService = __importStar(require("./student.service"));
const getStudentIdFromParams = (req) => req.params['studentId'];
exports.createStudent = (0, utils_1.catchAsync)(async (req, res) => {
    const student = await studentService.createStudent(req.body, req.account);
    res.status(http_status_1.default.CREATED).send(student);
});
exports.createStudentsBulk = (0, utils_1.catchAsync)(async (req, res) => {
    const result = await studentService.createStudentsBulk(req.body.students, req.account);
    res.status(http_status_1.default.CREATED).send(result);
});
exports.getStudents = (0, utils_1.catchAsync)(async (req, res) => {
    const filter = (0, utils_1.pick)(req.query, [
        'firstName',
        'lastName',
        'regNumber',
        'stateOfOrigin',
        'localGovernment',
        'gender',
        'school',
        'classId',
        'status',
    ]);
    const options = (0, utils_1.pick)(req.query, ['sortBy', 'limit', 'page']);
    const result = await studentService.queryStudents(filter, options, req.account);
    res.send(result);
});
exports.getStudentById = (0, utils_1.catchAsync)(async (req, res) => {
    const student = await studentService.getStudentById(getStudentIdFromParams(req), req.account);
    res.send(student);
});
exports.updateStudent = (0, utils_1.catchAsync)(async (req, res) => {
    const student = await studentService.updateStudentById(getStudentIdFromParams(req), req.body, req.account);
    res.send(student);
});
exports.promoteStudent = (0, utils_1.catchAsync)(async (req, res) => {
    const student = await studentService.promoteStudentById(getStudentIdFromParams(req), req.body, req.account);
    res.send(student);
});
exports.deleteStudent = (0, utils_1.catchAsync)(async (req, res) => {
    await studentService.deleteStudentById(getStudentIdFromParams(req), req.account);
    res.status(http_status_1.default.NO_CONTENT).send();
});
//# sourceMappingURL=student.controller.js.map