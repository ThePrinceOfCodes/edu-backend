"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.findStudentIdsForPlacement = exports.upsertStudentEnrollment = exports.resolveActiveAcademicSessionForSchoolBoard = exports.getEffectivePlacement = exports.getAcademicSessionEnrollmentMap = exports.getCurrentEnrollmentMap = exports.getLegacyPlacement = void 0;
const http_status_1 = __importDefault(require("http-status"));
const errors_1 = require("../errors");
const academicSession_model_1 = __importDefault(require("../academic-session/academicSession.model"));
const student_model_1 = __importDefault(require("./student.model"));
const studentEnrollment_model_1 = __importDefault(require("./studentEnrollment.model"));
const getLegacyPlacement = (student) => {
    if (!(student === null || student === void 0 ? void 0 : student.school) || !(student === null || student === void 0 ? void 0 : student.classId)) {
        return null;
    }
    return {
        schoolBoard: student.schoolBoard || null,
        school: student.school,
        classId: student.classId,
        academicSession: null,
        academicSessionId: null,
        isCurrent: true,
    };
};
exports.getLegacyPlacement = getLegacyPlacement;
const getCurrentEnrollmentMap = async (studentIds) => {
    if (studentIds.length === 0) {
        return new Map();
    }
    const enrollments = await studentEnrollment_model_1.default.find({
        student: { $in: studentIds },
        isCurrent: true,
    });
    return new Map(enrollments.map((item) => [item.student, item]));
};
exports.getCurrentEnrollmentMap = getCurrentEnrollmentMap;
const getAcademicSessionEnrollmentMap = async (studentIds, academicSession, academicSessionId) => {
    if ((!academicSession && !academicSessionId) || studentIds.length === 0) {
        return new Map();
    }
    const enrollmentFilter = {
        student: { $in: studentIds },
    };
    if (academicSessionId) {
        enrollmentFilter['academicSessionId'] = academicSessionId;
    }
    else if (academicSession) {
        enrollmentFilter['academicSession'] = academicSession;
    }
    const enrollments = await studentEnrollment_model_1.default.find(enrollmentFilter);
    return new Map(enrollments.map((item) => [item.student, item]));
};
exports.getAcademicSessionEnrollmentMap = getAcademicSessionEnrollmentMap;
const getEffectivePlacement = (student, sessionPlacement, currentPlacement) => {
    if (sessionPlacement) {
        return {
            schoolBoard: sessionPlacement.schoolBoard || null,
            school: sessionPlacement.school,
            classId: sessionPlacement.classId,
            academicSession: sessionPlacement.academicSession,
            academicSessionId: sessionPlacement.academicSessionId || null,
            isCurrent: sessionPlacement.isCurrent,
        };
    }
    if (currentPlacement) {
        return {
            schoolBoard: currentPlacement.schoolBoard || null,
            school: currentPlacement.school,
            classId: currentPlacement.classId,
            academicSession: currentPlacement.academicSession,
            academicSessionId: currentPlacement.academicSessionId || null,
            isCurrent: currentPlacement.isCurrent,
        };
    }
    return (0, exports.getLegacyPlacement)(student);
};
exports.getEffectivePlacement = getEffectivePlacement;
const resolveActiveAcademicSessionForSchoolBoard = async (schoolBoardId) => {
    if (!schoolBoardId) {
        throw new errors_1.ApiError(http_status_1.default.BAD_REQUEST, 'School does not belong to a school board');
    }
    const session = await academicSession_model_1.default.findOne({ schoolBoard: schoolBoardId, isActive: true }).sort({
        startYear: -1,
    });
    if (!session) {
        throw new errors_1.ApiError(http_status_1.default.BAD_REQUEST, 'No active academic session found for this school board');
    }
    return {
        id: session.id,
        name: session.name || `${session.startYear}/${session.endYear}`,
    };
};
exports.resolveActiveAcademicSessionForSchoolBoard = resolveActiveAcademicSessionForSchoolBoard;
const upsertStudentEnrollment = async (payload) => {
    const session = await (0, exports.resolveActiveAcademicSessionForSchoolBoard)(payload.schoolBoardId);
    await studentEnrollment_model_1.default.updateMany({ student: payload.studentId, isCurrent: true, academicSession: { $ne: session.name } }, { $set: { isCurrent: false } });
    const enrollment = await studentEnrollment_model_1.default.findOneAndUpdate({
        student: payload.studentId,
        academicSession: session.name,
    }, {
        student: payload.studentId,
        schoolBoard: payload.schoolBoardId || null,
        school: payload.schoolId,
        classId: payload.classId,
        academicSession: session.name,
        academicSessionId: session.id,
        isCurrent: true,
    }, {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
    });
    await studentEnrollment_model_1.default.updateMany({
        student: payload.studentId,
        _id: { $ne: enrollment.id },
        isCurrent: true,
    }, { $set: { isCurrent: false } });
    return enrollment;
};
exports.upsertStudentEnrollment = upsertStudentEnrollment;
const findStudentIdsForPlacement = async (payload) => {
    const enrollmentFilter = {
        school: payload.schoolId,
    };
    if (payload.classId) {
        enrollmentFilter['classId'] = payload.classId;
    }
    if (payload.academicSession) {
        enrollmentFilter['academicSession'] = payload.academicSession;
    }
    else {
        enrollmentFilter['isCurrent'] = true;
    }
    const enrollments = await studentEnrollment_model_1.default.find(enrollmentFilter).select('student');
    const studentIds = new Set();
    enrollments.forEach((item) => studentIds.add(item.student));
    // Legacy fallback: only use old student-level placement fields when no enrollment rows exist.
    // This avoids mixing old and new placement sources, which can skew attendance summaries.
    if (studentIds.size === 0) {
        const legacyStudents = await student_model_1.default.find(Object.assign({ school: payload.schoolId }, (payload.classId ? { classId: payload.classId } : {}))).select('_id');
        legacyStudents.forEach((item) => studentIds.add(item.id));
    }
    return Array.from(studentIds);
};
exports.findStudentIdsForPlacement = findStudentIdsForPlacement;
//# sourceMappingURL=studentEnrollment.helpers.js.map