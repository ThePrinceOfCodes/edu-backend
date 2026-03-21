"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
exports.getInternalUsers = exports.restoreUser = exports.disableUser = exports.resetPassword = exports.createInternalUser = void 0;
const http_status_1 = __importDefault(require("http-status"));
const errors_1 = require("../errors");
const user_model_1 = __importDefault(require("./user.model"));
const internal_user_model_1 = __importDefault(require("./internal-user.model"));
const userService = __importStar(require("./user.service"));
const auth_1 = require("../auth");
const activity_logs_1 = require("../activity_logs");
const createInternalUser = async (userBody, actorId) => {
    if (await auth_1.Auth.isEmailTaken(userBody.email)) {
        throw new errors_1.ApiError(http_status_1.default.BAD_REQUEST, 'Email already taken');
    }
    const { role, permissions } = userBody, rest = __rest(userBody, ["role", "permissions"]);
    const userPayload = Object.assign(Object.assign({}, rest), { accountType: 'internal', status: 'active', isVerified: true });
    const user = await userService.createUser(userPayload);
    // Create InternalUser
    await internal_user_model_1.default.create({
        userId: user.id,
        role: role,
        permissions: permissions || []
    });
    // Create credentials
    await auth_1.authService.createAuth({
        user: user.id,
        email: user.email,
        password: userBody.password,
        provider: 'email'
    });
    if (actorId) {
        await activity_logs_1.activityLogService.createActivityLog({
            type: activity_logs_1.activityLogInterfaces.ActivityLogType.USER,
            action: activity_logs_1.activityLogInterfaces.ActivityLogAction.USER_CREATED_INTERNAL,
            description: `Internal user ${user.email} was created`,
            actorId,
            targetId: user.id,
            metadata: {
                module: 'internal_users',
                operation: 'create_internal_user',
                role,
            },
        });
    }
    return user;
};
exports.createInternalUser = createInternalUser;
const resetPassword = async (userId, newPassword, actorId) => {
    const auth = await auth_1.Auth.findOne({ user: userId, provider: 'email' });
    if (!auth) {
        throw new errors_1.ApiError(http_status_1.default.NOT_FOUND, 'User credentials not found');
    }
    auth.password = newPassword;
    await auth.save();
    const user = await user_model_1.default.findById(userId);
    await activity_logs_1.activityLogService.createActivityLog({
        type: activity_logs_1.activityLogInterfaces.ActivityLogType.USER,
        action: activity_logs_1.activityLogInterfaces.ActivityLogAction.USER_PASSWORD_RESET,
        description: `Password was reset for user ${(user === null || user === void 0 ? void 0 : user.email) || userId}`,
        actorId,
        targetId: userId,
        metadata: {
            module: 'internal_users',
            operation: 'reset_password',
        },
    });
    return { success: true };
};
exports.resetPassword = resetPassword;
const disableUser = async (userId, actorId) => {
    const user = await user_model_1.default.findByIdAndUpdate(userId, { status: 'disabled' }, { new: true });
    if (!user)
        throw new errors_1.ApiError(http_status_1.default.NOT_FOUND, 'User not found');
    await activity_logs_1.activityLogService.createActivityLog({
        type: activity_logs_1.activityLogInterfaces.ActivityLogType.USER,
        action: activity_logs_1.activityLogInterfaces.ActivityLogAction.USER_DISABLED,
        description: `User ${user.email} was disabled`,
        actorId,
        targetId: user.id,
        metadata: {
            module: 'internal_users',
            operation: 'disable_user',
        },
    });
    return user;
};
exports.disableUser = disableUser;
const restoreUser = async (userId, actorId) => {
    const user = await user_model_1.default.findByIdAndUpdate(userId, { status: 'active' }, { new: true });
    if (!user)
        throw new errors_1.ApiError(http_status_1.default.NOT_FOUND, 'User not found');
    await activity_logs_1.activityLogService.createActivityLog({
        type: activity_logs_1.activityLogInterfaces.ActivityLogType.USER,
        action: activity_logs_1.activityLogInterfaces.ActivityLogAction.USER_ENABLED,
        description: `User ${user.email} was restored`,
        actorId,
        targetId: user.id,
        metadata: {
            module: 'internal_users',
            operation: 'restore_user',
        },
    });
    return user;
};
exports.restoreUser = restoreUser;
const getInternalUsers = async (filter, options) => {
    const users = await user_model_1.default.paginate(Object.assign(Object.assign({}, filter), { accountType: 'internal' }), options);
    return users;
};
exports.getInternalUsers = getInternalUsers;
//# sourceMappingURL=internal-users.service.js.map