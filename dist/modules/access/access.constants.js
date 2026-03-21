"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRolePermissions = exports.PERMISSION_DEFINITIONS = exports.ROLES = exports.PERMISSIONS = void 0;
exports.PERMISSIONS = {
    // Projects
    MANAGE_PROJECTS: 'manage_projects',
    VIEW_PROJECTS: 'view_projects',
    // Access Management
    MANAGE_ACCESS_MANAGEMENT: 'manage_access_management',
    VIEW_ACCESS_MANAGEMENT: 'view_access_management',
    // Finance
    VIEW_FINANCE: 'view_finance',
    MANAGE_FINANCE: 'manage_finance',
    // Teams
    MANAGE_TEAMS: 'manage_teams',
    VIEW_TEAMS: 'view_teams',
    // Generl
    VIEW_DASHBOARD: 'view_dashboard',
    // Paid Time Offs
    MANAGE_PAID_TIME_OFFS: 'manage_paid_time_offs',
    VIEW_PAID_TIME_OFFS: 'view_paid_time_offs',
    CREATE_PAID_TIME_OFF: 'create_paid_time_off',
    // PTO Policies
    MANAGE_PTO_POLICIES: 'manage_pto_policies',
    VIEW_PTO_POLICIES: 'view_pto_policies',
    //Holidays
    MANAGE_HOLIDAYS: 'manage_holidays',
    VIEW_HOLIDAYS: 'view_holidays',
    // Audit
    VIEW_AUDIT_TRAIL: 'view_audit_trail',
};
exports.ROLES = {
    OWNER: 'owner',
    MANAGER: 'manager',
    MEMBER: 'member'
};
exports.PERMISSION_DEFINITIONS = [
    {
        permission: exports.PERMISSIONS.MANAGE_PROJECTS,
        label: 'Manage Projects',
        group: 'projects',
        defaultRoles: [exports.ROLES.OWNER, exports.ROLES.MANAGER]
    },
    {
        permission: exports.PERMISSIONS.MANAGE_ACCESS_MANAGEMENT,
        label: 'Manage Access',
        group: 'access_management',
        defaultRoles: [exports.ROLES.OWNER]
    },
    {
        permission: exports.PERMISSIONS.VIEW_ACCESS_MANAGEMENT,
        label: 'View Access',
        group: 'access_management',
        defaultRoles: [exports.ROLES.OWNER, exports.ROLES.MANAGER]
    },
    {
        permission: exports.PERMISSIONS.VIEW_PROJECTS,
        label: 'View Projects',
        group: 'projects',
        defaultRoles: [exports.ROLES.OWNER, exports.ROLES.MANAGER, exports.ROLES.MEMBER]
    },
    {
        permission: exports.PERMISSIONS.VIEW_DASHBOARD,
        label: 'View Dashboard',
        group: 'general',
        defaultRoles: [exports.ROLES.OWNER, exports.ROLES.MANAGER, exports.ROLES.MEMBER]
    },
    {
        permission: exports.PERMISSIONS.MANAGE_PAID_TIME_OFFS,
        label: 'Manage Paid Time Offs',
        group: 'paid_time_offs',
        defaultRoles: [exports.ROLES.OWNER, exports.ROLES.MANAGER]
    },
    {
        permission: exports.PERMISSIONS.VIEW_PAID_TIME_OFFS,
        label: 'View Paid Time Offs',
        group: 'paid_time_offs',
        defaultRoles: [exports.ROLES.OWNER, exports.ROLES.MANAGER, exports.ROLES.MEMBER]
    },
    {
        permission: exports.PERMISSIONS.CREATE_PAID_TIME_OFF,
        label: 'Create Paid Time Off',
        group: 'paid_time_offs',
        defaultRoles: [exports.ROLES.MEMBER]
    },
    {
        permission: exports.PERMISSIONS.MANAGE_PTO_POLICIES,
        label: 'Manage PTO Policies',
        group: 'pto_policies',
        defaultRoles: [exports.ROLES.OWNER, exports.ROLES.MANAGER]
    },
    {
        permission: exports.PERMISSIONS.VIEW_PTO_POLICIES,
        label: 'View PTO Policies',
        group: 'pto_policies',
        defaultRoles: [exports.ROLES.OWNER, exports.ROLES.MANAGER, exports.ROLES.MEMBER]
    },
    {
        permission: exports.PERMISSIONS.VIEW_HOLIDAYS,
        label: 'View Holidays',
        group: 'holidays',
        defaultRoles: [exports.ROLES.OWNER, exports.ROLES.MANAGER, exports.ROLES.MEMBER]
    },
    {
        permission: exports.PERMISSIONS.MANAGE_HOLIDAYS,
        label: 'Manage Holidays',
        group: 'holidays',
        defaultRoles: [exports.ROLES.OWNER, exports.ROLES.MANAGER]
    },
    {
        permission: exports.PERMISSIONS.VIEW_AUDIT_TRAIL,
        label: 'View Audit Trail',
        group: 'governance',
        defaultRoles: [exports.ROLES.OWNER, exports.ROLES.MANAGER]
    }
];
// Helper to get default permissions for a role
const getRolePermissions = (role) => {
    return exports.PERMISSION_DEFINITIONS
        .filter(def => def.defaultRoles.includes(role))
        .map(def => def.permission);
};
exports.getRolePermissions = getRolePermissions;
//# sourceMappingURL=access.constants.js.map