import { Document, Model } from 'mongoose';

export interface IStudent {
  firstName: string;
  middleName?: string | null;
  lastName: string;
  avatar?: string | null;
  regNumber: string;
  stateOfOrigin: string;
  localGovernment: string;
  gender: 'male' | 'female';
  dateOfBirth: Date;
  guardianIds?: string[];
  status?: 'active' | 'inactive';
}

export interface IStudentDoc extends IStudent, Document {}

export interface IStudentModel extends Model<IStudentDoc> {
  paginate(filter: any, options: any): Promise<any>;
}
