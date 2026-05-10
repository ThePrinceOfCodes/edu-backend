import { Document, Model } from 'mongoose';

export interface IStudentEnrollment {
  student: string;
  schoolBoard?: string | null;
  school: string;
  classId: string;
  academicSession: string;
  academicSessionId?: string | null;
  isCurrent?: boolean;
}

export interface IStudentEnrollmentDoc extends IStudentEnrollment, Document {}

export interface IStudentEnrollmentModel extends Model<IStudentEnrollmentDoc> {
  paginate(filter: any, options: any): Promise<any>;
}