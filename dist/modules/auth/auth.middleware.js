"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireInternalUser = exports.authorize = exports.validateOrganizationAccess = exports.authenticate = void 0;
const http_status_1 = __importDefault(require("http-status"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = __importDefault(require("../../config/config"));
const index_1 = require("../users/index");
const index_2 = require("../errors/index");
const authenticate = async (req, _res, next) => {
    var _a, _b;
    try {
        const token = (_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.split(' ')[1];
        if (!token) {
            throw new index_2.ApiError(http_status_1.default.UNAUTHORIZED, 'Please authenticate');
        }
        const decoded = jsonwebtoken_1.default.verify(token, config_1.default.jwt.secret);
        const user = await index_1.User.findById(decoded.sub);
        if (!user) {
            throw new index_2.ApiError(http_status_1.default.UNAUTHORIZED, 'Please authenticate');
        }
        req.account = user.toJSON();
        req.account.permissions = (_b = user.permissions) !== null && _b !== void 0 ? _b : [];
        req.tokenPayload = decoded;
        next();
    }
    catch (error) {
        next(new index_2.ApiError(http_status_1.default.UNAUTHORIZED, 'Please authenticate'));
    }
};
exports.authenticate = authenticate;
const validateOrganizationAccess = (req, _res, next) => {
    const { organizationId } = req.params;
    const { tokenPayload } = req;
    if (!tokenPayload || !tokenPayload.organizationId) {
        return next(new index_2.ApiError(http_status_1.default.FORBIDDEN, 'Organization context required. Please select an organization first.'));
    }
    if (organizationId && tokenPayload.organizationId !== organizationId) {
        return next(new index_2.ApiError(http_status_1.default.FORBIDDEN, 'Access denied. Token organization does not match request organization.'));
    }
    next();
};
exports.validateOrganizationAccess = validateOrganizationAccess;
const authorize = (...requiredPermissions) => {
    return (req, _res, next) => {
        var _a;
        const account = req.account;
        if (!account) {
            return next(new index_2.ApiError(http_status_1.default.UNAUTHORIZED, 'Please authenticate'));
        }
        if (!requiredPermissions.length) {
            return next();
        }
        const accountPermissions = (_a = account.permissions) !== null && _a !== void 0 ? _a : [];
        const hasWildcard = accountPermissions.includes('*');
        const hasPermission = requiredPermissions.some((permission) => accountPermissions.includes(permission));
        if (!hasWildcard && !hasPermission) {
            return next(new index_2.ApiError(http_status_1.default.FORBIDDEN, 'You do not have permission to perform this action'));
        }
        return next();
    };
};
exports.authorize = authorize;
const requireInternalUser = (req, _res, next) => {
    const account = req.account;
    if (!account) {
        return next(new index_2.ApiError(http_status_1.default.UNAUTHORIZED, 'Please authenticate'));
    }
    if (account.accountType !== 'internal') {
        return next(new index_2.ApiError(http_status_1.default.FORBIDDEN, 'Only internal users can perform this action'));
    }
    return next();
};
exports.requireInternalUser = requireInternalUser;
//# sourceMappingURL=auth.middleware.js.map