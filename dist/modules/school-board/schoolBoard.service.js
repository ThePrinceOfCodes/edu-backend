"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteSchoolBoardById = exports.updateSchoolBoardById = exports.getSchoolBoardById = exports.querySchoolBoards = exports.createSchoolBoard = void 0;
const http_status_1 = __importDefault(require("http-status"));
const auth_1 = require("../auth");
const users_1 = require("../users");
const auth_2 = require("../auth");
const users_2 = require("../users");
const errors_1 = require("../errors");
const schoolBoard_model_1 = __importDefault(require("./schoolBoard.model"));
const ensureUniqueSchoolBoardFields = async (payload, excludeId) => {
    if (payload.name) {
        const nameExists = await schoolBoard_model_1.default.findOne(Object.assign({ name: payload.name }, (excludeId ? { _id: { $ne: excludeId } } : {})));
        if (nameExists) {
            throw new errors_1.ApiError(http_status_1.default.BAD_REQUEST, 'School board name already exists');
        }
    }
    if (payload.code) {
        const codeExists = await schoolBoard_model_1.default.findOne(Object.assign({ code: payload.code }, (excludeId ? { _id: { $ne: excludeId } } : {})));
        if (codeExists) {
            throw new errors_1.ApiError(http_status_1.default.BAD_REQUEST, 'School board code already exists');
        }
    }
};
const createSchoolBoard = async (schoolBoardBody) => {
    const { superAdmin } = schoolBoardBody, boardData = __rest(schoolBoardBody, ["superAdmin"]);
    const uniqueFieldPayload = { name: boardData.name };
    if (boardData.code) {
        uniqueFieldPayload.code = boardData.code;
    }
    await ensureUniqueSchoolBoardFields(uniqueFieldPayload);
    if (await auth_2.Auth.isEmailTaken(superAdmin.email)) {
        throw new errors_1.ApiError(http_status_1.default.BAD_REQUEST, 'Super admin email already taken');
    }
    const user = await users_1.userService.createUser(Object.assign({ name: superAdmin.name, email: superAdmin.email, accountType: 'client', role: 'school-board-admin', isVerified: true }, (superAdmin.phoneNumber ? { phoneNumber: superAdmin.phoneNumber } : {})));
    await auth_1.authService.createAuth({
        user: user.id,
        email: superAdmin.email,
        password: superAdmin.password,
        provider: 'email',
    });
    const schoolBoard = await schoolBoard_model_1.default.create(Object.assign(Object.assign({}, boardData), { superAdminUser: user.id }));
    user.schoolBoardId = schoolBoard.id;
    await user.save();
    return schoolBoard;
};
exports.createSchoolBoard = createSchoolBoard;
const querySchoolBoards = async (filter, options, actor) => {
    let accessFilter = filter;
    if (actor && actor.accountType === 'client') {
        // School board admins and school admins can only see their own school board
        if (actor.schoolBoardId) {
            accessFilter = Object.assign(Object.assign({}, filter), { _id: actor.schoolBoardId });
        }
    }
    return schoolBoard_model_1.default.paginate(accessFilter, Object.assign(Object.assign({}, options), { populate: 'superAdminUser' }));
};
exports.querySchoolBoards = querySchoolBoards;
const getSchoolBoardById = async (schoolBoardId, actor) => {
    // Check access control for non-internal users
    if (actor && actor.accountType === 'client') {
        if (!actor.schoolBoardId || actor.schoolBoardId !== schoolBoardId) {
            throw new errors_1.ApiError(http_status_1.default.FORBIDDEN, 'You do not have access to this school board');
        }
    }
    return schoolBoard_model_1.default.findById(schoolBoardId).populate('superAdminUser');
};
exports.getSchoolBoardById = getSchoolBoardById;
const updateSchoolBoardById = async (schoolBoardId, updateBody) => {
    const schoolBoard = await (0, exports.getSchoolBoardById)(schoolBoardId);
    if (!schoolBoard) {
        throw new errors_1.ApiError(http_status_1.default.NOT_FOUND, 'School board not found');
    }
    const updateUniqueFieldPayload = {};
    if (updateBody.name) {
        updateUniqueFieldPayload.name = updateBody.name;
    }
    if (updateBody.code) {
        updateUniqueFieldPayload.code = updateBody.code;
    }
    await ensureUniqueSchoolBoardFields(updateUniqueFieldPayload, schoolBoardId);
    Object.assign(schoolBoard, updateBody);
    await schoolBoard.save();
    return schoolBoard;
};
exports.updateSchoolBoardById = updateSchoolBoardById;
const deleteSchoolBoardById = async (schoolBoardId) => {
    const schoolBoard = await (0, exports.getSchoolBoardById)(schoolBoardId);
    if (!schoolBoard) {
        throw new errors_1.ApiError(http_status_1.default.NOT_FOUND, 'School board not found');
    }
    await schoolBoard.deleteOne();
    await users_2.User.updateMany({ schoolBoardId }, { $set: { schoolBoardId: null, schoolId: null } });
    return schoolBoard;
};
exports.deleteSchoolBoardById = deleteSchoolBoardById;
//# sourceMappingURL=schoolBoard.service.js.map