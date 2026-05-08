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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAttendanceCalendarSummary = exports.getAttendanceSummary = exports.getAttendance = void 0;
const utils_1 = require("../utils");
const attendanceService = __importStar(require("./attendance.service"));
exports.getAttendance = (0, utils_1.catchAsync)(async (req, res) => {
    const filter = (0, utils_1.pick)(req.query, ['student', 'status']);
    const options = (0, utils_1.pick)(req.query, ['sortBy', 'limit', 'page']);
    const schoolId = req.query['school'];
    const termId = req.query['termId'];
    const classId = req.query['classId'];
    const context = {};
    if (schoolId) {
        context.schoolId = schoolId;
    }
    if (termId) {
        context.termId = termId;
    }
    if (classId) {
        context.classId = classId;
    }
    const result = await attendanceService.queryAttendance(filter, options, req.account, context);
    res.send(result);
});
exports.getAttendanceSummary = (0, utils_1.catchAsync)(async (req, res) => {
    const schoolId = req.query['school'];
    const termId = req.query['termId'];
    const classId = req.query['classId'];
    const context = {};
    if (schoolId) {
        context.schoolId = schoolId;
    }
    if (termId) {
        context.termId = termId;
    }
    if (classId) {
        context.classId = classId;
    }
    const summary = await attendanceService.getAttendanceSummary(req.account, context);
    res.send(summary);
});
exports.getAttendanceCalendarSummary = (0, utils_1.catchAsync)(async (req, res) => {
    const classId = req.query['classId'];
    const schoolId = req.query['schoolId'];
    const termId = req.query['termId'];
    const academicSessionId = req.query['academicSessionId'];
    const month = req.query['month'] ? Number(req.query['month']) : undefined;
    const year = req.query['year'] ? Number(req.query['year']) : undefined;
    const context = {
        classId,
        schoolId,
        termId,
        academicSessionId,
        publicBaseUrl: `${req.protocol}://${req.get('host') || ''}`,
    };
    if (month !== undefined) {
        context.month = month;
    }
    if (year !== undefined) {
        context.year = year;
    }
    const summary = await attendanceService.getAttendanceCalendarSummary(req.account, context);
    res.send(summary);
});
//# sourceMappingURL=attendance.controller.js.map