import { Document, Model } from 'mongoose';

export interface ISchool {
  name: string;
  schoolBoard?: string | null;
  adminUser?: string | null;
  address?: string;
  status?: 'active' | 'inactive';
}

export interface ISchoolDoc extends ISchool, Document {}

export interface ISchoolModel extends Model<ISchoolDoc> {
  paginate(filter: any, options: any): Promise<any>;
}
