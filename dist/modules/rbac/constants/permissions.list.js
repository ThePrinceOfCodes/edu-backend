"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.INITIAL_ROLES = exports.PERMISSIONS_LIST = void 0;
exports.PERMISSIONS_LIST = [
    // Existing
    { permission: "manage_data_platforms", label: "Manage Data Platforms", group: "data_platforms", defaultRoles: ["executive", "engineering", "admin", "operations"] },
    { permission: "view_users", label: "View Users", group: "users", defaultRoles: ["admin", "executive", "operations"] },
    { permission: "manage_users", label: "Manage Users", group: "users", defaultRoles: ["admin", "executive", "operations"] },
    // Dashboard
    { permission: "view_dashboard", label: "View Dashboard", group: "dashboard", defaultRoles: ["admin", "executive", "operations", "engineering"] },
    { permission: "manage_dashboard", label: "Manage Dashboard", group: "dashboard", defaultRoles: ["admin", "executive"] },
    // Operations - Projects
    { permission: "view_projects", label: "View Projects", group: "operations", defaultRoles: ["admin", "executive", "operations", "engineering"] },
    { permission: "manage_projects", label: "Manage Projects", group: "operations", defaultRoles: ["admin", "executive", "operations"] },
    // Operations - Organizations
    { permission: "view_organizations", label: "View Organizations", group: "operations", defaultRoles: ["admin", "executive", "operations"] },
    { permission: "manage_organizations", label: "Manage Organizations", group: "operations", defaultRoles: ["admin", "executive"] },
    // Governance - Roles & Permissions
    { permission: "view_roles_and_permissions", label: "View Roles & Permissions", group: "governance", defaultRoles: ["admin", "executive"] },
    { permission: "manage_roles_and_permissions", label: "Manage Roles & Permissions", group: "governance", defaultRoles: ["admin"] },
    // Governance - Audit Trail
    { permission: "view_audit_trail", label: "View Audit Trail", group: "governance", defaultRoles: ["admin", "executive", "operations"] },
    { permission: "manage_audit_trail", label: "Manage Audit Trail", group: "governance", defaultRoles: ["admin"] },
    // Engineering - System Health
    { permission: "view_system_health", label: "View System Health", group: "engineering", defaultRoles: ["admin", "executive", "engineering"] },
    { permission: "manage_system_health", label: "Manage System Health", group: "engineering", defaultRoles: ["admin", "engineering"] },
    // Engineering - Feature Flags
    { permission: "view_feature_flags", label: "View Feature Flags", group: "engineering", defaultRoles: ["admin", "executive", "engineering"] },
    { permission: "manage_feature_flags", label: "Manage Feature Flags", group: "engineering", defaultRoles: ["admin", "engineering"] },
    // Engineering - Change Logs
    { permission: "view_change_logs", label: "View Change Logs", group: "engineering", defaultRoles: ["admin", "executive", "engineering", "operations"] },
    { permission: "manage_change_logs", label: "Manage Change Logs", group: "engineering", defaultRoles: ["admin", "engineering"] },
    // Engineering - API Documentation
    { permission: "view_api_documentation", label: "View API Documentation", group: "engineering", defaultRoles: ["admin", "executive", "engineering"] },
    { permission: "manage_api_documentation", label: "Manage API Documentation", group: "engineering", defaultRoles: ["admin", "engineering"] },
];
exports.INITIAL_ROLES = [
    { name: "admin", description: "Administrator" },
    { name: "executive", description: "Executive" },
    { name: "engineering", description: "Engineering" },
    { name: "operations", description: "Operations" },
];
//# sourceMappingURL=permissions.list.js.map