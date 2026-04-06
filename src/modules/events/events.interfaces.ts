import { Document, Model } from 'mongoose';

export interface IEvent {
  title: string;
  description?: string | null;
  startDate: Date;
  endDate?: Date | null;
  allDay?: boolean;
  schoolBoard?: string | null;
  school?: string | null;
  color?: string | null;
  createdBy: string;
}

export interface IEventDoc extends IEvent, Document {}

export interface IEventModel extends Model<IEventDoc> {
  paginate(filter: any, options: any): Promise<any>;
}
