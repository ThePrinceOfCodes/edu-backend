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
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
    var _a;
    const classId = req.query['classId'];
    const schoolId = req.query['schoolId'];
    const month = req.query['month'] ? Number(req.query['month']) : undefined;
    const year = req.query['year'] ? Number(req.query['year']) : undefined;
    let foundTermId;
    let foundAcademicSessionId;
    // Try to find term by date range - but don't fail if not found
    if (month !== undefined && year !== undefined) {
        try {
            const startOfMonth = new Date(year, month - 1, 1);
            const endOfMonth = new Date(year, month, 0);
            const termServiceModule = await Promise.resolve().then(() => __importStar(require('../term/term.service')));
            const term = await termServiceModule.getTermForDateRange(startOfMonth, endOfMonth, req.account, schoolId);
            foundTermId = (_a = term === null || term === void 0 ? void 0 : term._id) === null || _a === void 0 ? void 0 : _a.toString();
            foundAcademicSessionId = term === null || term === void 0 ? void 0 : term.academicSession;
        }
        catch (e) {
            // Term lookup failed - continue without termId (term is optional)
        }
    }
    const context = {
        classId,
        schoolId,
        publicBaseUrl: `${req.protocol}://${req.get('host') || ''}`,
    };
    if (foundTermId) {
        context.termId = foundTermId;
    }
    if (foundAcademicSessionId) {
        context.academicSessionId = foundAcademicSessionId;
    }
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