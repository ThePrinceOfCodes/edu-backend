"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.hasPermission = exports.getUserPermissions = exports.resolvePermissions = void 0;
const organizations_1 = require("../organizations");
const access_constants_1 = require("./access.constants");
const user_model_1 = __importDefault(require("../users/user.model"));
const rbac_1 = require("../rbac");
const resolvePermissions = (role, overrides) => {
    const rolePermissions = (0, access_constants_1.getRolePermissions)(role);
    // Union role permissions and added permissions
    const withAdds = new Set([...rolePermissions, ...(overrides.add || [])]);
    // Remove subtracted permissions
    if (overrides.remove) {
        overrides.remove.forEach(p => withAdds.delete(p));
    }
    return Array.from(withAdds);
};
exports.resolvePermissions = resolvePermissions;
const getUserPermissions = async (userId) => {
    const user = await user_model_1.default.findById(userId);
    if (!user)
        return [];
    if (user.accountType === 'internal') {
        const perms = await rbac_1.rbacService.getUserEffectivePermissions(userId);
        return perms.map(p => p.permission);
    }
    const orgMember = await organizations_1.OrganizationMember.findOne({ userId });
    if (!orgMember)
        return [];
    const overrides = orgMember.permissionOverrides || { add: [], remove: [] };
    return (0, exports.resolvePermissions)(orgMember.role, overrides);
};
exports.getUserPermissions = getUserPermissions;
const hasPermission = (userPermissions, requiredPermission) => {
    return userPermissions.includes(requiredPermission);
};
exports.hasPermission = hasPermission;
//# sourceMappingURL=access.service.js.map