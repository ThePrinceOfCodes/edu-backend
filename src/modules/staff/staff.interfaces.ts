import { Document, Model } from 'mongoose';

export interface IStaff {
  user: string;
  schoolBoard?: string | null;
  school?: string | null;
  employeeId?: string;
  designation?: string;
  employmentType?: 'teacher' | 'staff';
  isActive?: boolean;
}

export interface IStaffDoc extends IStaff, Document {}

export interface IStaffModel extends Model<IStaffDoc> {
  paginate(filter: any, options: any): Promise<any>;
}
