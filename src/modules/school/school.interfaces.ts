import { Document, Model } from 'mongoose';

export interface ISchool {
  name: string;
  schoolBoard?: string | null;
  schoolTypes?: string[];
  classes?: string[];
  adminUser?: string | null;
  adminUsers?: string[];
  address?: string;
  state?: string;
  localGovernment?: string;
  district?: string;
  longitude?: number;
  latitude?: number;
  status?: 'active' | 'inactive';
}

export interface ISchoolDoc extends ISchool, Document {}

export interface ISchoolModel extends Model<ISchoolDoc> {
  paginate(filter: any, options: any): Promise<any>;
}
