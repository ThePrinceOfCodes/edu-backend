import Joi from 'joi';

export const createStudent = {
  body: Joi.object().keys({
    firstName: Joi.string().trim().required(),
    middleName: Joi.string().trim().optional().allow(null, ''),
    lastName: Joi.string().trim().required(),
    regNumber: Joi.string().trim().required(),
    stateOfOrigin: Joi.string().trim().required(),
    localGovernment: Joi.string().trim().required(),
    gender: Joi.string().valid('male', 'female').required(),
    dateOfBirth: Joi.date().required(),
    school: Joi.string().trim().required(),
    classId: Joi.string().trim().required(),
    status: Joi.string().valid('active', 'inactive').optional(),
  }),
};

export const createStudentsBulk = {
  body: Joi.object().keys({
    students: Joi.array()
      .items(
        Joi.object().keys({
          firstName: Joi.string().trim().required(),
          middleName: Joi.string().trim().optional().allow(null, ''),
          lastName: Joi.string().trim().required(),
          regNumber: Joi.string().trim().required(),
          stateOfOrigin: Joi.string().trim().required(),
          localGovernment: Joi.string().trim().required(),
          gender: Joi.string().valid('male', 'female').required(),
          dateOfBirth: Joi.date().required(),
          school: Joi.string().trim().required(),
          classId: Joi.string().trim().required(),
          status: Joi.string().valid('active', 'inactive').optional(),
        })
      )
      .min(1)
      .required(),
  }),
};

export const getStudents = {
  query: Joi.object().keys({
    firstName: Joi.string(),
    lastName: Joi.string(),
    regNumber: Joi.string(),
    stateOfOrigin: Joi.string(),
    localGovernment: Joi.string(),
    gender: Joi.string().valid('male', 'female'),
    school: Joi.string(),
    classId: Joi.string(),
    status: Joi.string().valid('active', 'inactive'),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

export const getStudentById = {
  params: Joi.object().keys({
    studentId: Joi.string().required(),
  }),
};

export const updateStudent = {
  params: Joi.object().keys({
    studentId: Joi.string().required(),
  }),
  body: Joi.object()
    .keys({
      firstName: Joi.string().trim(),
      middleName: Joi.string().trim().allow(null, ''),
      lastName: Joi.string().trim(),
      stateOfOrigin: Joi.string().trim(),
      localGovernment: Joi.string().trim(),
      gender: Joi.string().valid('male', 'female'),
      dateOfBirth: Joi.date(),
      status: Joi.string().valid('active', 'inactive'),
    })
    .min(1),
};

export const promoteStudent = {
  params: Joi.object().keys({
    studentId: Joi.string().required(),
  }),
  body: Joi.object()
    .keys({
      school: Joi.string().trim().optional(),
      classId: Joi.string().trim().required(),
    })
    .required(),
};

export const deleteStudent = {
  params: Joi.object().keys({
    studentId: Joi.string().required(),
  }),
};
