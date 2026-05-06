"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAttendanceFromParsedRows = void 0;
const http_status_1 = __importDefault(require("http-status"));
const errors_1 = require("../errors");
const attendance_model_1 = __importDefault(require("../attendance/attendance.model"));
const student_1 = require("../student");
const term_1 = require("../term");
const school_1 = require("../school");
const attendant_parser_service_1 = require("./attendant-parser.service");
const attendant_dates_util_1 = require("./attendant-dates.util");
const createAttendanceFromParsedRows = async (payload) => {
    var _a;
    const school = await school_1.School.findById(payload.schoolId);
    if (!school)
        throw new errors_1.ApiError(http_status_1.default.NOT_FOUND, 'School not found');
    const term = await term_1.Term.findById(payload.termId);
    if (!term)
        throw new errors_1.ApiError(http_status_1.default.NOT_FOUND, 'Term not found');
    const created = [];
    for (const row of payload.rows) {
        // Resolve the student record by admission number first, then name
        const student = row.admissionNumber
            ? await student_1.Student.findOne({ school: payload.schoolId, regNumber: row.admissionNumber })
            : row.studentName
                ? await student_1.Student.findOne({
                    school: payload.schoolId,
                    $or: [
                        { firstName: new RegExp(row.studentName, 'i') },
                        { lastName: new RegExp(row.studentName, 'i') },
                    ],
                })
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
                schoolBoard: school.schoolBoard,
                school: school.id,
                academicSessionId: payload.academicSessionId,
                termId: term.id,
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
//# sourceMappingURL=attendant-attendance.service.js.map