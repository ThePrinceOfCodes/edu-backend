import { Document, Model } from 'mongoose';

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

export interface IAttendance {
  student: string;
  schoolBoard: string;
  school: string;
  academicSessionId: string;
  termId: string;
  date: Date;
  status: AttendanceStatus;
  source?: string;
}

export interface IAttendanceDoc extends IAttendance, Document {}

export interface IAttendanceModel extends Model<IAttendanceDoc> {
  paginate(filter: any, options: any): Promise<any>;
}
