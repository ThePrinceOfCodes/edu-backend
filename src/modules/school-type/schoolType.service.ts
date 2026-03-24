import httpStatus from 'http-status';
import { ApiError } from '../errors';
import SchoolType from './schoolType.model';
import { ISchoolType } from './schoolType.interfaces';

export const createSchoolType = async (body: ISchoolType) => {
  const exists = await SchoolType.findOne({ name: body.name });
  if (exists) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'School type name already exists');
  }

  return SchoolType.create(body);
};

export const querySchoolTypes = async (filter: any, options: any) => {
  return SchoolType.paginate(filter, options);
};

export const getSchoolTypeById = async (schoolTypeId: string) => {
  const schoolType = await SchoolType.findById(schoolTypeId);
  if (!schoolType) {
    throw new ApiError(httpStatus.NOT_FOUND, 'School type not found');
  }
  return schoolType;
};

export const updateSchoolTypeById = async (schoolTypeId: string, updateBody: Partial<ISchoolType>) => {
  const schoolType = await getSchoolTypeById(schoolTypeId);

  if (updateBody.name) {
    const exists = await SchoolType.findOne({ name: updateBody.name, _id: { $ne: schoolTypeId } });
    if (exists) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'School type name already exists');
    }
  }

  Object.assign(schoolType, updateBody);
  await schoolType.save();

  return schoolType;
};

export const deleteSchoolTypeById = async (schoolTypeId: string) => {
  const schoolType = await getSchoolTypeById(schoolTypeId);
  await schoolType.deleteOne();
  return schoolType;
};
