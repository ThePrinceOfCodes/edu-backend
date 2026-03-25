"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteTermById = exports.updateTermById = exports.getTermById = exports.queryTerms = exports.createTerm = exports.getActiveTermForRequest = exports.getActiveTermForSchool = void 0;
const http_status_1 = __importDefault(require("http-status"));
const errors_1 = require("../errors");
const academic_session_1 = require("../academic-session");
const school_1 = require("../school");
const term_model_1 = __importDefault(require("./term.model"));
const formatDatePart = (value) => {
    return value.toISOString().slice(0, 10);
};
const buildGeneratedTermName = (academicSession, termName, startDate, endDate) => {
    const academicYear = `${academicSession.startYear}/${academicSession.endYear}`;
    const dateRange = `${formatDatePart(startDate)} - ${formatDatePart(endDate)}`;
    return `${academicYear} ${termName} (${dateRange})`;
};
const getNow = () => new Date();
const buildTermAccessFilter = (actor) => {
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
        const schoolId = actor.schoolId;
        return {
            $or: [{ school: schoolId }, { school: null }],
        };
    }
    throw new errors_1.ApiError(http_status_1.default.FORBIDDEN, 'You are not allowed to access terms');
};
const ensureDateRangeValid = (startDate, endDate) => {
    if (endDate < startDate) {
        throw new errors_1.ApiError(http_status_1.default.BAD_REQUEST, 'endDate must be after startDate');
    }
};
const resolveSchoolBoardAndSchool = async (payload, actor) => {
    let schoolBoardId = payload.schoolBoard || null;
    let schoolId = payload.school || null;
    if (actor.accountType !== 'internal') {
        if (actor.role === 'school-admin') {
            if (!actor.schoolId || !actor.schoolBoardId) {
                throw new errors_1.ApiError(http_status_1.default.FORBIDDEN, 'School context is missing for this user');
            }
            if (schoolId && schoolId !== actor.schoolId) {
                throw new errors_1.ApiError(http_status_1.default.FORBIDDEN, 'Cannot create terms outside your school');
            }
            schoolBoardId = actor.schoolBoardId;
            schoolId = actor.schoolId;
        }
        else {
            if (actor.role !== 'school-board-admin' || !actor.schoolBoardId) {
                throw new errors_1.ApiError(http_status_1.default.FORBIDDEN, 'Only school board admin or school admin can create terms');
            }
            if (schoolBoardId && schoolBoardId !== actor.schoolBoardId) {
                throw new errors_1.ApiError(http_status_1.default.FORBIDDEN, 'Cannot create terms outside your school board');
            }
            schoolBoardId = actor.schoolBoardId;
        }
    }
    if (!schoolBoardId) {
        throw new errors_1.ApiError(http_status_1.default.BAD_REQUEST, 'schoolBoard is required');
    }
    if (schoolId) {
        const school = await school_1.School.findById(schoolId);
        if (!school) {
            throw new errors_1.ApiError(http_status_1.default.NOT_FOUND, 'School not found');
        }
        if (school.schoolBoard !== schoolBoardId) {
            throw new errors_1.ApiError(http_status_1.default.BAD_REQUEST, 'School does not belong to the selected school board');
        }
    }
    return { schoolBoardId, schoolId };
};
const ensureAcademicSessionInSchoolBoard = async (academicSessionId, schoolBoardId) => {
    const academicSession = await academic_session_1.AcademicSession.findById(academicSessionId);
    if (!academicSession) {
        throw new errors_1.ApiError(http_status_1.default.NOT_FOUND, 'Academic session not found');
    }
    if (academicSession.schoolBoard !== schoolBoardId) {
        throw new errors_1.ApiError(http_status_1.default.BAD_REQUEST, 'Academic session does not belong to the selected school board');
    }
    return academicSession;
};
const disableActiveTermsInSameScope = async (schoolBoardId, schoolId, currentTermId) => {
    const filter = {
        schoolBoard: schoolBoardId,
        school: schoolId,
        isActive: true,
    };
    if (currentTermId) {
        filter['_id'] = { $ne: currentTermId };
    }
    await term_model_1.default.updateMany(filter, { $set: { isActive: false } });
};
const getActiveTermForSchool = async (schoolId) => {
    const school = await school_1.School.findById(schoolId);
    if (!school) {
        throw new errors_1.ApiError(http_status_1.default.NOT_FOUND, 'School not found');
    }
    const now = getNow();
    const schoolTerm = await term_model_1.default.findOne({
        school: schoolId,
        isActive: true,
        startDate: { $lte: now },
        endDate: { $gte: now },
    }).sort({ startDate: -1 });
    if (schoolTerm) {
        return schoolTerm;
    }
    const boardTerm = await term_model_1.default.findOne({
        schoolBoard: school.schoolBoard,
        school: null,
        isActive: true,
        startDate: { $lte: now },
        endDate: { $gte: now },
    }).sort({ startDate: -1 });
    return boardTerm;
};
exports.getActiveTermForSchool = getActiveTermForSchool;
const getActiveTermForRequest = async (actor, schoolId) => {
    let effectiveSchoolId = schoolId;
    if (actor.accountType !== 'internal') {
        if (actor.role === 'school-admin' || actor.role === 'teacher' || actor.role === 'staff') {
            if (!actor.schoolId) {
                throw new errors_1.ApiError(http_status_1.default.FORBIDDEN, 'School context is missing for this user');
            }
            if (effectiveSchoolId && effectiveSchoolId !== actor.schoolId) {
                throw new errors_1.ApiError(http_status_1.default.FORBIDDEN, 'Cannot access active term for another school');
            }
            effectiveSchoolId = actor.schoolId;
        }
        if (actor.role === 'school-board-admin') {
            if (!actor.schoolBoardId) {
                throw new errors_1.ApiError(http_status_1.default.FORBIDDEN, 'School board context is missing for this user');
            }
            if (!effectiveSchoolId) {
                throw new errors_1.ApiError(http_status_1.default.BAD_REQUEST, 'school is required for school-board-admin');
            }
            const school = await school_1.School.findById(effectiveSchoolId);
            if (!school || school.schoolBoard !== actor.schoolBoardId) {
                throw new errors_1.ApiError(http_status_1.default.FORBIDDEN, 'School is outside your school board');
            }
        }
    }
    if (!effectiveSchoolId) {
        throw new errors_1.ApiError(http_status_1.default.BAD_REQUEST, 'school is required');
    }
    const activeTerm = await (0, exports.getActiveTermForSchool)(effectiveSchoolId);
    if (!activeTerm) {
        throw new errors_1.ApiError(http_status_1.default.NOT_FOUND, 'No active term found for the school');
    }
    return activeTerm;
};
exports.getActiveTermForRequest = getActiveTermForRequest;
const createTerm = async (payload, actor) => {
    const startDate = new Date(payload.startDate);
    const endDate = new Date(payload.endDate);
    ensureDateRangeValid(startDate, endDate);
    const { schoolBoardId, schoolId } = await resolveSchoolBoardAndSchool(payload, actor);
    const academicSession = await ensureAcademicSessionInSchoolBoard(payload.academicSessionId, schoolBoardId);
    const normalizedTermName = payload.termName.trim();
    const generatedName = buildGeneratedTermName(academicSession, normalizedTermName, startDate, endDate);
    const existing = await term_model_1.default.findOne({
        schoolBoard: schoolBoardId,
        school: schoolId,
        academicSessionId: payload.academicSessionId,
        termName: normalizedTermName,
    });
    if (existing) {
        throw new errors_1.ApiError(http_status_1.default.BAD_REQUEST, 'Term already exists for this scope and academic session');
    }
    if (payload.isActive) {
        await disableActiveTermsInSameScope(schoolBoardId, schoolId);
    }
    return term_model_1.default.create({
        name: generatedName,
        termName: normalizedTermName,
        academicSessionId: payload.academicSessionId,
        schoolBoard: schoolBoardId,
        school: schoolId,
        startDate,
        endDate,
        isActive: payload.isActive || false,
    });
};
exports.createTerm = createTerm;
const queryTerms = async (filter, options, actor) => {
    const accessFilter = buildTermAccessFilter(actor);
    return term_model_1.default.paginate(Object.assign(Object.assign({}, filter), accessFilter), options);
};
exports.queryTerms = queryTerms;
const getTermById = async (termId, actor) => {
    const accessFilter = buildTermAccessFilter(actor);
    const found = await term_model_1.default.findOne(Object.assign({ _id: termId }, accessFilter));
    if (!found) {
        throw new errors_1.ApiError(http_status_1.default.NOT_FOUND, 'Term not found');
    }
    return found;
};
exports.getTermById = getTermById;
const updateTermById = async (termId, payload, actor) => {
    const found = await (0, exports.getTermById)(termId, actor);
    if (payload.schoolBoard || payload.academicSessionId) {
        throw new errors_1.ApiError(http_status_1.default.BAD_REQUEST, 'schoolBoard and academicSessionId cannot be updated');
    }
    let schoolId = found.school || null;
    if (payload.school !== undefined) {
        if (actor.accountType !== 'internal' && actor.role !== 'school-board-admin') {
            throw new errors_1.ApiError(http_status_1.default.FORBIDDEN, 'Only school board admin can change term scope');
        }
        schoolId = payload.school || null;
        if (schoolId) {
            const school = await school_1.School.findById(schoolId);
            if (!school) {
                throw new errors_1.ApiError(http_status_1.default.NOT_FOUND, 'School not found');
            }
            if (school.schoolBoard !== found.schoolBoard) {
                throw new errors_1.ApiError(http_status_1.default.BAD_REQUEST, 'School does not belong to the term school board');
            }
        }
    }
    const startDate = payload.startDate ? new Date(payload.startDate) : found.startDate;
    const endDate = payload.endDate ? new Date(payload.endDate) : found.endDate;
    ensureDateRangeValid(startDate, endDate);
    const nextTermName = payload.termName !== undefined ? payload.termName.trim() : found.termName;
    if (!nextTermName) {
        throw new errors_1.ApiError(http_status_1.default.BAD_REQUEST, 'termName is required');
    }
    if (payload.termName !== undefined || payload.startDate !== undefined || payload.endDate !== undefined) {
        const duplicate = await term_model_1.default.findOne({
            _id: { $ne: found.id },
            schoolBoard: found.schoolBoard,
            school: schoolId,
            academicSessionId: found.academicSessionId,
            termName: nextTermName,
        });
        if (duplicate) {
            throw new errors_1.ApiError(http_status_1.default.BAD_REQUEST, 'Term already exists for this scope and academic session');
        }
    }
    const academicSession = await ensureAcademicSessionInSchoolBoard(found.academicSessionId, found.schoolBoard);
    const generatedName = buildGeneratedTermName(academicSession, nextTermName, startDate, endDate);
    if (payload.isActive) {
        await disableActiveTermsInSameScope(found.schoolBoard, schoolId, found.id);
    }
    found.name = generatedName;
    found.termName = nextTermName;
    found.school = schoolId;
    found.startDate = startDate;
    found.endDate = endDate;
    if (payload.isActive !== undefined) {
        found.isActive = payload.isActive;
    }
    await found.save();
    return found;
};
exports.updateTermById = updateTermById;
const deleteTermById = async (termId, actor) => {
    const found = await (0, exports.getTermById)(termId, actor);
    await found.deleteOne();
    return found;
};
exports.deleteTermById = deleteTermById;
//# sourceMappingURL=term.service.js.map