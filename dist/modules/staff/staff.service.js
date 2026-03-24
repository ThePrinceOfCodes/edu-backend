"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteStaffById = exports.updateStaffById = exports.getStaffById = exports.queryStaff = exports.createStaff = void 0;
const http_status_1 = __importDefault(require("http-status"));
const errors_1 = require("../errors");
const users_1 = require("../users");
const auth_1 = require("../auth");
const school_1 = require("../school");
const school_board_1 = require("../school-board");
const staff_model_1 = __importDefault(require("./staff.model"));
const buildStaffAccessFilter = (actor) => {
    if (actor.accountType === 'internal') {
        return {};
    }
    if (actor.role === 'school-board-admin') {
        if (!actor.schoolBoardId) {
            throw new errors_1.ApiError(http_status_1.default.FORBIDDEN, 'School board context is missing for this user');
        }
        return { schoolBoard: actor.schoolBoardId };
    }
    if (actor.role === 'school-admin') {
        if (!actor.schoolId) {
            throw new errors_1.ApiError(http_status_1.default.FORBIDDEN, 'School context is missing for this user');
        }
        return { school: actor.schoolId };
    }
    throw new errors_1.ApiError(http_status_1.default.FORBIDDEN, 'Only school board admin or school admin can access staff records');
};
const resolveSchoolScopeForCreate = async (payload, actor) => {
    if (actor.accountType === 'internal') {
        if (payload.school) {
            const school = await school_1.School.findById(payload.school);
            if (!school) {
                throw new errors_1.ApiError(http_status_1.default.NOT_FOUND, 'School not found');
            }
            return { schoolBoard: school.schoolBoard || null, school: school.id };
        }
        if (!payload.schoolBoard) {
            throw new errors_1.ApiError(http_status_1.default.BAD_REQUEST, 'Either schoolBoard or school is required');
        }
        const schoolBoard = await school_board_1.SchoolBoard.findById(payload.schoolBoard);
        if (!schoolBoard) {
            throw new errors_1.ApiError(http_status_1.default.NOT_FOUND, 'School board not found');
        }
        return { schoolBoard: schoolBoard.id, school: null };
    }
    if (actor.role === 'school-admin') {
        if (!actor.schoolId) {
            throw new errors_1.ApiError(http_status_1.default.FORBIDDEN, 'School context is missing for this user');
        }
        return { schoolBoard: actor.schoolBoardId || null, school: actor.schoolId };
    }
    if (actor.role === 'school-board-admin') {
        if (!actor.schoolBoardId) {
            throw new errors_1.ApiError(http_status_1.default.FORBIDDEN, 'School board context is missing for this user');
        }
        if (payload.school) {
            const school = await school_1.School.findById(payload.school);
            if (!school || school.schoolBoard !== actor.schoolBoardId) {
                throw new errors_1.ApiError(http_status_1.default.FORBIDDEN, 'Cannot manage staff outside your school board');
            }
            return { schoolBoard: actor.schoolBoardId, school: school.id };
        }
        return { schoolBoard: actor.schoolBoardId, school: null };
    }
    throw new errors_1.ApiError(http_status_1.default.FORBIDDEN, 'Invalid role for staff creation');
};
const resolveStaffUser = async (scope, payload) => {
    if (payload.userId && payload.user) {
        throw new errors_1.ApiError(http_status_1.default.BAD_REQUEST, 'Provide either userId or user payload, not both');
    }
    if (payload.userId) {
        const user = await users_1.userService.getUserById(payload.userId);
        if (!user) {
            throw new errors_1.ApiError(http_status_1.default.NOT_FOUND, 'User not found');
        }
        user.schoolBoardId = scope.schoolBoard;
        user.schoolId = scope.school;
        if (payload.employmentType) {
            user.role = payload.employmentType;
        }
        await user.save();
        return user;
    }
    if (!payload.user) {
        throw new errors_1.ApiError(http_status_1.default.BAD_REQUEST, 'Either userId or user payload is required');
    }
    if (await auth_1.Auth.isEmailTaken(payload.user.email)) {
        throw new errors_1.ApiError(http_status_1.default.BAD_REQUEST, 'User email already taken');
    }
    const user = await users_1.userService.createUser(Object.assign({ name: payload.user.name, email: payload.user.email, accountType: 'client', role: payload.user.role || payload.employmentType || 'staff', schoolBoardId: scope.schoolBoard, schoolId: scope.school, isVerified: true }, (payload.user.phoneNumber ? { phoneNumber: payload.user.phoneNumber } : {})));
    await auth_1.authService.createAuth({
        user: user.id,
        email: payload.user.email,
        password: payload.user.password,
        provider: 'email',
    });
    return user;
};
const createStaff = async (staffBody, actor) => {
    const scope = await resolveSchoolScopeForCreate(staffBody, actor);
    const user = await resolveStaffUser(scope, staffBody);
    const existingStaff = await staff_model_1.default.findOne({ user: user.id });
    if (existingStaff) {
        throw new errors_1.ApiError(http_status_1.default.BAD_REQUEST, 'Staff details already exist for this user');
    }
    return staff_model_1.default.create({
        user: user.id,
        schoolBoard: scope.schoolBoard,
        school: scope.school,
        employeeId: staffBody.employeeId,
        designation: staffBody.designation,
        employmentType: staffBody.employmentType || 'staff',
        isActive: staffBody.isActive,
    });
};
exports.createStaff = createStaff;
const queryStaff = async (filter, options, actor) => {
    const accessFilter = buildStaffAccessFilter(actor);
    return staff_model_1.default.paginate(Object.assign(Object.assign({}, filter), accessFilter), options);
};
exports.queryStaff = queryStaff;
const getStaffById = async (staffId, actor) => {
    const accessFilter = buildStaffAccessFilter(actor);
    const staff = await staff_model_1.default.findOne(Object.assign({ _id: staffId }, accessFilter));
    if (!staff) {
        throw new errors_1.ApiError(http_status_1.default.NOT_FOUND, 'Staff record not found');
    }
    return staff;
};
exports.getStaffById = getStaffById;
const updateStaffById = async (staffId, updateBody, actor) => {
    const staff = await (0, exports.getStaffById)(staffId, actor);
    Object.assign(staff, updateBody);
    await staff.save();
    return staff;
};
exports.updateStaffById = updateStaffById;
const deleteStaffById = async (staffId, actor) => {
    const staff = await (0, exports.getStaffById)(staffId, actor);
    await staff.deleteOne();
    await users_1.User.findByIdAndUpdate(staff.user, { $set: { schoolId: null } });
    return staff;
};
exports.deleteStaffById = deleteStaffById;
//# sourceMappingURL=staff.service.js.map