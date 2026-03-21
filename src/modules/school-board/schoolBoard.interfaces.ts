import { Document, Model } from 'mongoose';

export interface ISchoolBoard {
  name: string;
  description?: string;
  code?: string;
  superAdminUser: string;
  status?: 'active' | 'inactive';
}

export interface ISchoolBoardDoc extends ISchoolBoard, Document {}

export interface ISchoolBoardModel extends Model<ISchoolBoardDoc> {
  paginate(filter: any, options: any): Promise<any>;
}
