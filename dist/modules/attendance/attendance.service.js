"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAttendanceCalendarSummary = exports.getAttendanceSummary = exports.queryAttendance = void 0;
const http_status_1 = __importDefault(require("http-status"));
const errors_1 = require("../errors");
const school_1 = require("../school");
const class_1 = require("../class");
const student_1 = require("../student");
const term_1 = require("../term");
const studentEnrollment_helpers_1 = require("../student/studentEnrollment.helpers");
const attendance_model_1 = __importDefault(require("./attendance.model"));
const attendant_extraction_service_1 = require("../attendant-extraction/attendant-extraction.service");
const attendant_extraction_model_1 = __importDefault(require("../attendant-extraction/attendant-extraction.model"));
const attendant_review_model_1 = __importDefault(require("../attendant-review/attendant-review.model"));
const attendant_dates_util_1 = require("../attendant-extraction/attendant-dates.util");
const ATTENDED_STATUSES = new Set(['present']);
const toDateKey = (value) => value.toISOString().slice(0, 10);
const isWeekend = (date) => {
    const day = date.getUTCDay();
    return day === 0 || day === 6;
};
const normalizeStatus = (status) => {
    if (!status)
        return '-';
    if (status === 'present' || status === 'late')
        return 'present';
    if (status === 'absent' || status === 'excused')
        return 'absent';
    return '-';
};
const buildDayList = (startDate, endDate) => {
    const days = [];
    const current = new Date(startDate);
    current.setUTCHours(0, 0, 0, 0);
    const last = new Date(endDate);
    last.setUTCHours(0, 0, 0, 0);
    while (current <= last) {
        if (!isWeekend(current)) {
            const date = toDateKey(current);
            const dayOfMonth = current.getUTCDate();
            days.push({
                date,
                label: String(dayOfMonth),
            });
        }
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
const resolveClassContext = async (schoolId, classId) => {
    const classDoc = await class_1.ClassModel.findById(classId);
    if (!classDoc) {
        throw new errors_1.ApiError(http_status_1.default.NOT_FOUND, 'Class not found');
    }
    const matchingStudentIds = await (0, studentEnrollment_helpers_1.findStudentIdsForPlacement)({
        schoolId,
        classId,
    });
    if (matchingStudentIds.length === 0) {
        // class exists but no student in that school/class scope
        // keep the endpoint strict so mobile doesn't silently show wrong data
        throw new errors_1.ApiError(http_status_1.default.FORBIDDEN, 'Class is outside the requested school scope');
    }
    return classDoc;
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
    if (activeTerm) {
        return activeTerm;
    }
    const school = await school_1.School.findById(schoolId);
    if (!school) {
        throw new errors_1.ApiError(http_status_1.default.NOT_FOUND, 'School not found');
    }
    if (!school.schoolBoard) {
        throw new errors_1.ApiError(http_status_1.default.BAD_REQUEST, 'School does not belong to a school board');
    }
    const boardTerm = await term_1.termService.getActiveTermForSchoolBoard(school.schoolBoard);
    if (boardTerm) {
        return boardTerm;
    }
    throw new errors_1.ApiError(http_status_1.default.NOT_FOUND, 'No active term found for this school or school board');
};
const queryAttendance = async (filter, options, actor, context) => {
    const school = await resolveSchoolContext(actor, context.schoolId);
    const term = await resolveTermForAttendance(school.id, context.termId);
    if (context.classId) {
        const allowedClassIds = school.classes || [];
        if (!allowedClassIds.includes(context.classId)) {
            throw new errors_1.ApiError(http_status_1.default.BAD_REQUEST, 'Selected class does not belong to this school');
        }
    }
    const studentIds = await (0, studentEnrollment_helpers_1.findStudentIdsForPlacement)(Object.assign({ schoolId: school.id }, (context.classId ? { classId: context.classId } : {})));
    if (studentIds.length === 0) {
        return attendance_model_1.default.paginate({ _id: { $in: [] } }, options);
    }
    return attendance_model_1.default.paginate(Object.assign(Object.assign({}, filter), { student: { $in: studentIds }, date: {
            $gte: term.startDate,
            $lte: term.endDate,
        } }), options);
};
exports.queryAttendance = queryAttendance;
const getAttendanceSummary = async (actor, context) => {
    const school = await resolveSchoolContext(actor, context.schoolId);
    const term = await resolveTermForAttendance(school.id, context.termId);
    if (context.classId) {
        const allowedClassIds = school.classes || [];
        if (!allowedClassIds.includes(context.classId)) {
            throw new errors_1.ApiError(http_status_1.default.BAD_REQUEST, 'Selected class does not belong to this school');
        }
    }
    const studentIds = await (0, studentEnrollment_helpers_1.findStudentIdsForPlacement)(Object.assign({ schoolId: school.id }, (context.classId ? { classId: context.classId } : {})));
    const students = await student_1.Student.find({ _id: { $in: studentIds } }).sort({ lastName: 1, firstName: 1 });
    const currentPlacementMap = await (0, studentEnrollment_helpers_1.getCurrentEnrollmentMap)(studentIds);
    const placementMap = new Map(students.map((student) => [
        student.id,
        (0, studentEnrollment_helpers_1.getEffectivePlacement)(student, null, currentPlacementMap.get(student.id)),
    ]));
    const classIds = Array.from(new Set(students
        .map((student) => { var _a; return (_a = placementMap.get(student.id)) === null || _a === void 0 ? void 0 : _a.classId; })
        .filter((value) => Boolean(value))));
    const classes = classIds.length > 0 ? await class_1.ClassModel.find({ _id: { $in: classIds } }) : [];
    const classById = new Map(classes.map((classItem) => [classItem.id, classItem]));
    const records = await attendance_model_1.default.find({
        student: { $in: students.map((student) => student.id) },
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
        var _a, _b;
        const statusMap = byStudentDate.get(student.id) || new Map();
        const placement = placementMap.get(student.id);
        const studentClass = (placement === null || placement === void 0 ? void 0 : placement.classId) ? classById.get(placement.classId) : null;
        const statusByDate = dayKeys.reduce((acc, dateKey) => {
            acc[dateKey] = normalizeStatus(statusMap.get(dateKey));
            return acc;
        }, {});
        const daysWithRecord = dayKeys.filter((dateKey) => statusMap.has(dateKey));
        const attendedDays = daysWithRecord.reduce((count, dateKey) => {
            const status = normalizeStatus(statusMap.get(dateKey));
            return ATTENDED_STATUSES.has(status) ? count + 1 : count;
        }, 0);
        const attendancePercentage = daysWithRecord.length > 0 ? Number(((attendedDays / daysWithRecord.length) * 100).toFixed(2)) : 0;
        return {
            studentId: student.id,
            studentName: `${student.firstName} ${student.lastName}`,
            regNumber: student.regNumber,
            gender: student.gender,
            classId: (placement === null || placement === void 0 ? void 0 : placement.classId) || null,
            classCode: (_a = studentClass === null || studentClass === void 0 ? void 0 : studentClass.code) !== null && _a !== void 0 ? _a : null,
            className: (_b = studentClass === null || studentClass === void 0 ? void 0 : studentClass.name) !== null && _b !== void 0 ? _b : null,
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
            academicSession: term.academicSession,
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
const buildDateKey = (value) => value.toISOString().slice(0, 10);
const buildDayGrid = (startDate, endDate) => {
    return (0, attendant_dates_util_1.getWorkingDays)(startDate, endDate).map((date) => ({
        date: buildDateKey(date),
        label: String(new Date(date).getUTCDate()),
    }));
};
const buildMonthWindow = (termStartDate, termEndDate, month, year) => {
    if (!month || !year) {
        return {
            startDate: termStartDate,
            endDate: termEndDate,
        };
    }
    const monthStartDate = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
    const monthEndDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
    return {
        startDate: monthStartDate > termStartDate ? monthStartDate : termStartDate,
        endDate: monthEndDate < termEndDate ? monthEndDate : termEndDate,
    };
};
const buildDateRangeKeys = (startDate, endDate) => {
    const keys = [];
    const current = new Date(Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth(), startDate.getUTCDate()));
    const end = new Date(Date.UTC(endDate.getUTCFullYear(), endDate.getUTCMonth(), endDate.getUTCDate()));
    while (current <= end) {
        keys.push(buildDateKey(current));
        current.setUTCDate(current.getUTCDate() + 1);
    }
    return keys;
};
const getAttendanceCalendarSummary = async (actor, context) => {
    const school = await resolveSchoolContext(actor, context.schoolId);
    // Term is optional - skip term validation if not provided
    let term = null;
    if (context.termId) {
        term = await term_1.Term.findById(context.termId);
        if (!term) {
            throw new errors_1.ApiError(http_status_1.default.NOT_FOUND, 'Term not found');
        }
        await resolveClassContext(school.id, context.classId);
        if (term.school && term.school !== school.id) {
            throw new errors_1.ApiError(http_status_1.default.BAD_REQUEST, 'Selected term is scoped to a different school');
        }
        if (!term.school && school.schoolBoard !== term.schoolBoard) {
            throw new errors_1.ApiError(http_status_1.default.BAD_REQUEST, 'Selected global term does not match school board');
        }
    }
    // Validate class if term provided or not
    await resolveClassContext(school.id, context.classId);
    // Build month window if we have term and month/year
    let monthWindow = null;
    if (term && context.month !== undefined && context.year !== undefined) {
        monthWindow = buildMonthWindow(new Date(term.startDate), new Date(term.endDate), context.month, context.year);
    }
    // If no term, use provided month/year to build window
    if (!term && context.month !== undefined && context.year !== undefined) {
        monthWindow = {
            startDate: new Date(context.year, context.month - 1, 1),
            endDate: new Date(context.year, context.month, 0),
        };
    }
    // Return empty calendar if no month window
    if (!monthWindow) {
        return {
            school: {
                id: school.id,
                name: school.name,
            },
            term: term ? {
                id: term.id,
                name: term.name,
                academicSession: term.academicSession,
                schoolBoard: term.schoolBoard,
                school: term.school,
                startDate: term.startDate,
                endDate: term.endDate,
                isActive: term.isActive,
                resolvedScope: term.school ? 'school' : 'school-board',
            } : undefined,
            class: {
                id: context.classId,
            },
            days: [],
            rows: [],
            extractions: [],
            reviewSummary: {
                pending: 0,
                resolved: 0,
                ignored: 0,
            },
        };
    }
    if (monthWindow.startDate > monthWindow.endDate) {
        return {
            school: {
                id: school.id,
                name: school.name,
            },
            term: term ? {
                id: term.id,
                name: term.name,
                academicSession: term.academicSession,
                schoolBoard: term.schoolBoard,
                school: term.school,
                startDate: term.startDate,
                endDate: term.endDate,
                isActive: term.isActive,
                resolvedScope: term.school ? 'school' : 'school-board',
            } : undefined,
            class: {
                id: context.classId,
            },
            days: [],
            rows: [],
            extractions: [],
            reviewSummary: {
                pending: 0,
                resolved: 0,
                ignored: 0,
            },
        };
    }
    // Query extractions - only filter by term if provided
    const extractionQuery = {
        schoolId: school.id,
        status: { $in: ['parsed', 'attendance_created', 'needs_review'] },
        startDate: { $lte: monthWindow.endDate },
        endDate: { $gte: monthWindow.startDate },
    };
    if (context['termId']) {
        extractionQuery['termId'] = context['termId'];
    }
    if (context['academicSessionId']) {
        extractionQuery['academicSessionId'] = context['academicSessionId'];
    }
    const extractions = await attendant_extraction_model_1.default.find(extractionQuery).sort({ createdAt: 1 });
    const classStudentIds = await (0, studentEnrollment_helpers_1.findStudentIdsForPlacement)({
        schoolId: school.id,
        classId: context.classId,
    });
    const classStudents = await student_1.Student.find({ _id: { $in: classStudentIds } }).sort({ lastName: 1, firstName: 1 });
    const reviewMap = new Map();
    const reviewIds = extractions.flatMap((item) => item.pendingReviewIds || []);
    if (reviewIds.length) {
        const reviews = await attendant_review_model_1.default.find({ _id: { $in: reviewIds } });
        reviews.forEach((review) => {
            reviewMap.set(review.id, Object.assign({ resolvedStatus: review.resolvedStatus }, (review.resolvedStudentId ? { resolvedStudentId: review.resolvedStudentId } : {})));
        });
    }
    const byStudentDate = new Map();
    const attendanceRecords = await attendance_model_1.default.find({
        student: { $in: classStudentIds },
        source: 'attendant-extraction',
        date: {
            $gte: monthWindow.startDate,
            $lte: monthWindow.endDate,
        },
    });
    attendanceRecords.forEach((record) => {
        const studentKey = record.student;
        const dateKey = buildDateKey(new Date(record.date));
        const statusMap = byStudentDate.get(studentKey) || new Map();
        statusMap.set(dateKey, record.status);
        byStudentDate.set(studentKey, statusMap);
    });
    const days = buildDayGrid(monthWindow.startDate, monthWindow.endDate);
    const dayKeys = days.map((item) => item.date);
    const rows = classStudents.map((student) => {
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
        term: term ? {
            id: term.id,
            name: term.name,
            academicSession: term.academicSession,
            schoolBoard: term.schoolBoard,
            school: term.school,
            startDate: term.startDate,
            endDate: term.endDate,
            isActive: term.isActive,
            resolvedScope: term.school ? 'school' : 'school-board',
        } : undefined,
        class: {
            id: context.classId,
        },
        days,
        rows,
        extractions: extractions.map((item) => {
            var _a;
            return ({
                id: item.id,
                status: item.status,
                startDate: item.startDate,
                endDate: item.endDate,
                dateRange: buildDateRangeKeys(new Date(item.startDate), new Date(item.endDate)),
                createdAt: item.createdAt,
                imageUrl: (0, attendant_extraction_service_1.buildExtractionImageUrl)(item.imagePath || item.originalImagePath, context.publicBaseUrl),
                pendingReviewCount: ((_a = item.pendingReviewIds) === null || _a === void 0 ? void 0 : _a.length) || 0,
            });
        }),
        reviewSummary: {
            pending: reviewMap.size ? Array.from(reviewMap.values()).filter((item) => item.resolvedStatus === 'pending').length : 0,
            resolved: reviewMap.size ? Array.from(reviewMap.values()).filter((item) => item.resolvedStatus === 'resolved').length : 0,
            ignored: reviewMap.size ? Array.from(reviewMap.values()).filter((item) => item.resolvedStatus === 'ignored').length : 0,
        },
    };
};
exports.getAttendanceCalendarSummary = getAttendanceCalendarSummary;
//# sourceMappingURL=attendance.service.js.map