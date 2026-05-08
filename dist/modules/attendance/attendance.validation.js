"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAttendanceCalendarSummary = exports.getAttendanceSummary = exports.getAttendance = void 0;
const joi_1 = __importDefault(require("joi"));
exports.getAttendance = {
    query: joi_1.default.object().keys({
        school: joi_1.default.string().trim().optional(),
        termId: joi_1.default.string().trim().optional(),
        classId: joi_1.default.string().trim().optional(),
        student: joi_1.default.string().trim().optional(),
        status: joi_1.default.string().valid('present', 'absent', 'late', 'excused').optional(),
        sortBy: joi_1.default.string(),
        limit: joi_1.default.number().integer(),
        page: joi_1.default.number().integer(),
    }),
};
exports.getAttendanceSummary = {
    query: joi_1.default.object().keys({
        school: joi_1.default.string().trim().optional(),
        termId: joi_1.default.string().trim().optional(),
        classId: joi_1.default.string().trim().optional(),
    }),
};
exports.getAttendanceCalendarSummary = {
    query: joi_1.default.object().keys({
        classId: joi_1.default.string().required(),
        schoolId: joi_1.default.string().required(),
        termId: joi_1.default.string().required(),
        academicSessionId: joi_1.default.string().required(),
        month: joi_1.default.number().integer().min(1).max(12).optional(),
        year: joi_1.default.number().integer().min(2000).max(3000).optional(),
    }),
};
exports.getAttendanceCalendarSummary = {
    query: joi_1.default.object().keys({
        classId: joi_1.default.string().required(),
        schoolId: joi_1.default.string().required(),
        termId: joi_1.default.string().required(),
        academicSessionId: joi_1.default.string().required(),
    }),
};
//# sourceMappingURL=attendance.validation.js.map