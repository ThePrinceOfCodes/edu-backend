import httpStatus from 'http-status';
import { ApiError } from '../errors';
import Subject from './subject.model';
import { ISubject } from './subject.interfaces';

export const createSubject = async (body: ISubject) => {
  const normalizedName = body.name.trim();
  const normalizedCode = body.code.trim().toUpperCase();

  const [nameExists, codeExists] = await Promise.all([
    Subject.findOne({ name: normalizedName }),
    Subject.findOne({ code: normalizedCode }),
  ]);

  if (nameExists) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Subject name already exists');
  }

  if (codeExists) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Subject code already exists');
  }

  return Subject.create({ name: normalizedName, code: normalizedCode });
};

export const querySubjects = async (filter: any, options: any) => {
  const nextFilter = {
    ...filter,
    ...(filter.code ? { code: String(filter.code).toUpperCase() } : {}),
  };

  const nextOptions = {
    sortBy: options.sortBy || 'name:asc',
    ...options,
  };

  return Subject.paginate(nextFilter, nextOptions);
};

export const getSubjectById = async (subjectId: string) => {
  const subject = await Subject.findById(subjectId);
  if (!subject) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Subject not found');
  }

  return subject;
};

export const updateSubjectById = async (subjectId: string, updateBody: Partial<ISubject>) => {
  const subject = await getSubjectById(subjectId);

  if (updateBody.name) {
    const normalizedName = updateBody.name.trim();
    const nameExists = await Subject.findOne({ name: normalizedName, _id: { $ne: subjectId } });
    if (nameExists) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Subject name already exists');
    }

    subject.name = normalizedName;
  }

  if (updateBody.code) {
    const normalizedCode = updateBody.code.trim().toUpperCase();
    const codeExists = await Subject.findOne({ code: normalizedCode, _id: { $ne: subjectId } });
    if (codeExists) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Subject code already exists');
    }

    subject.code = normalizedCode;
  }

  await subject.save();
  return subject;
};

export const deleteSubjectById = async (subjectId: string) => {
  const subject = await getSubjectById(subjectId);
  await subject.deleteOne();
  return subject;
};
