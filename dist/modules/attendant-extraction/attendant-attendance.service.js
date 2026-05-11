"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAttendanceFromExtractionPayload = exports.createAttendanceFromParsedRows = void 0;
const http_status_1 = __importDefault(require("http-status"));
const errors_1 = require("../errors");
const attendance_model_1 = __importDefault(require("../attendance/attendance.model"));
const student_1 = require("../student");
const school_1 = require("../school");
const studentEnrollment_helpers_1 = require("../student/studentEnrollment.helpers");
const attendant_parser_service_1 = require("./attendant-parser.service");
const attendant_dates_util_1 = require("./attendant-dates.util");
const flattenAttendanceMarks = (attendance) => {
    return Object.keys(attendance)
        .sort((a, b) => {
        const aMatch = a.match(/^week_(\d+)$/);
        const bMatch = b.match(/^week_(\d+)$/);
        if (aMatch && bMatch)
            return Number(aMatch[1]) - Number(bMatch[1]);
        if (aMatch)
            return -1;
        if (bMatch)
            return 1;
        return a.localeCompare(b);
    })
        .flatMap((weekKey) => {
        const marks = String(attendance[weekKey] || '')
            .trim()
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 5);
        while (marks.length < 5) {
            marks.push('X');
        }
        return marks;
    });
};
const createAttendanceFromParsedRows = async (payload) => {
    var _a;
    const school = await school_1.School.findById(payload.schoolId);
    if (!school)
        throw new errors_1.ApiError(http_status_1.default.NOT_FOUND, 'School not found');
    const allowedStudentIds = new Set(await (0, studentEnrollment_helpers_1.findStudentIdsForPlacement)({
        schoolId: payload.schoolId,
    }));
    const created = [];
    for (const row of payload.rows) {
        // Resolve the student record by admission number first, then name
        const matchedByRegNumber = row.admissionNumber
            ? await student_1.Student.findOne({ regNumber: row.admissionNumber })
            : null;
        const matchedByName = !matchedByRegNumber && row.studentName
            ? await student_1.Student.findOne({
                _id: { $in: Array.from(allowedStudentIds) },
                $or: [
                    { firstName: new RegExp(row.studentName, 'i') },
                    { lastName: new RegExp(row.studentName, 'i') },
                ],
            })
            : null;
        const student = matchedByRegNumber && allowedStudentIds.has(matchedByRegNumber.id)
            ? matchedByRegNumber
            : row.studentName
                ? matchedByName
                : null;
        if (!student)
            continue;
        // Map each raw mark to its corresponding working day
        const dayEntries = (0, attendant_dates_util_1.zipMarksToWorkingDays)(payload.workingDays, (_a = row.statusMarks) !== null && _a !== void 0 ? _a : []);
        for (const { date, rawMark } of dayEntries) {
            const resolvedStatus = (0, attendant_parser_service_1.normaliseStatusMark)(rawMark);
            if (!resolvedStatus)
                continue; // unrecognised mark — skip
            const attendance = await attendance_model_1.default.findOneAndUpdate({ student: student.id, date }, {
                student: student.id,
                regNumber: student.regNumber,
                schoolId: school.id,
                date,
                status: resolvedStatus,
                source: 'attendant-extraction',
            }, { upsert: true, new: true, setDefaultsOnInsert: true });
            created.push(attendance);
        }
    }
    return created;
};
exports.createAttendanceFromParsedRows = createAttendanceFromParsedRows;
const createAttendanceFromExtractionPayload = async (payload) => {
    return (0, exports.createAttendanceFromParsedRows)({
        schoolId: payload.schoolId,
        workingDays: (0, attendant_dates_util_1.getWorkingDays)(payload.startDate, payload.endDate),
        rows: payload.students.map((student) => ({
            admissionNumber: student.admission_number,
            studentName: student.student_name,
            statusMarks: flattenAttendanceMarks(student.attendance),
        })),
    });
};
exports.createAttendanceFromExtractionPayload = createAttendanceFromExtractionPayload;
//# sourceMappingURL=attendant-attendance.service.js.map