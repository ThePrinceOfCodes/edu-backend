import { Document, Model } from 'mongoose';

export interface IAcademicSession {
  name?: string;
  startYear: number;
  endYear: number;
  schoolBoard: string;
  isActive?: boolean;
}

export interface IAcademicSessionDoc extends IAcademicSession, Document {}

export interface IAcademicSessionModel extends Model<IAcademicSessionDoc> {
  paginate(filter: any, options: any): Promise<any>;
}
