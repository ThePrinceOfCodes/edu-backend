import { Document, Model } from 'mongoose';

export interface IStaff {
  user: string;
  schoolBoard?: string | null;
  school?: string | null;
  employeeId?: string;
  designation?: string;
  avatar?: string | null;
  gender?: 'M' | 'F' | null;
  academicQualification?: 'NCE' | 'B.Ed' | 'B.Sc' | 'HND' | 'PGDE' | 'SSCE' | null;
  trcnRegistered?: boolean | null;
  salarySource?: '1-FTS' | '2-SUBEB' | '3-Private' | null;
  employmentType?: 'teacher' | 'staff';
  isActive?: boolean;
}

export interface IStaffDoc extends IStaff, Document {}

export interface IStaffModel extends Model<IStaffDoc> {
  paginate(filter: any, options: any): Promise<any>;
}
