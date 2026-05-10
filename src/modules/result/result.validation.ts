import Joi from 'joi';

export const createResult = {
  body: Joi.object().keys({
    student: Joi.string().trim().required(),
    school: Joi.string().trim().required(),
    classId: Joi.string().trim().required(),
    termId: Joi.string().trim().required(),
    academicSessionId: Joi.string().trim().required(),
    subject: Joi.string().trim().required(),
    testScore: Joi.number().min(0).max(100).required(),
    examScore: Joi.number().min(0).max(100).required(),
    remark: Joi.string().trim().allow(null, '').optional(),
    assessmentDate: Joi.date().optional(),
  }),
};

export const getResults = {
  query: Joi.object().keys({
    student: Joi.string().trim(),
    school: Joi.string().trim(),
    classId: Joi.string().trim(),
    termId: Joi.string().trim(),
    academicSessionId: Joi.string().trim(),
    subject: Joi.string().trim(),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

export const getResult = {
  params: Joi.object().keys({
    resultId: Joi.string().required(),
  }),
};

export const updateResult = {
  params: Joi.object().keys({
    resultId: Joi.string().required(),
  }),
  body: Joi.object()
    .keys({
      subject: Joi.string().trim(),
      testScore: Joi.number().min(0).max(100),
      examScore: Joi.number().min(0).max(100),
      remark: Joi.string().trim().allow(null, ''),
      assessmentDate: Joi.date(),
    })
    .min(1),
};

export const deleteResult = {
  params: Joi.object().keys({
    resultId: Joi.string().required(),
  }),
};
