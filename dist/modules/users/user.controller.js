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
exports.changeMyPassword = exports.updateProfile = exports.updateTwoFactor = exports.deleteProfileImage = exports.saveOrEditProfileImage = exports.setupPassword = exports.restoreUser = exports.disableUser = exports.resetUserPassword = exports.getInternalUsers = exports.createInternalUser = exports.getLoggedInUser = exports.createUser = void 0;
const http_status_1 = __importDefault(require("http-status"));
const index_1 = require("../utils/index");
const index_2 = require("../errors/index");
const userService = __importStar(require("./user.service"));
const authService = __importStar(require("../auth/auth.service"));
const internalUsersService = __importStar(require("./internal-users.service"));
const rbac_1 = require("../rbac");
const organizations_1 = require("../organizations");
exports.createUser = (0, index_1.catchAsync)(async (req, res) => {
    const user = await userService.createUser(req.body);
    await authService.createAuth({
        user: user.id,
        email: user.email,
        password: req.body.password,
        provider: 'email'
    });
    res.status(http_status_1.default.CREATED).send(user);
});
exports.getLoggedInUser = (0, index_1.catchAsync)(async (req, res) => {
    if (!req.account)
        throw new index_2.ApiError(http_status_1.default.FORBIDDEN, 'Access denied');
    let organization = null;
    let permissions = [];
    if (req.account.accountType === 'internal') {
        const perms = await rbac_1.rbacService.getUserEffectivePermissions(req.account.id);
        permissions = perms.map((p) => p.permission);
    }
    else {
        const orgMember = await organizations_1.OrganizationMember.findOne({ userId: req.account.id });
        if (orgMember) {
            organization = await organizations_1.Organization.findById(orgMember.organizationId);
        }
    }
    res.send({ account: req.account, user: req.account, organization, permissions });
});
exports.createInternalUser = (0, index_1.catchAsync)(async (req, res) => {
    if (!req.account)
        throw new index_2.ApiError(http_status_1.default.FORBIDDEN, 'Access denied');
    const user = await internalUsersService.createInternalUser(req.body, req.account.id);
    res.status(http_status_1.default.CREATED).send(user);
});
exports.getInternalUsers = (0, index_1.catchAsync)(async (req, res) => {
    const filter = req.query['search'] ? { name: { $regex: req.query['search'], $options: 'i' } } : {};
    const options = {
        sortBy: req.query['sortBy'],
        limit: req.query['limit'],
        page: req.query['page'],
    };
    const result = await internalUsersService.getInternalUsers(filter, options);
    res.send(result);
});
exports.resetUserPassword = (0, index_1.catchAsync)(async (req, res) => {
    if (!req.account)
        throw new index_2.ApiError(http_status_1.default.FORBIDDEN, 'Access denied');
    const { userId } = req.params;
    const { password } = req.body;
    await internalUsersService.resetPassword(userId, password, req.account.id);
    res.status(http_status_1.default.NO_CONTENT).send();
});
exports.disableUser = (0, index_1.catchAsync)(async (req, res) => {
    if (!req.account)
        throw new index_2.ApiError(http_status_1.default.FORBIDDEN, 'Access denied');
    const { userId } = req.params;
    await internalUsersService.disableUser(userId, req.account.id);
    res.status(http_status_1.default.NO_CONTENT).send();
});
exports.restoreUser = (0, index_1.catchAsync)(async (req, res) => {
    if (!req.account)
        throw new index_2.ApiError(http_status_1.default.FORBIDDEN, 'Access denied');
    const { userId } = req.params;
    await internalUsersService.restoreUser(userId, req.account.id);
    res.status(http_status_1.default.NO_CONTENT).send();
});
exports.setupPassword = (0, index_1.catchAsync)(async (req, res) => {
    if (!req.account) {
        throw new index_2.ApiError(http_status_1.default.UNAUTHORIZED, 'Please authenticate');
    }
    const { password } = req.body;
    await authService.setupPassword(req.account.id, password);
    res.status(http_status_1.default.NO_CONTENT).send();
});
exports.saveOrEditProfileImage = (0, index_1.catchAsync)(async (req, res) => {
    if (!req.account) {
        throw new index_2.ApiError(http_status_1.default.UNAUTHORIZED, 'Please authenticate');
    }
    const { image, fileExt } = req.body;
    const user = await userService.saveOrEditProfileImage(req.account.id, image, req.account.id, fileExt);
    res.send({ account: user });
});
exports.deleteProfileImage = (0, index_1.catchAsync)(async (req, res) => {
    if (!req.account) {
        throw new index_2.ApiError(http_status_1.default.UNAUTHORIZED, 'Please authenticate');
    }
    const user = await userService.deleteProfileImage(req.account.id, req.account.id);
    res.send({ account: user });
});
exports.updateTwoFactor = (0, index_1.catchAsync)(async (req, res) => {
    if (!req.account) {
        throw new index_2.ApiError(http_status_1.default.UNAUTHORIZED, 'Please authenticate');
    }
    const user = await userService.updateTwoFactor(req.account.id, req.body.enabled, req.account.id);
    res.send({ account: user });
});
exports.updateProfile = (0, index_1.catchAsync)(async (req, res) => {
    if (!req.account) {
        throw new index_2.ApiError(http_status_1.default.UNAUTHORIZED, 'Please authenticate');
    }
    const user = await userService.updateProfile(req.account.id, req.body, req.account.id);
    res.send({ account: user });
});
exports.changeMyPassword = (0, index_1.catchAsync)(async (req, res) => {
    if (!req.account) {
        throw new index_2.ApiError(http_status_1.default.UNAUTHORIZED, 'Please authenticate');
    }
    const { currentPassword, password } = req.body;
    await authService.changePassword(req.account.id, currentPassword, password);
    res.status(http_status_1.default.NO_CONTENT).send();
});
//# sourceMappingURL=user.controller.js.map