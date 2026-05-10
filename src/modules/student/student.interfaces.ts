import { Document, Model } from 'mongoose';

export interface IStudent {
  firstName: string;
  middleName?: string | null;
  lastName: string;
  regNumber: string;
  stateOfOrigin: string;
  localGovernment: string;
  gender: 'male' | 'female';
  dateOfBirth: Date;
  status?: 'active' | 'inactive';
}

export interface IStudentDoc extends IStudent, Document {}

export interface IStudentModel extends Model<IStudentDoc> {
  paginate(filter: any, options: any): Promise<any>;
}
