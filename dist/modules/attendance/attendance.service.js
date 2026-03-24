"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAttendanceSummary = exports.queryAttendance = void 0;
const http_status_1 = __importDefault(require("http-status"));
const errors_1 = require("../errors");
const school_1 = require("../school");
const student_1 = require("../student");
const term_1 = require("../term");
const attendance_model_1 = __importDefault(require("./attendance.model"));
const ATTENDED_STATUSES = new Set(['present', 'late', 'excused']);
const toDateKey = (value) => value.toISOString().slice(0, 10);
const buildDayList = (startDate, endDate) => {
    const days = [];
    const current = new Date(startDate);
    current.setUTCHours(0, 0, 0, 0);
    const last = new Date(endDate);
    last.setUTCHours(0, 0, 0, 0);
    while (current <= last) {
        const date = toDateKey(current);
        const dayOfMonth = new Date(current).getUTCDate();
        days.push({
            date,
            label: String(dayOfMonth),
        });
        current.setUTCDate(current.getUTCDate() + 1);
    }
    return days;
};
const resolveSchoolContext = async (actor, schoolId) => {
    if (actor.accountType !== 'internal') {
        if (actor.role === 'school-admin' || actor.role === 'teacher' || actor.role === 'staff') {
            if (!actor.schoolId) {
                throw new errors_1.ApiError(http_status_1.default.FORBIDDEN, 'School context is missing for this user');
            }
            if (schoolId && schoolId !== actor.schoolId) {
                throw new errors_1.ApiError(http_status_1.default.FORBIDDEN, 'Cannot access attendance for another school');
            }
            schoolId = actor.schoolId;
        }
        if (actor.role === 'school-board-admin') {
            if (!actor.schoolBoardId) {
                throw new errors_1.ApiError(http_status_1.default.FORBIDDEN, 'School board context is missing for this user');
            }
            if (!schoolId) {
                throw new errors_1.ApiError(http_status_1.default.BAD_REQUEST, 'school is required for school-board-admin');
            }
            const school = await school_1.School.findById(schoolId);
            if (!school || school.schoolBoard !== actor.schoolBoardId) {
                throw new errors_1.ApiError(http_status_1.default.FORBIDDEN, 'School is outside your school board');
            }
        }
    }
    if (!schoolId) {
        throw new errors_1.ApiError(http_status_1.default.BAD_REQUEST, 'school is required');
    }
    const school = await school_1.School.findById(schoolId);
    if (!school) {
        throw new errors_1.ApiError(http_status_1.default.NOT_FOUND, 'School not found');
    }
    return school;
};
const resolveTermForAttendance = async (schoolId, termId) => {
    if (termId) {
        const explicitTerm = await term_1.Term.findById(termId);
        if (!explicitTerm) {
            throw new errors_1.ApiError(http_status_1.default.NOT_FOUND, 'Term not found');
        }
        if (explicitTerm.school && explicitTerm.school !== schoolId) {
            throw new errors_1.ApiError(http_status_1.default.BAD_REQUEST, 'Selected term is scoped to a different school');
        }
        if (!explicitTerm.school) {
            const school = await school_1.School.findById(schoolId);
            if (!school || explicitTerm.schoolBoard !== school.schoolBoard) {
                throw new errors_1.ApiError(http_status_1.default.BAD_REQUEST, 'Selected global term does not match school board');
            }
        }
        return explicitTerm;
    }
    const activeTerm = await term_1.termService.getActiveTermForSchool(schoolId);
    if (!activeTerm) {
        throw new errors_1.ApiError(http_status_1.default.NOT_FOUND, 'No active term found for this school');
    }
    return activeTerm;
};
const queryAttendance = async (filter, options, actor, context) => {
    const school = await resolveSchoolContext(actor, context.schoolId);
    const term = await resolveTermForAttendance(school.id, context.termId);
    return attendance_model_1.default.paginate(Object.assign(Object.assign({}, filter), { school: school.id, termId: term.id, date: {
            $gte: term.startDate,
            $lte: term.endDate,
        } }), options);
};
exports.queryAttendance = queryAttendance;
const getAttendanceSummary = async (actor, context) => {
    const school = await resolveSchoolContext(actor, context.schoolId);
    const term = await resolveTermForAttendance(school.id, context.termId);
    const students = await student_1.Student.find({ school: school.id }).sort({ lastName: 1, firstName: 1 });
    const records = await attendance_model_1.default.find({
        school: school.id,
        termId: term.id,
        date: {
            $gte: term.startDate,
            $lte: term.endDate,
        },
    });
    const days = buildDayList(new Date(term.startDate), new Date(term.endDate));
    const dayKeys = days.map((item) => item.date);
    const byStudentDate = new Map();
    records.forEach((record) => {
        const studentKey = record.student;
        const dateKey = toDateKey(new Date(record.date));
        const rowMap = byStudentDate.get(studentKey) || new Map();
        rowMap.set(dateKey, record.status);
        byStudentDate.set(studentKey, rowMap);
    });
    const rows = students.map((student) => {
        const statusMap = byStudentDate.get(student.id) || new Map();
        const statusByDate = dayKeys.reduce((acc, dateKey) => {
            acc[dateKey] = statusMap.get(dateKey) || '-';
            return acc;
        }, {});
        const attendedDays = dayKeys.reduce((count, dateKey) => {
            const status = statusMap.get(dateKey);
            return ATTENDED_STATUSES.has(status || '') ? count + 1 : count;
        }, 0);
        const attendancePercentage = dayKeys.length > 0 ? Number(((attendedDays / dayKeys.length) * 100).toFixed(2)) : 0;
        return {
            studentId: student.id,
            studentName: `${student.firstName} ${student.lastName}`,
            regNumber: student.regNumber,
            attendancePercentage,
            statusByDate,
        };
    });
    return {
        school: {
            id: school.id,
            name: school.name,
        },
        term: {
            id: term.id,
            name: term.name,
            academicSessionId: term.academicSessionId,
            schoolBoard: term.schoolBoard,
            school: term.school,
            startDate: term.startDate,
            endDate: term.endDate,
            isActive: term.isActive,
            resolvedScope: term.school ? 'school' : 'school-board',
        },
        days,
        rows,
    };
};
exports.getAttendanceSummary = getAttendanceSummary;
//# sourceMappingURL=attendance.service.js.map