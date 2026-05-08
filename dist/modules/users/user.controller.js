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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUserById = exports.deactivateUserById = exports.updateUserById = exports.getUserById = exports.getUsers = exports.createInternalUser = void 0;
const http_status_1 = __importDefault(require("http-status"));
const utils_1 = require("../utils");
const userService = __importStar(require("./user.service"));
const auth_1 = require("../auth");
const user_constants_1 = require("./user.constants");
exports.createInternalUser = (0, utils_1.catchAsync)(async (req, res) => {
    const { name, email, password, phoneNumber, role, permissions } = req.body;
    const resolvedRole = user_constants_1.INTERNAL_USER_ROLES.includes(role) ? role : 'admin';
    const resolvedPermissions = Array.isArray(permissions) && permissions.length ? permissions : (0, user_constants_1.getPermissionsForRole)(resolvedRole);
    const user = await userService.createUser(Object.assign({ name,
        email, accountType: 'internal', role: resolvedRole, permissions: resolvedPermissions, isVerified: true, status: 'active' }, (phoneNumber ? { phoneNumber } : {})));
    await auth_1.authService.createAuth({
        user: user.id,
        email,
        password,
        provider: 'email',
    });
    res.status(http_status_1.default.CREATED).send(user);
});
exports.getUsers = (0, utils_1.catchAsync)(async (req, res) => {
    const filter = (0, utils_1.pick)(req.query, ['name', 'email', 'role', 'status', 'accountType']);
    const options = (0, utils_1.pick)(req.query, ['sortBy', 'limit', 'page']);
    const result = await userService.queryUsers(filter, options);
    res.send(result);
});
exports.getUserById = (0, utils_1.catchAsync)(async (req, res) => {
    const user = await userService.getUserById(req.params['userId']);
    if (!user) {
        res.status(http_status_1.default.NOT_FOUND).send({ message: 'User not found' });
        return;
    }
    res.send(user);
});
exports.updateUserById = (0, utils_1.catchAsync)(async (req, res) => {
    const { name, email, phoneNumber, role, permissions, status } = req.body;
    const updateBody = (0, utils_1.pick)({ name, email, phoneNumber, role, permissions, status }, [
        'name',
        'email',
        'phoneNumber',
        'role',
        'permissions',
        'status',
    ]);
    if (updateBody.role && (!Array.isArray(updateBody.permissions) || updateBody.permissions.length === 0)) {
        updateBody.permissions = (0, user_constants_1.getPermissionsForRole)(updateBody.role);
    }
    const user = await userService.updateUserById(req.params['userId'], updateBody);
    res.send(user);
});
exports.deactivateUserById = (0, utils_1.catchAsync)(async (req, res) => {
    const user = await userService.deactivateUserById(req.params['userId']);
    res.send(user);
});
exports.deleteUserById = (0, utils_1.catchAsync)(async (req, res) => {
    const user = await userService.softDeleteUserById(req.params['userId']);
    res.send(user);
});
//# sourceMappingURL=user.controller.js.map