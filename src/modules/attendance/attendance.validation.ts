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
