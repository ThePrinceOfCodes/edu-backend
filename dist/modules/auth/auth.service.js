"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.changePassword = exports.verifyResetToken = exports.resetPassword = exports.forgotPassword = exports.refreshTokens = exports.generateAuthTokens = exports.generateToken = exports.verifyOtp = exports.loginUserWithEmailAndPassword = exports.registerCompany = exports.createAuth = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const moment_1 = __importDefault(require("moment"));
const http_status_1 = __importDefault(require("http-status"));
const config_1 = __importDefault(require("../../config/config"));
const index_1 = require("../users/index");
const index_2 = require("../errors/index");
const auth_model_1 = __importDefault(require("./auth.model"));
const index_3 = require("../redis/index");
const service_1 = require("../email/service");
const createAuth = async (authBody) => {
    return auth_model_1.default.create(authBody);
};
exports.createAuth = createAuth;
const registerCompany = async (registrationBody) => {
    const { name, workEmail, password } = registrationBody;
    if (await auth_model_1.default.isEmailTaken(workEmail)) {
        throw new index_2.ApiError(http_status_1.default.BAD_REQUEST, 'Email already taken');
    }
    const user = await index_1.userService.createUser({
        name,
        email: workEmail,
    });
    await (0, exports.createAuth)({
        user: user.id,
        email: workEmail,
        password,
        provider: 'email',
    });
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await index_3.redisClient.setex(`otp:${workEmail}`, 900, otp);
    return { user };
};
exports.registerCompany = registerCompany;
const loginUserWithEmailAndPassword = async (email, password) => {
    const auth = await auth_model_1.default.findOne({ email, provider: 'email' });
    if (!auth || !(await auth.isPasswordMatch(password))) {
        throw new index_2.ApiError(http_status_1.default.UNAUTHORIZED, 'Incorrect email or password');
    }
    const user = await index_1.userService.getUserById(auth.user);
    if (!user) {
        throw new index_2.ApiError(http_status_1.default.UNAUTHORIZED, 'User account not found');
    }
    if (user.status === 'disabled') {
        throw new index_2.ApiError(http_status_1.default.FORBIDDEN, 'Your account has been deactivated');
    }
    return user;
};
exports.loginUserWithEmailAndPassword = loginUserWithEmailAndPassword;
const verifyOtp = async (email, otp) => {
    const storedOtp = await index_3.redisClient.get(`otp:${email}`);
    if (!storedOtp) {
        throw new index_2.ApiError(http_status_1.default.BAD_REQUEST, 'OTP expired or broken');
    }
    if (storedOtp !== otp) {
        throw new index_2.ApiError(http_status_1.default.BAD_REQUEST, 'Invalid OTP');
    }
    await index_3.redisClient.del(`otp:${email}`);
    return true;
};
exports.verifyOtp = verifyOtp;
const generateToken = (userId, expires, type, options = {}) => {
    const secret = options.secret || config_1.default.jwt.secret;
    const payload = {
        sub: userId,
        iat: (0, moment_1.default)().unix(),
        exp: expires.unix(),
        type,
    };
    return jsonwebtoken_1.default.sign(payload, secret);
};
exports.generateToken = generateToken;
const generateAuthTokens = async (user, minutes) => {
    const accessTokenExpires = (0, moment_1.default)().add(minutes || config_1.default.jwt.accessExpirationMinutes, 'minutes');
    const accessToken = (0, exports.generateToken)(user.id, accessTokenExpires, 'access');
    const refreshTokenExpires = (0, moment_1.default)().add(config_1.default.jwt.refreshExpirationDays, 'days');
    const refreshToken = (0, exports.generateToken)(user.id, refreshTokenExpires, 'refresh');
    return {
        access: {
            token: accessToken,
            expires: accessTokenExpires.toDate(),
        },
        refresh: {
            token: refreshToken,
            expires: refreshTokenExpires.toDate(),
        },
    };
};
exports.generateAuthTokens = generateAuthTokens;
const refreshTokens = async (token) => {
    const decoded = jsonwebtoken_1.default.verify(token, config_1.default.jwt.secret);
    const user = await index_1.userService.getUserById(decoded.sub);
    if (!user) {
        throw new index_2.ApiError(http_status_1.default.UNAUTHORIZED, 'Failed to refresh token');
    }
    if (decoded.type !== 'refresh') {
        throw new index_2.ApiError(http_status_1.default.UNAUTHORIZED, 'Invalid token type');
    }
    const tokens = await (0, exports.generateAuthTokens)(user);
    return { user, credentials: tokens };
};
exports.refreshTokens = refreshTokens;
const forgotPassword = async (email) => {
    const auth = await auth_model_1.default.findOne({ email, provider: 'email' });
    if (!auth) {
        throw new index_2.ApiError(http_status_1.default.NOT_FOUND, 'No user found with this email');
    }
    const token = (0, exports.generateToken)(auth.user, (0, moment_1.default)().add(2, 'hours'), 'reset');
    const resetTokenKey = `reset_password_token:${token}`;
    await index_3.redisClient.setex(resetTokenKey, 3600 * 2, auth.user);
    await service_1.emailManagementService.sendResetPasswordEmail(email, token);
};
exports.forgotPassword = forgotPassword;
const resetPassword = async (token, newPassword) => {
    const resetTokenKey = `reset_password_token:${token}`;
    const userId = await index_3.redisClient.get(resetTokenKey);
    if (!userId) {
        throw new index_2.ApiError(http_status_1.default.BAD_REQUEST, 'Password reset token is invalid or has expired');
    }
    const auth = await auth_model_1.default.findOne({ user: userId, provider: 'email' });
    if (!auth) {
        throw new index_2.ApiError(http_status_1.default.NOT_FOUND, 'User credentials not found');
    }
    auth.password = newPassword;
    await auth.save();
    await index_3.redisClient.del(resetTokenKey);
};
exports.resetPassword = resetPassword;
const verifyResetToken = async (token) => {
    try {
        const decoded = jsonwebtoken_1.default.verify(token, config_1.default.jwt.secret);
        if (decoded.type !== 'reset') {
            throw new index_2.ApiError(http_status_1.default.BAD_REQUEST, 'Invalid token type');
        }
        const resetTokenKey = `reset_password_token:${token}`;
        const userId = await index_3.redisClient.get(resetTokenKey);
        if (!userId || userId !== decoded.sub) {
            throw new index_2.ApiError(http_status_1.default.BAD_REQUEST, 'Invalid or expired token');
        }
        const user = await index_1.userService.getUserById(userId);
        if (!user) {
            throw new index_2.ApiError(http_status_1.default.NOT_FOUND, 'User not found');
        }
        return { valid: true, user };
    }
    catch (_error) {
        throw new index_2.ApiError(http_status_1.default.UNAUTHORIZED, 'Invalid or expired token');
    }
};
exports.verifyResetToken = verifyResetToken;
const changePassword = async (userId, currentPassword, newPassword) => {
    const auth = await auth_model_1.default.findOne({ user: userId, provider: 'email' });
    if (!auth) {
        throw new index_2.ApiError(http_status_1.default.NOT_FOUND, 'User credentials not found');
    }
    if (!(await auth.isPasswordMatch(currentPassword))) {
        throw new index_2.ApiError(http_status_1.default.BAD_REQUEST, 'Current password is incorrect');
    }
    if (await auth.isPasswordMatch(newPassword)) {
        throw new index_2.ApiError(http_status_1.default.BAD_REQUEST, 'New password must be different from current password');
    }
    auth.password = newPassword;
    await auth.save();
    return auth;
};
exports.changePassword = changePassword;
//# sourceMappingURL=auth.service.js.map