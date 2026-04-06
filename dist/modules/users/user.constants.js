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
        'attendance.read',
        'messages.read',
        'messages.write',
        'messages.broadcast',
        'terms.read',
        'terms.write',
        'academicSessions.read',
        'academicSessions.write',
    ],
    'school-board-admin': [
        'schoolBoards.read',
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
        'attendance.read',
        'messages.read',
        'messages.write',
        'messages.broadcast',
        'terms.read',
        'terms.write',
        'academicSessions.read',
        'academicSessions.write',
    ],
    'school-admin': [
        'schoolBoards.read',
        'schools.read',
        'schools.write',
        'staff.read',
        'staff.write',
        'schoolTypes.read',
        'classes.read',
        'classes.write',
        'students.read',
        'students.write',
        'attendance.read',
        'messages.read',
        'messages.write',
        'terms.read',
        'terms.write',
        'academicSessions.read',
    ],
    teacher: ['staff.read', 'classes.read', 'students.read', 'attendance.read', 'messages.read', 'messages.write'],
    staff: ['staff.read', 'classes.read', 'students.read', 'attendance.read', 'messages.read', 'messages.write'],
};
const getPermissionsForRole = (role) => {
    if (!role) {
        return [];
    }
    return [...exports.ROLE_PERMISSIONS[role]];
};
exports.getPermissionsForRole = getPermissionsForRole;
//# sourceMappingURL=user.constants.js.map