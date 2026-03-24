import { Document, Model } from 'mongoose';

export interface ISchoolType {
  name: string;
}

export interface ISchoolTypeDoc extends ISchoolType, Document {}

export interface ISchoolTypeModel extends Model<ISchoolTypeDoc> {
  paginate(filter: any, options: any): Promise<any>;
}
