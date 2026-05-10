import { Document, Model } from 'mongoose';

export interface IResult {
  student: string;
  schoolBoard: string;
  school: string;
  classId: string;
  termId: string;
  academicSessionId: string;
  subject: string;
  testScore: number;
  examScore: number;
  totalScore: number;
  remark?: string | null;
  assessmentDate?: Date;
  recordedBy: string;
}

export interface IResultDoc extends IResult, Document {}

export interface IResultModel extends Model<IResultDoc> {
  paginate(filter: any, options: any): Promise<any>;
}
