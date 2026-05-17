import Joi from 'joi';

export const createStudent = {
  body: Joi.object().keys({
    firstName: Joi.string().trim().required(),
    middleName: Joi.string().trim().optional().allow(null, ''),
    lastName: Joi.string().trim().required(),
    avatar: Joi.string().uri().trim().optional().allow(null, ''),
    regNumber: Joi.string().trim().required(),
    stateOfOrigin: Joi.string().trim().required(),
    localGovernment: Joi.string().trim().required(),
    gender: Joi.string().valid('male', 'female').required(),
    dateOfBirth: Joi.date().required(),
    guardianIds: Joi.array().items(Joi.string().trim()).optional(),
    guardianLinks: Joi.array()
      .items(
        Joi.object().keys({
          guardianId: Joi.string().trim().required(),
          relationshipType: Joi.string().valid('parent', 'caretaker').required(),
          parentType: Joi.when('relationshipType', {
            is: 'parent',
            then: Joi.string().valid('father', 'mother').required(),
            otherwise: Joi.string().valid('father', 'mother').allow(null).optional(),
          }),
          isPrimary: Joi.boolean().optional(),
        })
      )
      .optional(),
    primaryGuardianId: Joi.string().trim().allow(null, '').optional(),
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
          avatar: Joi.string().uri().trim().optional().allow(null, ''),
          regNumber: Joi.string().trim().required(),
          stateOfOrigin: Joi.string().trim().required(),
          localGovernment: Joi.string().trim().required(),
          gender: Joi.string().valid('male', 'female').required(),
          dateOfBirth: Joi.date().required(),
          guardianIds: Joi.array().items(Joi.string().trim()).optional(),
          guardianLinks: Joi.array()
            .items(
              Joi.object().keys({
                guardianId: Joi.string().trim().required(),
                relationshipType: Joi.string().valid('parent', 'caretaker').required(),
                parentType: Joi.when('relationshipType', {
                  is: 'parent',
                  then: Joi.string().valid('father', 'mother').required(),
                  otherwise: Joi.string().valid('father', 'mother').allow(null).optional(),
                }),
                isPrimary: Joi.boolean().optional(),
              })
            )
            .optional(),
          primaryGuardianId: Joi.string().trim().allow(null, '').optional(),
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
    q: Joi.string().trim(),
    firstName: Joi.string(),
    lastName: Joi.string(),
    regNumber: Joi.string(),
    stateOfOrigin: Joi.string(),
    localGovernment: Joi.string(),
    gender: Joi.string().valid('male', 'female'),
    school: Joi.string(),
    classId: Joi.string(),
    academicSession: Joi.string(),
    academicSessionId: Joi.string(),
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
      avatar: Joi.string().uri().trim().allow(null, ''),
      stateOfOrigin: Joi.string().trim(),
      localGovernment: Joi.string().trim(),
      gender: Joi.string().valid('male', 'female'),
      dateOfBirth: Joi.date(),
      guardianIds: Joi.array().items(Joi.string().trim()),
      guardianLinks: Joi.array()
        .items(
          Joi.object().keys({
            guardianId: Joi.string().trim().required(),
            relationshipType: Joi.string().valid('parent', 'caretaker').required(),
            parentType: Joi.when('relationshipType', {
              is: 'parent',
              then: Joi.string().valid('father', 'mother').required(),
              otherwise: Joi.string().valid('father', 'mother').allow(null).optional(),
            }),
            isPrimary: Joi.boolean().optional(),
          })
        )
        .optional(),
      primaryGuardianId: Joi.string().trim().allow(null, ''),
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
