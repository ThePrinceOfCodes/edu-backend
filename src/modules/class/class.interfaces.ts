import { Document, Model } from 'mongoose';

export interface IClass {
  name: string;
  code: string;
  schoolTypeId: string;
}

export interface IClassDoc extends IClass, Document {}

export interface IClassModel extends Model<IClassDoc> {
  paginate(filter: any, options: any): Promise<any>;
}
