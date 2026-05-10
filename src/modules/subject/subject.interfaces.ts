import { Document, Model } from 'mongoose';

export interface ISubject {
  name: string;
  code: string;
}

export interface ISubjectDoc extends ISubject, Document {}

export interface ISubjectModel extends Model<ISubjectDoc> {
  paginate(filter: any, options: any): Promise<any>;
}
