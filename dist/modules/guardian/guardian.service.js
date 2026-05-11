"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMyStudentsOverview = exports.unlinkStudentsFromGuardian = exports.linkStudentsToGuardian = exports.getGuardians = exports.createGuardian = void 0;
const http_status_1 = __importDefault(require("http-status"));
const errors_1 = require("../errors");
const users_1 = require("../users");
const auth_1 = require("../auth");
const user_constants_1 = require("../users/user.constants");
const user_model_1 = __importDefault(require("../users/user.model"));
const student_model_1 = __importDefault(require("../student/student.model"));
const studentEnrollment_model_1 = __importDefault(require("../student/studentEnrollment.model"));
const studentEnrollment_helpers_1 = require("../student/studentEnrollment.helpers");
const school_model_1 = __importDefault(require("../school/school.model"));
const class_model_1 = __importDefault(require("../class/class.model"));
const attendance_model_1 = __importDefault(require("../attendance/attendance.model"));
const result_model_1 = __importDefault(require("../result/result.model"));
const term_model_1 = __importDefault(require("../term/term.model"));
const academicSession_model_1 = __importDefault(require("../academic-session/academicSession.model"));
const canManageGuardians = (actor) => {
    if (actor.accountType === 'internal') {
        return true;
    }
    return actor.role === 'school-board-admin' || actor.role === 'school-admin';
};
const isEnrollmentInActorScope = (actor, enrollment) => {
    if (actor.accountType === 'internal') {
        return true;
    }
    if (!enrollment) {
        return false;
    }
    if (actor.role === 'school-admin') {
        return enrollment.school === actor.schoolId;
    }
    if (actor.role === 'school-board-admin') {
        return enrollment.schoolBoard === actor.schoolBoardId;
    }
    return false;
};
const getCurrentEnrollmentByStudentId = async (studentIds) => {
    if (studentIds.length === 0) {
        return new Map();
    }
    const enrollments = await studentEnrollment_model_1.default.find({
        student: { $in: studentIds },
        isCurrent: true,
    })
        .select('student school schoolBoard classId academicSession')
        .lean();
    return new Map(enrollments.map((item) => [item.student, item]));
};
const getGuardianById = async (guardianId) => {
    const guardian = await user_model_1.default.findById(guardianId);
    if (!guardian || guardian.role !== 'guardian') {
        throw new errors_1.ApiError(http_status_1.default.NOT_FOUND, 'Guardian not found');
    }
    return guardian;
};
const ensureActorCanManageStudents = async (actor, studentIds) => {
    const students = await student_model_1.default.find({ _id: { $in: studentIds } });
    if (students.length !== studentIds.length) {
        throw new errors_1.ApiError(http_status_1.default.BAD_REQUEST, 'One or more student IDs are invalid');
    }
    if (actor.accountType === 'internal') {
        return students;
    }
    if (actor.role === 'school-admin') {
        if (!actor.schoolId) {
            throw new errors_1.ApiError(http_status_1.default.FORBIDDEN, 'School context is missing for this user');
        }
        const enrollments = await studentEnrollment_model_1.default.find({ student: { $in: studentIds }, isCurrent: true });
        if (enrollments.length !== studentIds.length) {
            throw new errors_1.ApiError(http_status_1.default.FORBIDDEN, 'Cannot assign guardian because some students do not have current school placement');
        }
        const invalid = enrollments.some((item) => item.school !== actor.schoolId);
        if (invalid) {
            throw new errors_1.ApiError(http_status_1.default.FORBIDDEN, 'Cannot assign guardians to students outside your school');
        }
        return students;
    }
    if (actor.role === 'school-board-admin') {
        if (!actor.schoolBoardId) {
            throw new errors_1.ApiError(http_status_1.default.FORBIDDEN, 'School board context is missing for this user');
        }
        const enrollments = await studentEnrollment_model_1.default.find({ student: { $in: studentIds }, isCurrent: true });
        if (enrollments.length !== studentIds.length) {
            throw new errors_1.ApiError(http_status_1.default.FORBIDDEN, 'Cannot assign guardian because some students do not have current school-board placement');
        }
        const invalid = enrollments.some((item) => item.schoolBoard !== actor.schoolBoardId);
        if (invalid) {
            throw new errors_1.ApiError(http_status_1.default.FORBIDDEN, 'Cannot assign guardians to students outside your school board');
        }
        return students;
    }
    throw new errors_1.ApiError(http_status_1.default.FORBIDDEN, 'You are not allowed to manage guardians');
};
const createGuardian = async (payload, actor) => {
    if (!canManageGuardians(actor)) {
        throw new errors_1.ApiError(http_status_1.default.FORBIDDEN, 'You are not allowed to create guardians');
    }
    const studentIds = Array.from(new Set(payload.studentIds.filter(Boolean)));
    if (studentIds.length === 0) {
        throw new errors_1.ApiError(http_status_1.default.BAD_REQUEST, 'studentIds must contain at least one student');
    }
    await ensureActorCanManageStudents(actor, studentIds);
    const guardian = await users_1.userService.createUser(Object.assign({ name: payload.name, email: payload.email, accountType: 'client', role: 'guardian', permissions: (0, user_constants_1.getPermissionsForRole)('guardian'), isVerified: true, status: 'active' }, (payload.phoneNumber ? { phoneNumber: payload.phoneNumber } : {})));
    await auth_1.authService.createAuth({
        user: guardian.id,
        email: payload.email,
        password: payload.password,
        provider: 'email',
    });
    await student_model_1.default.updateMany({ _id: { $in: studentIds } }, {
        $addToSet: {
            guardianIds: guardian.id,
        },
    });
    return {
        guardian,
        linkedStudentsCount: studentIds.length,
        linkedStudentIds: studentIds,
    };
};
exports.createGuardian = createGuardian;
const getGuardians = async (actor, query) => {
    var _a;
    if (!canManageGuardians(actor)) {
        throw new errors_1.ApiError(http_status_1.default.FORBIDDEN, 'You are not allowed to view guardians');
    }
    const guardians = await user_model_1.default.find({ role: 'guardian', accountType: 'client' })
        .select('_id name email phoneNumber status')
        .sort({ createdAt: -1 })
        .lean();
    if (guardians.length === 0) {
        return { results: [] };
    }
    const guardianIds = guardians.map((item) => item._id);
    const students = await student_model_1.default.find({ guardianIds: { $in: guardianIds } })
        .select('_id firstName middleName lastName regNumber guardianIds')
        .lean();
    const enrollmentByStudentId = await getCurrentEnrollmentByStudentId(students.map((item) => item._id));
    const schoolIds = new Set();
    students.forEach((student) => {
        const enrollment = enrollmentByStudentId.get(student._id);
        if (enrollment === null || enrollment === void 0 ? void 0 : enrollment.school) {
            schoolIds.add(enrollment.school);
        }
    });
    const schools = await school_model_1.default.find({ _id: { $in: Array.from(schoolIds) } }).select('_id name').lean();
    const schoolNameMap = new Map(schools.map((item) => [item._id, item.name]));
    const guardianStudentMap = new Map();
    students.forEach((student) => {
        const enrollment = enrollmentByStudentId.get(student._id);
        if (!isEnrollmentInActorScope(actor, enrollment)) {
            return;
        }
        const fullName = `${student.firstName} ${student.middleName || ''} ${student.lastName}`.replace(/\s+/g, ' ').trim();
        const schoolName = (enrollment === null || enrollment === void 0 ? void 0 : enrollment.school) ? schoolNameMap.get(enrollment.school) || enrollment.school : null;
        (student.guardianIds || []).forEach((guardianId) => {
            const list = guardianStudentMap.get(guardianId) || [];
            list.push({
                id: student._id,
                fullName,
                regNumber: student.regNumber,
                schoolId: (enrollment === null || enrollment === void 0 ? void 0 : enrollment.school) || null,
                schoolName,
            });
            guardianStudentMap.set(guardianId, list);
        });
    });
    const q = (_a = query === null || query === void 0 ? void 0 : query.q) === null || _a === void 0 ? void 0 : _a.trim().toLowerCase();
    const results = guardians
        .map((guardian) => {
        const linkedStudents = guardianStudentMap.get(guardian._id) || [];
        return {
            id: guardian._id,
            name: guardian.name,
            email: guardian.email,
            phoneNumber: guardian.phoneNumber || null,
            status: guardian.status || 'active',
            linkedStudentsCount: linkedStudents.length,
            linkedStudents,
        };
    })
        .filter((item) => {
        if (actor.accountType !== 'internal' && item.linkedStudentsCount === 0) {
            return false;
        }
        if (!q) {
            return true;
        }
        return item.name.toLowerCase().includes(q) || item.email.toLowerCase().includes(q);
    });
    return { results };
};
exports.getGuardians = getGuardians;
const linkStudentsToGuardian = async (payload, actor) => {
    if (!canManageGuardians(actor)) {
        throw new errors_1.ApiError(http_status_1.default.FORBIDDEN, 'You are not allowed to update guardian links');
    }
    const guardian = await getGuardianById(payload.guardianId);
    const studentIds = Array.from(new Set(payload.studentIds.filter(Boolean)));
    if (studentIds.length === 0) {
        throw new errors_1.ApiError(http_status_1.default.BAD_REQUEST, 'studentIds must contain at least one student');
    }
    await ensureActorCanManageStudents(actor, studentIds);
    await student_model_1.default.updateMany({ _id: { $in: studentIds } }, {
        $addToSet: {
            guardianIds: guardian.id,
        },
    });
    return {
        guardianId: guardian.id,
        linkedStudentIds: studentIds,
        linkedStudentsCount: studentIds.length,
    };
};
exports.linkStudentsToGuardian = linkStudentsToGuardian;
const unlinkStudentsFromGuardian = async (payload, actor) => {
    if (!canManageGuardians(actor)) {
        throw new errors_1.ApiError(http_status_1.default.FORBIDDEN, 'You are not allowed to update guardian links');
    }
    const guardian = await getGuardianById(payload.guardianId);
    const studentIds = Array.from(new Set(payload.studentIds.filter(Boolean)));
    if (studentIds.length === 0) {
        throw new errors_1.ApiError(http_status_1.default.BAD_REQUEST, 'studentIds must contain at least one student');
    }
    await ensureActorCanManageStudents(actor, studentIds);
    await student_model_1.default.updateMany({ _id: { $in: studentIds } }, {
        $pull: {
            guardianIds: guardian.id,
        },
    });
    return {
        guardianId: guardian.id,
        unlinkedStudentIds: studentIds,
        unlinkedStudentsCount: studentIds.length,
    };
};
exports.unlinkStudentsFromGuardian = unlinkStudentsFromGuardian;
const getMyStudentsOverview = async (actor) => {
    if (actor.role !== 'guardian') {
        throw new errors_1.ApiError(http_status_1.default.FORBIDDEN, 'Only guardians can access this section');
    }
    const guardianId = actor.id;
    const students = await student_model_1.default.find({ guardianIds: guardianId });
    const studentIds = students.map((item) => item.id);
    if (studentIds.length === 0) {
        return {
            guardian: {
                id: guardianId,
                name: actor.name,
                email: actor.email,
            },
            students: [],
        };
    }
    const currentEnrollmentMap = await (0, studentEnrollment_helpers_1.getCurrentEnrollmentMap)(studentIds);
    const attendanceRows = await attendance_model_1.default.find({ student: { $in: studentIds } }).sort({ date: -1 });
    const resultRows = await result_model_1.default.find({ student: { $in: studentIds } }).sort({ createdAt: -1 });
    const schoolIds = new Set();
    const classIds = new Set();
    const termIds = new Set();
    const sessionIds = new Set();
    students.forEach((student) => {
        const placement = (0, studentEnrollment_helpers_1.getEffectivePlacement)(student, null, currentEnrollmentMap.get(student.id));
        if (placement === null || placement === void 0 ? void 0 : placement.school)
            schoolIds.add(placement.school);
        if (placement === null || placement === void 0 ? void 0 : placement.classId)
            classIds.add(placement.classId);
    });
    resultRows.forEach((item) => {
        if (item.school)
            schoolIds.add(item.school);
        if (item.classId)
            classIds.add(item.classId);
        if (item.termId)
            termIds.add(item.termId);
        if (item.academicSessionId)
            sessionIds.add(item.academicSessionId);
    });
    const [schools, classes, terms, sessions] = await Promise.all([
        school_model_1.default.find({ _id: { $in: Array.from(schoolIds) } }).select('_id name').lean(),
        class_model_1.default.find({ _id: { $in: Array.from(classIds) } }).select('_id code name').lean(),
        term_model_1.default.find({ _id: { $in: Array.from(termIds) } }).select('_id name termName').lean(),
        academicSession_model_1.default.find({ _id: { $in: Array.from(sessionIds) } }).select('_id name startYear endYear').lean(),
    ]);
    const schoolNameMap = new Map(schools.map((item) => [item._id, item.name]));
    const classMap = new Map(classes.map((item) => [item._id, `${item.code} - ${item.name}`]));
    const termMap = new Map(terms.map((item) => [item._id, item.name || item.termName]));
    const sessionMap = new Map(sessions.map((item) => [item._id, item.name || `${item.startYear}/${item.endYear}`]));
    const attendanceByStudent = new Map();
    attendanceRows.forEach((item) => {
        const list = attendanceByStudent.get(item.student) || [];
        list.push(item);
        attendanceByStudent.set(item.student, list);
    });
    const resultsByStudent = new Map();
    resultRows.forEach((item) => {
        const list = resultsByStudent.get(item.student) || [];
        list.push(item);
        resultsByStudent.set(item.student, list);
    });
    const studentOverview = students.map((student) => {
        var _a;
        const placement = (0, studentEnrollment_helpers_1.getEffectivePlacement)(student, null, currentEnrollmentMap.get(student.id));
        const attendance = attendanceByStudent.get(student.id) || [];
        const presentCount = attendance.filter((item) => item.status === 'present' || item.status === 'late').length;
        const absentCount = attendance.filter((item) => item.status === 'absent' || item.status === 'excused').length;
        const totalMarked = presentCount + absentCount;
        const attendanceRate = totalMarked > 0 ? Number(((presentCount / totalMarked) * 100).toFixed(2)) : 0;
        const results = (resultsByStudent.get(student.id) || []).map((item) => ({
            id: item.id,
            subject: item.subject,
            testScore: item.testScore,
            examScore: item.examScore,
            totalScore: item.totalScore,
            termId: item.termId,
            termName: termMap.get(item.termId) || item.termId,
            academicSessionId: item.academicSessionId,
            academicSessionName: sessionMap.get(item.academicSessionId) || item.academicSessionId,
            assessmentDate: item.assessmentDate,
            remark: item.remark,
            classId: item.classId,
            className: classMap.get(item.classId) || item.classId,
            schoolId: item.school,
            schoolName: schoolNameMap.get(item.school) || item.school,
        }));
        const fullName = `${student.firstName} ${student.middleName || ''} ${student.lastName}`.replace(/\s+/g, ' ').trim();
        return {
            id: student.id,
            fullName,
            firstName: student.firstName,
            middleName: student.middleName,
            lastName: student.lastName,
            regNumber: student.regNumber,
            gender: student.gender,
            dateOfBirth: student.dateOfBirth,
            stateOfOrigin: student.stateOfOrigin,
            localGovernment: student.localGovernment,
            status: student.status,
            currentPlacement: placement
                ? {
                    schoolId: placement.school,
                    schoolName: schoolNameMap.get(placement.school) || placement.school,
                    classId: placement.classId,
                    className: classMap.get(placement.classId) || placement.classId,
                    academicSession: placement.academicSession,
                    academicSessionId: placement.academicSessionId,
                }
                : null,
            attendance: {
                totalMarked,
                presentCount,
                absentCount,
                attendanceRate,
                lastMarkedDate: ((_a = attendance[0]) === null || _a === void 0 ? void 0 : _a.date) || null,
            },
            results,
        };
    });
    return {
        guardian: {
            id: guardianId,
            name: actor.name,
            email: actor.email,
        },
        students: studentOverview,
    };
};
exports.getMyStudentsOverview = getMyStudentsOverview;
//# sourceMappingURL=guardian.service.js.map