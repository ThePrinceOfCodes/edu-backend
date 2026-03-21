"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.togglePermissionForRole = exports.getRolesWithPermissions = exports.getAllPermissions = exports.listUserOverrides = exports.removeUserOverride = exports.addUserOverride = exports.getUserEffectivePermissions = exports.getAllRoles = exports.getRolePermissions = exports.seedRolesAndPermissions = void 0;
const rbac_model_1 = require("./rbac.model");
const user_model_1 = __importDefault(require("../users/user.model"));
const internal_user_model_1 = __importDefault(require("../users/internal-user.model"));
const organization_member_model_1 = __importDefault(require("../organizations/organization_member.model"));
const index_1 = require("../users/index");
const permissions_list_1 = require("./constants/permissions.list");
const access_constants_1 = require("../access/access.constants");
const activity_logs_1 = require("../activity_logs");
const seedRolesAndPermissions = async () => {
    try {
        // 1. Upsert Roles and Remove Stale Roles
        const currentRoleNames = permissions_list_1.INITIAL_ROLES.map(r => r.name);
        for (const roleData of permissions_list_1.INITIAL_ROLES) {
            await rbac_model_1.Role.updateOne({ name: roleData.name }, { $set: roleData }, { upsert: true });
        }
        await rbac_model_1.Role.deleteMany({ name: { $nin: currentRoleNames } });
        // 2. Upsert Permissions and Remove Stale Permissions
        const currentPermissionIds = permissions_list_1.PERMISSIONS_LIST.map(p => p.permission);
        if (permissions_list_1.PERMISSIONS_LIST.length > 0) {
            for (const permData of permissions_list_1.PERMISSIONS_LIST) {
                await rbac_model_1.Permission.updateOne({ permission: permData.permission }, { $set: permData }, { upsert: true });
            }
        }
        await rbac_model_1.Permission.deleteMany({ permission: { $nin: currentPermissionIds } });
        // 3. Sync Role Permissions based on Permission.defaultRoles
        const allPermissions = await rbac_model_1.Permission.find({});
        for (const perm of allPermissions) {
            if (perm.defaultRoles && perm.defaultRoles.length > 0) {
                await rbac_model_1.Role.updateMany({ name: { $in: perm.defaultRoles } }, { $addToSet: { permissions: perm.permission } });
            }
        }
        // 4. Create Executive User if not exists
        const executiveInternal = await internal_user_model_1.default.findOne({ role: 'executive' });
        if (!executiveInternal) {
            const adminEmail = process.env['INITIAL_ADMIN_EMAIL'] || 'manny@regenta.ai';
            const adminPassword = process.env['INITIAL_ADMIN_PASSWORD'] || 'Password123';
            // Check if user with this email exists
            const existingUser = await user_model_1.default.findOne({ email: adminEmail });
            if (!existingUser) {
                await index_1.internalUsersService.createInternalUser({
                    name: 'Emmanuel Ahman',
                    email: adminEmail,
                    password: adminPassword,
                    role: 'executive'
                });
                console.log(`[Seed] Created initial executive user: ${adminEmail}`);
            }
            else {
                // Check if existing user is internal and add role if missing?
                // For now, assume if user exists but no InternalUser doc, we might need to migrate or create it.
                // But the prompt doesn't ask for migration script. I will stick to simple logic: if user doesn't exist, create it.
                if (existingUser.accountType === 'internal') {
                    // Create InternalUser doc if missing
                    await internal_user_model_1.default.create({
                        userId: existingUser.id,
                        role: 'executive'
                    });
                }
            }
        }
        return { success: true, message: 'Roles and Permissions seeded successfully' };
    }
    catch (error) {
        console.error('Seeding failed:', error);
        throw error;
    }
};
exports.seedRolesAndPermissions = seedRolesAndPermissions;
const getRolePermissions = async (roleName) => {
    const role = await rbac_model_1.Role.findOne({ name: roleName });
    if (!role)
        return [];
    return role.permissions || [];
};
exports.getRolePermissions = getRolePermissions;
const getAllRoles = async () => {
    return rbac_model_1.Role.find({});
};
exports.getAllRoles = getAllRoles;
const getUserEffectivePermissions = async (userId, organizationId) => {
    const user = await user_model_1.default.findById(userId);
    if (!user)
        throw new Error('User not found');
    let userRole = null;
    let explicitPermissions = [];
    // Check if user is internal
    if (user.accountType === 'internal') {
        const internalUser = await internal_user_model_1.default.findOne({ userId });
        if (internalUser) {
            userRole = internalUser.role;
            explicitPermissions = internalUser.permissions || [];
        }
    }
    else {
        // Client user
        if (!organizationId) {
            return [];
        }
        const member = await organization_member_model_1.default.findOne({ userId, organizationId });
        if (member) {
            userRole = member.role;
            // For client users, we use static role definitions from access.constants
            // because they are not yet fully migrated to DB-backed roles.
            const staticPermissions = (0, access_constants_1.getRolePermissions)(userRole);
            staticPermissions.forEach(p => explicitPermissions.push(p));
            if (member.permissionOverrides) {
                if (member.permissionOverrides.add) {
                    explicitPermissions.push(...member.permissionOverrides.add);
                }
                // Store removes to apply later
                // We need to handle this differently than internal users logic below
            }
        }
    }
    if (!userRole)
        return [];
    const permissionsSet = new Set();
    if (user.accountType === 'internal') {
        if (userRole) {
            const role = await rbac_model_1.Role.findOne({ name: userRole });
            const rolePermissionIds = (role === null || role === void 0 ? void 0 : role.permissions) || [];
            rolePermissionIds.forEach(p => permissionsSet.add(p));
        }
    }
    // Add explicit/static permissions (handles both internal specific permissions and client static permissions)
    explicitPermissions.forEach(p => permissionsSet.add(p));
    // Handle OrganizationMember removes for client users
    if (user.accountType !== 'internal' && organizationId) {
        const member = await organization_member_model_1.default.findOne({ userId, organizationId });
        if (member && member.permissionOverrides && member.permissionOverrides.remove) {
            member.permissionOverrides.remove.forEach(p => permissionsSet.delete(p));
        }
    }
    // 2. Get UserPermissionOverride (Global & Internal mostly)
    const overrides = await rbac_model_1.UserPermissionOverride.find({ userId });
    // 3. Apply Overrides
    overrides.forEach(override => {
        if (override.accessType === 'ALLOW') {
            permissionsSet.add(override.permissionId);
        }
        else if (override.accessType === 'DENY') {
            permissionsSet.delete(override.permissionId);
        }
    });
    // 4. Return full Permission models
    const finalPermissions = await rbac_model_1.Permission.find({
        permission: { $in: Array.from(permissionsSet) }
    });
    return finalPermissions;
};
exports.getUserEffectivePermissions = getUserEffectivePermissions;
const addUserOverride = async (userId, permissionId, accessType, actorId) => {
    await rbac_model_1.UserPermissionOverride.findOneAndUpdate({ userId, permissionId }, { accessType }, { upsert: true, new: true });
    const accessLabel = accessType === 'ALLOW' ? 'allowed' : 'denied';
    await activity_logs_1.activityLogService.createActivityLog({
        type: activity_logs_1.activityLogInterfaces.ActivityLogType.SYSTEM,
        action: activity_logs_1.activityLogInterfaces.ActivityLogAction.RBAC_OVERRIDE_ADDED,
        description: `Permission override ${permissionId} was ${accessLabel} for user ${userId}`,
        actorId,
        targetId: userId,
        metadata: {
            module: 'rbac',
            operation: 'add_user_override',
            permissionId,
            accessType,
        },
    });
    return { success: true };
};
exports.addUserOverride = addUserOverride;
const removeUserOverride = async (userId, permissionId, actorId) => {
    await rbac_model_1.UserPermissionOverride.deleteOne({ userId, permissionId });
    await activity_logs_1.activityLogService.createActivityLog({
        type: activity_logs_1.activityLogInterfaces.ActivityLogType.SYSTEM,
        action: activity_logs_1.activityLogInterfaces.ActivityLogAction.RBAC_OVERRIDE_REMOVED,
        description: `Permission override ${permissionId} was removed for user ${userId}`,
        actorId,
        targetId: userId,
        metadata: {
            module: 'rbac',
            operation: 'remove_user_override',
            permissionId,
        },
    });
    return { success: true };
};
exports.removeUserOverride = removeUserOverride;
const listUserOverrides = async (userId) => {
    return rbac_model_1.UserPermissionOverride.find({ userId });
};
exports.listUserOverrides = listUserOverrides;
const getAllPermissions = async () => {
    return rbac_model_1.Permission.find({});
};
exports.getAllPermissions = getAllPermissions;
const getRolesWithPermissions = async () => {
    // Populate is not needed if permissions are just strings, but if we want details:
    // We stored permissions as array of Strings (IDs).
    // If we want full permission objects, we might want to "join".
    // But typically the ID is enough or the frontend has the map.
    // Let's return as is.
    return rbac_model_1.Role.find({});
};
exports.getRolesWithPermissions = getRolesWithPermissions;
const togglePermissionForRole = async (roleName, permissionId, actorId) => {
    const permission = await rbac_model_1.Permission.findOne({ permission: permissionId });
    if (!permission)
        throw new Error('Permission not found');
    const role = await rbac_model_1.Role.findOne({ name: roleName });
    if (!role)
        throw new Error('Role not found');
    const isPresent = role.permissions.includes(permissionId);
    let action = '';
    if (isPresent) {
        // Remove
        await rbac_model_1.Role.updateOne({ name: roleName }, { $pull: { permissions: permissionId } });
        // Also update defaultRoles in Permission to reflect this change?
        // The user's logic suggests keeping them in sync.
        await rbac_model_1.Permission.updateOne({ permission: permissionId }, { $pull: { defaultRoles: roleName } });
        action = 'removed';
    }
    else {
        // Add
        await rbac_model_1.Role.updateOne({ name: roleName }, { $addToSet: { permissions: permissionId } });
        // Update Permission
        await rbac_model_1.Permission.updateOne({ permission: permissionId }, { $addToSet: { defaultRoles: roleName } });
        action = 'added';
    }
    await activity_logs_1.activityLogService.createActivityLog({
        type: activity_logs_1.activityLogInterfaces.ActivityLogType.SYSTEM,
        action: activity_logs_1.activityLogInterfaces.ActivityLogAction.RBAC_ROLE_PERMISSION_TOGGLED,
        description: `Permission ${permissionId} was ${action} for role ${roleName}`,
        actorId,
        targetId: roleName,
        metadata: {
            module: 'rbac',
            operation: 'toggle_role_permission',
            permissionId,
            roleName,
            action,
        },
    });
    return { success: true, action };
};
exports.togglePermissionForRole = togglePermissionForRole;
//# sourceMappingURL=rbac.service.js.map