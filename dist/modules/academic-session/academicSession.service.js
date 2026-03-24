"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteAcademicSessionById = exports.updateAcademicSessionById = exports.getAcademicSessionById = exports.queryAcademicSessions = exports.createAcademicSession = void 0;
const http_status_1 = __importDefault(require("http-status"));
const errors_1 = require("../errors");
const school_board_1 = require("../school-board");
const academicSession_model_1 = __importDefault(require("./academicSession.model"));
const buildAcademicSessionAccessFilter = (actor) => {
    if (actor.accountType === 'internal') {
        return {};
    }
    if (actor.role === 'school-board-admin') {
        if (!actor.schoolBoardId) {
            throw new errors_1.ApiError(http_status_1.default.FORBIDDEN, 'School board context is missing for this user');
        }
        return { schoolBoard: actor.schoolBoardId };
    }
    throw new errors_1.ApiError(http_status_1.default.FORBIDDEN, 'Only school board admin can access academic sessions');
};
const resolveSchoolBoardForWrite = (payloadSchoolBoard, actor) => {
    if (actor.accountType === 'internal') {
        if (!payloadSchoolBoard) {
            throw new errors_1.ApiError(http_status_1.default.BAD_REQUEST, 'schoolBoard is required');
        }
        return payloadSchoolBoard;
    }
    if (actor.role === 'school-board-admin' && actor.schoolBoardId) {
        if (payloadSchoolBoard && payloadSchoolBoard !== actor.schoolBoardId) {
            throw new errors_1.ApiError(http_status_1.default.FORBIDDEN, 'Cannot manage sessions outside your school board');
        }
        return actor.schoolBoardId;
    }
    throw new errors_1.ApiError(http_status_1.default.FORBIDDEN, 'Only school board admin can manage academic sessions');
};
const ensureSessionYearsValid = (startYear, endYear) => {
    if (endYear !== startYear + 1) {
        throw new errors_1.ApiError(http_status_1.default.BAD_REQUEST, 'endYear must be startYear + 1');
    }
};
const deactivateOtherSessions = async (schoolBoard, currentId) => {
    const filter = { schoolBoard, isActive: true };
    if (currentId) {
        filter['_id'] = { $ne: currentId };
    }
    await academicSession_model_1.default.updateMany(filter, { $set: { isActive: false } });
};
const createAcademicSession = async (payload, actor) => {
    var _a;
    ensureSessionYearsValid(payload.startYear, payload.endYear);
    const schoolBoardId = resolveSchoolBoardForWrite(payload.schoolBoard, actor);
    const schoolBoard = await school_board_1.SchoolBoard.findById(schoolBoardId);
    if (!schoolBoard) {
        throw new errors_1.ApiError(http_status_1.default.NOT_FOUND, 'School board not found');
    }
    const existing = await academicSession_model_1.default.findOne({
        schoolBoard: schoolBoardId,
        startYear: payload.startYear,
        endYear: payload.endYear,
    });
    if (existing) {
        throw new errors_1.ApiError(http_status_1.default.BAD_REQUEST, 'Academic session already exists for this school board');
    }
    if (payload.isActive) {
        await deactivateOtherSessions(schoolBoardId);
    }
    const name = ((_a = payload.name) === null || _a === void 0 ? void 0 : _a.trim()) || `${payload.startYear}/${payload.endYear}`;
    return academicSession_model_1.default.create({
        name,
        startYear: payload.startYear,
        endYear: payload.endYear,
        schoolBoard: schoolBoardId,
        isActive: payload.isActive || false,
    });
};
exports.createAcademicSession = createAcademicSession;
const queryAcademicSessions = async (filter, options, actor) => {
    const accessFilter = buildAcademicSessionAccessFilter(actor);
    return academicSession_model_1.default.paginate(Object.assign(Object.assign({}, filter), accessFilter), options);
};
exports.queryAcademicSessions = queryAcademicSessions;
const getAcademicSessionById = async (academicSessionId, actor) => {
    const accessFilter = buildAcademicSessionAccessFilter(actor);
    const found = await academicSession_model_1.default.findOne(Object.assign({ _id: academicSessionId }, accessFilter));
    if (!found) {
        throw new errors_1.ApiError(http_status_1.default.NOT_FOUND, 'Academic session not found');
    }
    return found;
};
exports.getAcademicSessionById = getAcademicSessionById;
const updateAcademicSessionById = async (academicSessionId, payload, actor) => {
    var _a, _b;
    const found = await (0, exports.getAcademicSessionById)(academicSessionId, actor);
    const startYear = (_a = payload.startYear) !== null && _a !== void 0 ? _a : found.startYear;
    const endYear = (_b = payload.endYear) !== null && _b !== void 0 ? _b : found.endYear;
    ensureSessionYearsValid(startYear, endYear);
    if (payload.isActive) {
        await deactivateOtherSessions(found.schoolBoard, found.id);
    }
    if (payload.name !== undefined) {
        found.name = payload.name || `${startYear}/${endYear}`;
    }
    found.startYear = startYear;
    found.endYear = endYear;
    if (payload.isActive !== undefined) {
        found.isActive = payload.isActive;
    }
    await found.save();
    return found;
};
exports.updateAcademicSessionById = updateAcademicSessionById;
const deleteAcademicSessionById = async (academicSessionId, actor) => {
    const found = await (0, exports.getAcademicSessionById)(academicSessionId, actor);
    await found.deleteOne();
    return found;
};
exports.deleteAcademicSessionById = deleteAcademicSessionById;
//# sourceMappingURL=academicSession.service.js.map