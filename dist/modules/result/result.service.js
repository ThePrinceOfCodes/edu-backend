"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteResultById = exports.updateResultById = exports.getResultById = exports.queryResults = exports.createResultsBulk = exports.createResult = void 0;
const http_status_1 = __importDefault(require("http-status"));
const errors_1 = require("../errors");
const school_model_1 = __importDefault(require("../school/school.model"));
const student_model_1 = __importDefault(require("../student/student.model"));
const studentEnrollment_model_1 = __importDefault(require("../student/studentEnrollment.model"));
const class_model_1 = __importDefault(require("../class/class.model"));
const term_model_1 = __importDefault(require("../term/term.model"));
const academicSession_model_1 = __importDefault(require("../academic-session/academicSession.model"));
const subject_model_1 = __importDefault(require("../subject/subject.model"));
const result_model_1 = __importDefault(require("./result.model"));
const buildAccessFilter = (actor) => {
    if (actor.accountType === 'internal') {
        return {};
    }
    if (actor.role === 'school-board-admin') {
        if (!actor.schoolBoardId) {
            throw new errors_1.ApiError(http_status_1.default.FORBIDDEN, 'School board context is missing for this user');
        }
        return { schoolBoard: actor.schoolBoardId };
    }
    if (actor.role === 'school-admin' || actor.role === 'teacher' || actor.role === 'staff') {
        if (!actor.schoolId) {
            throw new errors_1.ApiError(http_status_1.default.FORBIDDEN, 'School context is missing for this user');
        }
        return { school: actor.schoolId };
    }
    throw new errors_1.ApiError(http_status_1.default.FORBIDDEN, 'You are not allowed to access results');
};
const ensureActorCanWriteToSchool = async (actor, schoolId) => {
    const school = await school_model_1.default.findById(schoolId);
    if (!school) {
        throw new errors_1.ApiError(http_status_1.default.NOT_FOUND, 'School not found');
    }
    if (!school.schoolBoard) {
        throw new errors_1.ApiError(http_status_1.default.BAD_REQUEST, 'School board is missing for this school');
    }
    if (actor.accountType !== 'internal') {
        if (actor.role === 'school-board-admin') {
            if (!actor.schoolBoardId || school.schoolBoard !== actor.schoolBoardId) {
                throw new errors_1.ApiError(http_status_1.default.FORBIDDEN, 'School is outside your school board');
            }
        }
        if (actor.role === 'school-admin' || actor.role === 'teacher' || actor.role === 'staff') {
            if (!actor.schoolId || actor.schoolId !== school.id) {
                throw new errors_1.ApiError(http_status_1.default.FORBIDDEN, 'Cannot create results for another school');
            }
        }
    }
    return school;
};
const ensureResultPlacementValid = async (payload, schoolBoardId) => {
    const [student, classDoc, term, academicSession] = await Promise.all([
        student_model_1.default.findById(payload.student),
        class_model_1.default.findById(payload.classId),
        term_model_1.default.findById(payload.termId),
        academicSession_model_1.default.findById(payload.academicSessionId),
    ]);
    if (!student) {
        throw new errors_1.ApiError(http_status_1.default.NOT_FOUND, 'Student not found');
    }
    if (!classDoc) {
        throw new errors_1.ApiError(http_status_1.default.NOT_FOUND, 'Class not found');
    }
    if (!term) {
        throw new errors_1.ApiError(http_status_1.default.NOT_FOUND, 'Term not found');
    }
    if (!academicSession) {
        throw new errors_1.ApiError(http_status_1.default.NOT_FOUND, 'Academic session not found');
    }
    if (term.schoolBoard !== schoolBoardId) {
        throw new errors_1.ApiError(http_status_1.default.BAD_REQUEST, 'Term does not belong to this school board');
    }
    if (term.school && term.school !== payload.school) {
        throw new errors_1.ApiError(http_status_1.default.BAD_REQUEST, 'Term does not belong to this school');
    }
    if (academicSession.schoolBoard !== schoolBoardId) {
        throw new errors_1.ApiError(http_status_1.default.BAD_REQUEST, 'Academic session does not belong to this school board');
    }
    const sessionLabel = academicSession.name || `${academicSession.startYear}/${academicSession.endYear}`;
    const enrollment = await studentEnrollment_model_1.default.findOne({
        student: payload.student,
        school: payload.school,
        classId: payload.classId,
        $or: [{ academicSessionId: payload.academicSessionId }, { academicSession: sessionLabel }],
    });
    // Note: StudentEnrollment query above is the authoritative placement check
    // student.school/classId fields don't exist on Student model - removed invalid fallback
    if (!enrollment) {
        throw new errors_1.ApiError(http_status_1.default.BAD_REQUEST, 'Student is not enrolled in the selected school/class for the selected academic session');
    }
};
const ensureCanAccessResult = (actor, resultDoc) => {
    if (actor.accountType === 'internal') {
        return;
    }
    if (actor.role === 'school-board-admin') {
        if (!actor.schoolBoardId || resultDoc.schoolBoard !== actor.schoolBoardId) {
            throw new errors_1.ApiError(http_status_1.default.FORBIDDEN, 'Result is outside your school board');
        }
        return;
    }
    if (actor.role === 'school-admin' || actor.role === 'teacher' || actor.role === 'staff') {
        if (!actor.schoolId || resultDoc.school !== actor.schoolId) {
            throw new errors_1.ApiError(http_status_1.default.FORBIDDEN, 'Result is outside your school');
        }
        return;
    }
    throw new errors_1.ApiError(http_status_1.default.FORBIDDEN, 'You are not allowed to access results');
};
const resolveSubjectName = async (subjectValue) => {
    const normalized = subjectValue.trim();
    if (!normalized) {
        throw new errors_1.ApiError(http_status_1.default.BAD_REQUEST, 'Subject is required');
    }
    const normalizedUpper = normalized.toUpperCase();
    const subjectDoc = await subject_model_1.default.findOne({
        $or: [{ name: normalized }, { code: normalizedUpper }],
    });
    if (!subjectDoc) {
        throw new errors_1.ApiError(http_status_1.default.BAD_REQUEST, `Subject not found: ${normalized}`);
    }
    return subjectDoc.name;
};
const createResult = async (payload, actor) => {
    const school = await ensureActorCanWriteToSchool(actor, payload.school);
    await ensureResultPlacementValid(payload, school.schoolBoard || '');
    const normalizedSubject = await resolveSubjectName(payload.subject);
    const totalScore = payload.testScore + payload.examScore;
    return result_model_1.default.create({
        student: payload.student,
        schoolBoard: school.schoolBoard,
        school: school.id,
        classId: payload.classId,
        termId: payload.termId,
        academicSessionId: payload.academicSessionId,
        subject: normalizedSubject,
        testScore: payload.testScore,
        examScore: payload.examScore,
        totalScore,
        remark: payload.remark || null,
        assessmentDate: payload.assessmentDate || new Date(),
        recordedBy: actor.id,
    });
};
exports.createResult = createResult;
const createResultsBulk = async (results, actor) => {
    const created = [];
    const failed = [];
    for (const [index, payload] of results.entries()) {
        try {
            const resultDoc = await (0, exports.createResult)(payload, actor);
            created.push(resultDoc);
        }
        catch (error) {
            failed.push({
                row: index + 1,
                student: payload.student,
                reason: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    }
    return {
        total: results.length,
        createdCount: created.length,
        failedCount: failed.length,
        created,
        failed,
    };
};
exports.createResultsBulk = createResultsBulk;
const queryResults = async (filter, options, actor) => {
    const accessFilter = buildAccessFilter(actor);
    return result_model_1.default.paginate(Object.assign(Object.assign({}, filter), accessFilter), options);
};
exports.queryResults = queryResults;
const getResultById = async (resultId, actor) => {
    const resultDoc = await result_model_1.default.findById(resultId);
    if (!resultDoc) {
        throw new errors_1.ApiError(http_status_1.default.NOT_FOUND, 'Result not found');
    }
    ensureCanAccessResult(actor, resultDoc);
    return resultDoc;
};
exports.getResultById = getResultById;
const updateResultById = async (resultId, payload, actor) => {
    const resultDoc = await (0, exports.getResultById)(resultId, actor);
    if (payload.subject !== undefined) {
        resultDoc.subject = payload.subject.trim();
    }
    if (payload.testScore !== undefined) {
        resultDoc.testScore = payload.testScore;
    }
    if (payload.examScore !== undefined) {
        resultDoc.examScore = payload.examScore;
    }
    if (payload.remark !== undefined) {
        resultDoc.remark = payload.remark || null;
    }
    if (payload.assessmentDate !== undefined) {
        resultDoc.assessmentDate = payload.assessmentDate;
    }
    resultDoc.totalScore = resultDoc.testScore + resultDoc.examScore;
    await resultDoc.save();
    return resultDoc;
};
exports.updateResultById = updateResultById;
const deleteResultById = async (resultId, actor) => {
    const resultDoc = await (0, exports.getResultById)(resultId, actor);
    await resultDoc.deleteOne();
    return resultDoc;
};
exports.deleteResultById = deleteResultById;
//# sourceMappingURL=result.service.js.map