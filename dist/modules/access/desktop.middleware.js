"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireDesktopSource = void 0;
const http_status_1 = __importDefault(require("http-status"));
const index_1 = require("../errors/index");
const requireDesktopSource = (req, _res, next) => {
    // Check for a specific header, e.g., 'x-app-source'.
    // You can also check for a specific User-Agent or even verify a shared secret or a signed token if available.
    // For now, let's look for a simple header 'x-app-source' === 'desktop-app'.
    const source = req.headers['x-app-source'];
    if (source !== 'desktop-app') {
        return next(new index_1.ApiError(http_status_1.default.FORBIDDEN, 'Access denied: Desktop app only'));
    }
    next();
};
exports.requireDesktopSource = requireDesktopSource;
//# sourceMappingURL=desktop.middleware.js.map