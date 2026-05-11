import Joi from 'joi';

export const getAttendance = {
  query: Joi.object().keys({
    school: Joi.string().trim().optional(),
    termId: Joi.string().trim().optional(),
    classId: Joi.string().trim().optional(),
    student: Joi.string().trim().optional(),
    status: Joi.string().valid('present', 'absent', 'late', 'excused').optional(),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

export const getAttendanceSummary = {
  query: Joi.object().keys({
    school: Joi.string().trim().optional(),
    termId: Joi.string().trim().optional(),
    classId: Joi.string().trim().optional(),
  }),
};

export const getAttendanceCalendarSummary = {
  query: Joi.object().keys({
    classId: Joi.string().required(),
    schoolId: Joi.string().required(),
    termId: Joi.string().optional(),
    academicSessionId: Joi.string().optional(),
    month: Joi.number().integer().min(1).max(12).required(),
    year: Joi.number().integer().min(2000).max(3000).required(),
  }),
};


