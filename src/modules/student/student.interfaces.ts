import { Document, Model } from 'mongoose';

export type GuardianRelationshipType = 'parent' | 'caretaker';
export type ParentGuardianType = 'father' | 'mother';

export interface IStudentGuardianLink {
  guardianId: string;
  relationshipType: GuardianRelationshipType;
  parentType?: ParentGuardianType | null;
  isPrimary?: boolean;
}

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
  guardianLinks?: IStudentGuardianLink[];
  primaryGuardianId?: string | null;
  status?: 'active' | 'inactive';
}

export interface IStudentDoc extends IStudent, Document {}

export interface IStudentModel extends Model<IStudentDoc> {
  paginate(filter: any, options: any): Promise<any>;
}
