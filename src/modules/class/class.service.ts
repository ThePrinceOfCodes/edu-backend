import httpStatus from 'http-status';
import { ApiError } from '../errors';
import { SchoolType } from '../school-type';
import ClassModel from './class.model';
import { IClass } from './class.interfaces';

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

export const queryClasses = async (filter: any, options: any) => {
  return ClassModel.paginate(filter, options);
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
