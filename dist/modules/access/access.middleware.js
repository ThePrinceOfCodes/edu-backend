"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requirePermission = void 0;
const http_status_1 = __importDefault(require("http-status"));
const errors_1 = require("../errors");
const access_service_1 = require("./access.service");
const requirePermission = (permission) => {
    return async (req, _res, next) => {
        try {
            if (!req.account) {
                return next(new errors_1.ApiError(http_status_1.default.UNAUTHORIZED, 'Not authenticated'));
            }
            // Optimize: check if permissions already attached to request
            // For now, fetch
            const permissions = req.account.permissions;
            if (!(0, access_service_1.hasPermission)(permissions, permission)) {
                return next(new errors_1.ApiError(http_status_1.default.FORBIDDEN, `Missing permission: ${permission}`));
            }
            // Attach permissions to request for downstream use
            req.permissions = permissions;
            next();
        }
        catch (error) {
            next(error);
        }
    };
};
exports.requirePermission = requirePermission;
//# sourceMappingURL=access.middleware.js.map