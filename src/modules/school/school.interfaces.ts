import { Document, Model } from 'mongoose';

export interface ISchool {
  name: string;
  schoolBoard?: string | null;
  schoolTypes?: string[];
  classes?: string[];
  adminUser?: string | null;
  adminUsers?: string[];
  address?: string;
  schoolCode?: string;
  state?: string;
  localGovernment?: string;
  district?: string;
  ward?: string;
  schoolLocation?: string;
  categoryOfSchool?: string;
  accessRoadCondition?: string;
  typeOfSchool?: string;
  shiftSystem?: string;
  facilitiesAvailable?: string;
  headTeacherName?: string;
  headTeacherPhoneNumber?: string;
  assistantHeadTeacherName?: string;
  assistantHeadTeacherPhoneNumber?: string;
  longitude?: number;
  latitude?: number;
  numberOfClasses?: number;
  numberOfClassroomsAvailable?: number;
  numberOfAcademicStaff?: number;
  numberOfNonAcademicStaff?: number;
  totalEnrolledStudents?: number;
  gallery?: string;
  status?: 'active' | 'inactive';
}

export interface ISchoolDoc extends ISchool, Document {}

export interface ISchoolModel extends Model<ISchoolDoc> {
  paginate(filter: any, options: any): Promise<any>;
}
