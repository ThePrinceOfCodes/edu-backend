import { Document, Model } from 'mongoose';

export interface ITerm {
  name: string;
  termName: string;
  academicSession: string;
  schoolBoard: string;
  school?: string | null;
  startDate: Date;
  endDate: Date;
  isActive?: boolean;
}

export interface ITermDoc extends ITerm, Document {}

export interface ITermModel extends Model<ITermDoc> {
  paginate(filter: any, options: any): Promise<any>;
}
