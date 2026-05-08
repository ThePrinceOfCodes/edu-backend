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
const express_1 = __importDefault(require("express"));
const validate_middleware_1 = __importDefault(require("../../modules/validate/validate.middleware"));
const auth_1 = require("../../modules/auth");
const studentValidation = __importStar(require("../../modules/student/student.validation"));
const studentController = __importStar(require("../../modules/student/student.controller"));
const router = express_1.default.Router();
router
    .route('/')
    .post(auth_1.authenticate, (0, auth_1.authorize)('students.write'), (0, validate_middleware_1.default)(studentValidation.createStudent), studentController.createStudent)
    .get(auth_1.authenticate, (0, auth_1.authorize)('students.read'), (0, validate_middleware_1.default)(studentValidation.getStudents), studentController.getStudents);
router.post('/bulk-import', auth_1.authenticate, (0, auth_1.authorize)('students.write'), (0, validate_middleware_1.default)(studentValidation.createStudentsBulk), studentController.createStudentsBulk);
router.post('/:studentId/promote', auth_1.authenticate, (0, auth_1.authorize)('students.write'), (0, validate_middleware_1.default)(studentValidation.promoteStudent), studentController.promoteStudent);
router
    .route('/:studentId')
    .get(auth_1.authenticate, (0, auth_1.authorize)('students.read'), (0, validate_middleware_1.default)(studentValidation.getStudentById), studentController.getStudentById)
    .patch(auth_1.authenticate, (0, auth_1.authorize)('students.write'), (0, validate_middleware_1.default)(studentValidation.updateStudent), studentController.updateStudent)
    .delete(auth_1.authenticate, (0, auth_1.authorize)('students.write'), (0, validate_middleware_1.default)(studentValidation.deleteStudent), studentController.deleteStudent);
exports.default = router;
//# sourceMappingURL=student.route.js.map