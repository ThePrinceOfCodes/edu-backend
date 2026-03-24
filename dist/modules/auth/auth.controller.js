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
exports.changePassword = exports.verifyResetToken = exports.resetPassword = exports.forgotPassword = exports.refreshTokens = exports.verifyEmail = exports.login = exports.register = void 0;
const http_status_1 = __importDefault(require("http-status"));
const index_1 = require("../utils/index");
const authService = __importStar(require("./auth.service"));
const users_1 = require("../users");
const errors_1 = require("../errors");
exports.register = (0, index_1.catchAsync)(async (req, res) => {
    await authService.registerCompany(req.body);
    res.status(http_status_1.default.CREATED).send({ message: 'account created successfully' });
});
exports.login = (0, index_1.catchAsync)(async (req, res) => {
    var _a;
    const { email, password } = req.body;
    const user = await authService.loginUserWithEmailAndPassword(email, password);
    const tokens = await authService.generateAuthTokens(user);
    res.send({
        account: user,
        credentials: tokens,
        token: tokens.access.token,
        refreshToken: tokens.refresh.token,
        tokenExpiresAt: tokens.access.expires,
        permissions: (_a = user.permissions) !== null && _a !== void 0 ? _a : [],
    });
});
exports.verifyEmail = (0, index_1.catchAsync)(async (req, res) => {
    const { email, otp } = req.body;
    const isVerified = await authService.verifyOtp(email, otp);
    if (isVerified) {
        const user = await users_1.userService.getUserByEmail(email);
        if (!user) {
            throw new errors_1.ApiError(http_status_1.default.NOT_FOUND, 'User not found');
        }
        const tokens = await authService.generateAuthTokens(user);
        res.status(http_status_1.default.OK).send({ user, credentials: tokens, message: 'Email verified successfully' });
        return;
    }
    res.status(http_status_1.default.OK).send({ message: 'Email verification failed' });
});
exports.refreshTokens = (0, index_1.catchAsync)(async (req, res) => {
    var _a;
    const { user, credentials } = await authService.refreshTokens(req.body.refreshToken);
    res.send({ user, credentials, permissions: (_a = user.permissions) !== null && _a !== void 0 ? _a : [] });
});
exports.forgotPassword = (0, index_1.catchAsync)(async (req, res) => {
    await authService.forgotPassword(req.body.email);
    res.status(http_status_1.default.NO_CONTENT).send();
});
exports.resetPassword = (0, index_1.catchAsync)(async (req, res) => {
    await authService.resetPassword(req.body.token, req.body.password);
    res.status(http_status_1.default.NO_CONTENT).send();
});
exports.verifyResetToken = (0, index_1.catchAsync)(async (req, res) => {
    const result = await authService.verifyResetToken(req.body.token);
    res.send(result);
});
exports.changePassword = (0, index_1.catchAsync)(async (req, res) => {
    const account = req.account;
    if (!(account === null || account === void 0 ? void 0 : account.id)) {
        throw new errors_1.ApiError(http_status_1.default.UNAUTHORIZED, 'Please authenticate');
    }
    await authService.changePassword(account.id, req.body.currentPassword, req.body.newPassword);
    res.status(http_status_1.default.NO_CONTENT).send();
});
//# sourceMappingURL=auth.controller.js.map