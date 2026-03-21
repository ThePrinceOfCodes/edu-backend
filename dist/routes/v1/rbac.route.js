"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const access_middleware_1 = require("@src/modules/access/access.middleware");
const router = express_1.default.Router();
const auth_middleware_1 = require("@src/modules/auth/auth.middleware");
const rbac_1 = require("@src/modules/rbac");
router
    .route('/roles')
    .get(auth_middleware_1.authenticate, (0, access_middleware_1.requirePermission)('view_users'), rbac_1.rbacController.getRoles);
router
    .route('/permissions')
    .get(auth_middleware_1.authenticate, rbac_1.rbacController.getPermissions);
router
    .route('/roles/:role/permissions')
    .post(auth_middleware_1.authenticate, (0, access_middleware_1.requirePermission)('manage_users'), rbac_1.rbacController.toggleRolePermission);
router
    .route('/users/:userId/permissions')
    .get(auth_middleware_1.authenticate, (0, access_middleware_1.requirePermission)('view_users'), rbac_1.rbacController.getUserPermissions);
router
    .route('/users/:userId/overrides')
    .get(auth_middleware_1.authenticate, (0, access_middleware_1.requirePermission)('view_users'), rbac_1.rbacController.getUserOverrides)
    .post(auth_middleware_1.authenticate, (0, access_middleware_1.requirePermission)('manage_users'), rbac_1.rbacController.addUserOverride);
router
    .route('/users/:userId/overrides/:permissionId')
    .delete(auth_middleware_1.authenticate, (0, access_middleware_1.requirePermission)('manage_users'), rbac_1.rbacController.removeUserOverride);
exports.default = router;
//# sourceMappingURL=rbac.route.js.map