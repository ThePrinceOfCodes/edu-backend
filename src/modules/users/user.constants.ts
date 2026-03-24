export const INTERNAL_USER_ROLES = ['super-admin', 'admin'] as const;

export const SCHOOL_USER_ROLES = ['school-board-admin', 'school-admin', 'teacher', 'staff'] as const;

export const USER_ROLES = [...INTERNAL_USER_ROLES, ...SCHOOL_USER_ROLES] as const;

export type InternalUserRole = (typeof INTERNAL_USER_ROLES)[number];
export type SchoolUserRole = (typeof SCHOOL_USER_ROLES)[number];
export type UserRole = (typeof USER_ROLES)[number];

export const DEFAULT_INTERNAL_USER_ROLE: InternalUserRole = 'admin';
export const DEFAULT_CLIENT_USER_ROLE: SchoolUserRole = 'staff';

export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
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
    'terms.read',
    'terms.write',
    'academicSessions.read',
    'academicSessions.write',
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
    'attendance.read',
    'terms.read',
    'terms.write',
    'academicSessions.read',
    'academicSessions.write',
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
    'attendance.read',
    'terms.read',
    'academicSessions.read',
  ],
  teacher: ['staff.read', 'classes.read', 'students.read', 'attendance.read', 'terms.read'],
  staff: ['staff.read', 'classes.read', 'students.read', 'attendance.read', 'terms.read'],
};

export const getPermissionsForRole = (role?: UserRole | null) => {
  if (!role) {
    return [];
  }

  return [...ROLE_PERMISSIONS[role]];
};