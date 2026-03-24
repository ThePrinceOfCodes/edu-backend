"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPermissionsForRole = exports.ROLE_PERMISSIONS = exports.DEFAULT_CLIENT_USER_ROLE = exports.DEFAULT_INTERNAL_USER_ROLE = exports.USER_ROLES = exports.SCHOOL_USER_ROLES = exports.INTERNAL_USER_ROLES = void 0;
exports.INTERNAL_USER_ROLES = ['super-admin', 'admin'];
exports.SCHOOL_USER_ROLES = ['school-board-admin', 'school-admin', 'teacher', 'staff'];
exports.USER_ROLES = [...exports.INTERNAL_USER_ROLES, ...exports.SCHOOL_USER_ROLES];
exports.DEFAULT_INTERNAL_USER_ROLE = 'admin';
exports.DEFAULT_CLIENT_USER_ROLE = 'staff';
exports.ROLE_PERMISSIONS = {
    'super-admin': ['*'],
    admin: [
        'users.read',
        'users.write',
        'auth.read',
        'auth.write',
        'schoolBoards.read',
        'schoolBoards.write',
        'schools.read',
        'schools.write',
        'staff.read',
        'staff.write',
        'schoolTypes.read',
        'schoolTypes.write',
        'classes.read',
        'classes.write',
        'students.read',
        'students.write',
    ],
    'school-board-admin': [
        'schools.read',
        'schools.write',
        'staff.read',
        'staff.write',
        'schoolTypes.read',
        'schoolTypes.write',
        'classes.read',
        'classes.write',
        'students.read',
        'students.write',
    ],
    'school-admin': [
        'schools.read',
        'schools.write',
        'staff.read',
        'staff.write',
        'schoolTypes.read',
        'classes.read',
        'classes.write',
        'students.read',
        'students.write',
    ],
    teacher: ['staff.read', 'classes.read', 'students.read'],
    staff: ['staff.read', 'classes.read', 'students.read'],
};
const getPermissionsForRole = (role) => {
    if (!role) {
        return [];
    }
    return [...exports.ROLE_PERMISSIONS[role]];
};
exports.getPermissionsForRole = getPermissionsForRole;
//# sourceMappingURL=user.constants.js.map