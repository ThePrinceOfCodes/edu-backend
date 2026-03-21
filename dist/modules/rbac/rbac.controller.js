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
exports.getUserOverrides = exports.removeUserOverride = exports.addUserOverride = exports.toggleRolePermission = exports.getUserPermissions = exports.getPermissions = exports.getRoles = void 0;
const http_status_1 = __importDefault(require("http-status"));
const index_1 = require("../utils/index");
const rbacService = __importStar(require("./rbac.service"));
exports.getRoles = (0, index_1.catchAsync)(async (_req, res) => {
    const roles = await rbacService.getAllRoles();
    res.send(roles);
});
exports.getPermissions = (0, index_1.catchAsync)(async (_req, res) => {
    const permissions = await rbacService.getAllPermissions();
    res.send(permissions);
});
exports.getUserPermissions = (0, index_1.catchAsync)(async (req, res) => {
    const { userId } = req.params;
    const permissions = await rbacService.getUserEffectivePermissions(userId);
    res.send(permissions);
});
exports.toggleRolePermission = (0, index_1.catchAsync)(async (req, res) => {
    if (!req.account) {
        res.status(http_status_1.default.UNAUTHORIZED).send({ message: 'Authentication required' });
        return;
    }
    const { role } = req.params;
    const { permissionId } = req.body;
    const result = await rbacService.togglePermissionForRole(role, permissionId, req.account.id);
    res.send(result);
});
exports.addUserOverride = (0, index_1.catchAsync)(async (req, res) => {
    if (!req.account) {
        res.status(http_status_1.default.UNAUTHORIZED).send({ message: 'Authentication required' });
        return;
    }
    const { userId } = req.params;
    const { permissionId, accessType } = req.body;
    const result = await rbacService.addUserOverride(userId, permissionId, accessType, req.account.id);
    res.send(result);
});
exports.removeUserOverride = (0, index_1.catchAsync)(async (req, res) => {
    if (!req.account) {
        res.status(http_status_1.default.UNAUTHORIZED).send({ message: 'Authentication required' });
        return;
    }
    const { userId, permissionId } = req.params;
    await rbacService.removeUserOverride(userId, permissionId, req.account.id);
    res.status(http_status_1.default.NO_CONTENT).send();
});
exports.getUserOverrides = (0, index_1.catchAsync)(async (req, res) => {
    const { userId } = req.params;
    const overrides = await rbacService.listUserOverrides(userId);
    res.send(overrides);
});
//# sourceMappingURL=rbac.controller.js.map