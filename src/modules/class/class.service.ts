import httpStatus from 'http-status';
import { ApiError } from '../errors';
import School from '../school/school.model';
import { SchoolType } from '../school-type';
import Student from '../student/student.model';
import StudentEnrollment from '../student/studentEnrollment.model';
import { IUserDoc } from '../users/user.interfaces';
import ClassModel from './class.model';
import { IClass } from './class.interfaces';

const resolveSchoolScope = async (actor: IUserDoc, schoolId?: string) => {
  let effectiveSchoolId = schoolId;

  if (actor.accountType !== 'internal') {
    if (actor.role === 'school-admin' || actor.role === 'teacher' || actor.role === 'staff') {
      if (!actor.schoolId) {
        throw new ApiError(httpStatus.FORBIDDEN, 'School context is missing for this user');
      }

      if (effectiveSchoolId && effectiveSchoolId !== actor.schoolId) {
        throw new ApiError(httpStatus.FORBIDDEN, 'Cannot access classes for another school');
      }

      effectiveSchoolId = actor.schoolId;
    }

    if (actor.role === 'school-board-admin') {
      if (!actor.schoolBoardId) {
        throw new ApiError(httpStatus.FORBIDDEN, 'School board context is missing for this user');
      }

      if (!effectiveSchoolId) {
        return null;
      }

      const school = await School.findById(effectiveSchoolId);
      if (!school || school.schoolBoard !== actor.schoolBoardId) {
        throw new ApiError(httpStatus.FORBIDDEN, 'School is outside your school board');
      }
    }
  }

  if (!effectiveSchoolId) {
    return null;
  }

  const school = await School.findById(effectiveSchoolId);
  if (!school) {
    throw new ApiError(httpStatus.NOT_FOUND, 'School not found');
  }

  return school.id;
};

export const createClass = async (body: IClass) => {
  const schoolType = await SchoolType.findById(body.schoolTypeId);
  if (!schoolType) {
    throw new ApiError(httpStatus.NOT_FOUND, 'School type not found');
  }

  const exists = await ClassModel.findOne({ code: body.code.toUpperCase(), schoolTypeId: body.schoolTypeId });
  if (exists) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Class code already exists for this school type');
  }

  return ClassModel.create(body);
};

export const queryClasses = async (filter: any, options: any, actor: IUserDoc, schoolId?: string) => {
  const effectiveSchoolId = await resolveSchoolScope(actor, schoolId);

  if (!effectiveSchoolId) {
    return ClassModel.paginate(filter, options);
  }

  // Prefer current enrollment placement to support migrated student data.
  let studentCounts = await StudentEnrollment.aggregate([
    { $match: { school: effectiveSchoolId, isCurrent: true } },
    {
      $lookup: {
        from: 'students',
        localField: 'student',
        foreignField: '_id',
        as: 'studentDoc',
      },
    },
    { $unwind: '$studentDoc' },
    { $match: { 'studentDoc.status': 'active' } },
    { $group: { _id: '$classId', studentCount: { $sum: 1 } } },
  ]);

  // Legacy fallback for old student-level placement fields.
  if (!studentCounts.length) {
    studentCounts = await Student.aggregate([
      { $match: { school: effectiveSchoolId, status: 'active' } },
      { $group: { _id: '$classId', studentCount: { $sum: 1 } } },
    ]);
  }

  if (!studentCounts.length) {
    return {
      results: [],
      page: Number(options.page) || 1,
      limit: Number(options.limit) || 0,
      totalPages: 0,
      totalResults: 0,
    };
  }

  const studentCountByClassId = new Map(studentCounts.map((entry) => [String(entry._id), Number(entry.studentCount) || 0]));
  const scopedFilter = {
    ...filter,
    _id: { $in: [...studentCountByClassId.keys()] },
  };
  const paginated = await ClassModel.paginate(scopedFilter, options);

  return {
    ...paginated,
    results: paginated.results.map((classDoc: any) => ({
      ...classDoc.toJSON(),
      schoolId: effectiveSchoolId,
      studentCount: studentCountByClassId.get(classDoc.id) ?? 0,
    })),
  };
};

export const getClassById = async (classId: string) => {
  const found = await ClassModel.findById(classId);
  if (!found) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Class not found');
  }
  return found;
};

export const updateClassById = async (classId: string, updateBody: Partial<IClass>) => {
  const found = await getClassById(classId);

  if (updateBody.code || updateBody.schoolTypeId) {
    const newCode = (updateBody.code ?? found.code).toUpperCase();
    const newSchoolTypeId = updateBody.schoolTypeId ?? found.schoolTypeId;

    const duplicate = await ClassModel.findOne({
      code: newCode,
      schoolTypeId: newSchoolTypeId,
      _id: { $ne: classId },
    });

    if (duplicate) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Class code already exists for this school type');
    }
  }

  Object.assign(found, updateBody);
  await found.save();

  return found;
};

export const deleteClassById = async (classId: string) => {
  const found = await getClassById(classId);
  await found.deleteOne();
  return found;
};
