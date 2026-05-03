import Joi from 'joi';

const password = (value: string, helpers: Joi.CustomHelpers) => {
  if (value.length < 8) {
    return helpers.message({ custom: 'password must be at least 8 characters' });
  }
  if (!value.match(/\d/) || !value.match(/[a-zA-Z]/)) {
    return helpers.message({ custom: 'password must contain at least 1 letter and 1 number' });
  }
  return value;
};

export const createSchool = {
  body: Joi.object().keys({
    name: Joi.string().trim().required(),
    schoolBoard: Joi.string().trim().optional().allow(null, ''),
    schoolTypes: Joi.array().items(Joi.string().trim()).min(1).optional(),
    address: Joi.string().trim().optional().allow(null, ''),
    schoolCode: Joi.string().trim().optional().allow(null, ''),
    state: Joi.string().trim().optional().allow(null, ''),
    localGovernment: Joi.string().trim().optional().allow(null, ''),
    district: Joi.string().trim().optional().allow(null, ''),
    ward: Joi.string().trim().optional().allow(null, ''),
    schoolLocation: Joi.string().trim().optional().allow(null, ''),
    categoryOfSchool: Joi.string().trim().optional().allow(null, ''),
    accessRoadCondition: Joi.string().trim().optional().allow(null, ''),
    typeOfSchool: Joi.string().trim().optional().allow(null, ''),
    shiftSystem: Joi.string().trim().optional().allow(null, ''),
    facilitiesAvailable: Joi.string().trim().optional().allow(null, ''),
    headTeacherName: Joi.string().trim().optional().allow(null, ''),
    headTeacherPhoneNumber: Joi.string().trim().optional().allow(null, ''),
    assistantHeadTeacherName: Joi.string().trim().optional().allow(null, ''),
    assistantHeadTeacherPhoneNumber: Joi.string().trim().optional().allow(null, ''),
    longitude: Joi.number().optional(),
    latitude: Joi.number().optional(),
    numberOfClasses: Joi.number().optional(),
    numberOfClassroomsAvailable: Joi.number().optional(),
    numberOfAcademicStaff: Joi.number().optional(),
    numberOfNonAcademicStaff: Joi.number().optional(),
    totalEnrolledStudents: Joi.number().optional(),
    gallery: Joi.string().trim().optional().allow(null, ''),
    status: Joi.string().valid('active', 'inactive').optional(),
    adminUserId: Joi.string().trim().optional(),
    adminUsers: Joi.array().items(Joi.string().trim()).optional(),
    admin: Joi.object()
      .keys({
        name: Joi.string().trim().required(),
        email: Joi.string().trim().email().required(),
        password: Joi.string().required().custom(password),
        phoneNumber: Joi.string().trim().optional().allow(null, ''),
      })
      .optional(),
  }),
};

export const getSchools = {
  query: Joi.object().keys({
    name: Joi.string(),
    schoolBoard: Joi.string(),
    state: Joi.string(),
    localGovernment: Joi.string(),
    district: Joi.string(),
    status: Joi.string().valid('active', 'inactive'),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

export const getSchool = {
  params: Joi.object().keys({
    schoolId: Joi.string().required(),
  }),
};

export const updateSchool = {
  params: Joi.object().keys({
    schoolId: Joi.string().required(),
  }),
  body: Joi.object()
    .keys({
      name: Joi.string().trim(),
      schoolTypes: Joi.array().items(Joi.string().trim()).min(1),
      address: Joi.string().trim().allow(null, ''),
      schoolCode: Joi.string().trim().allow(null, ''),
      state: Joi.string().trim().allow(null, ''),
      localGovernment: Joi.string().trim().allow(null, ''),
      district: Joi.string().trim().allow(null, ''),
      ward: Joi.string().trim().allow(null, ''),
      schoolLocation: Joi.string().trim().allow(null, ''),
      categoryOfSchool: Joi.string().trim().allow(null, ''),
      accessRoadCondition: Joi.string().trim().allow(null, ''),
      typeOfSchool: Joi.string().trim().allow(null, ''),
      shiftSystem: Joi.string().trim().allow(null, ''),
      facilitiesAvailable: Joi.string().trim().allow(null, ''),
      headTeacherName: Joi.string().trim().allow(null, ''),
      headTeacherPhoneNumber: Joi.string().trim().allow(null, ''),
      assistantHeadTeacherName: Joi.string().trim().allow(null, ''),
      assistantHeadTeacherPhoneNumber: Joi.string().trim().allow(null, ''),
      longitude: Joi.number(),
      latitude: Joi.number(),
      numberOfClasses: Joi.number(),
      numberOfClassroomsAvailable: Joi.number(),
      numberOfAcademicStaff: Joi.number(),
      numberOfNonAcademicStaff: Joi.number(),
      totalEnrolledStudents: Joi.number(),
      gallery: Joi.string().trim().allow(null, ''),
      adminUser: Joi.string().trim().allow(null, ''),
      adminUsers: Joi.array().items(Joi.string().trim()),
      status: Joi.string().valid('active', 'inactive'),
    })
    .min(1),
};

export const deleteSchool = {
  params: Joi.object().keys({
    schoolId: Joi.string().required(),
  }),
};

export const bulkImportSchools = {
  body: Joi.object().keys({
    schools: Joi.array()
      .items(
        Joi.object().keys({
          name: Joi.string().trim().required(),
          schoolBoard: Joi.string().trim().optional().allow(null, ''),
          address: Joi.string().trim().optional().allow(null, ''),
          schoolCode: Joi.string().trim().optional().allow(null, ''),
          state: Joi.string().trim().optional().allow(null, ''),
          localGovernment: Joi.string().trim().optional().allow(null, ''),
          district: Joi.string().trim().optional().allow(null, ''),
          ward: Joi.string().trim().optional().allow(null, ''),
          schoolLocation: Joi.string().trim().optional().allow(null, ''),
          categoryOfSchool: Joi.string().trim().optional().allow(null, ''),
          accessRoadCondition: Joi.string().trim().optional().allow(null, ''),
          typeOfSchool: Joi.string().trim().optional().allow(null, ''),
          shiftSystem: Joi.string().trim().optional().allow(null, ''),
          facilitiesAvailable: Joi.string().trim().optional().allow(null, ''),
          headTeacherName: Joi.string().trim().optional().allow(null, ''),
          headTeacherPhoneNumber: Joi.string().trim().optional().allow(null, ''),
          assistantHeadTeacherName: Joi.string().trim().optional().allow(null, ''),
          assistantHeadTeacherPhoneNumber: Joi.string().trim().optional().allow(null, ''),
          longitude: Joi.number().optional().allow(null),
          latitude: Joi.number().optional().allow(null),
          numberOfClasses: Joi.number().optional().allow(null),
          numberOfClassroomsAvailable: Joi.number().optional().allow(null),
          numberOfAcademicStaff: Joi.number().optional().allow(null),
          numberOfNonAcademicStaff: Joi.number().optional().allow(null),
          totalEnrolledStudents: Joi.number().optional().allow(null),
          gallery: Joi.string().trim().optional().allow(null, ''),
          status: Joi.string().valid('active', 'inactive').optional(),
        })
      )
      .min(1)
      .required(),
  }),
};
