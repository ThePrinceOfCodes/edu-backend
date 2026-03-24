import { Document, Model } from 'mongoose';

export interface IStudentHistory {
  fromSchool?: string | null;
  toSchool?: string | null;
  fromClassId?: string | null;
  toClassId: string;
  action: 'created' | 'promoted' | 'transferred';
  changedAt: Date;
}

export interface IStudent {
  firstName: string;
  middleName?: string | null;
  lastName: string;
  regNumber: string;
  stateOfOrigin: string;
  localGovernment: string;
  gender: 'male' | 'female';
  dateOfBirth: Date;
  schoolBoard?: string | null;
  school: string;
  classId: string;
  status?: 'active' | 'inactive';
  promotionHistory?: IStudentHistory[];
}

export interface IStudentDoc extends IStudent, Document {}

export interface IStudentModel extends Model<IStudentDoc> {
  paginate(filter: any, options: any): Promise<any>;
}
