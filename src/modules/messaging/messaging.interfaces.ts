import { Document, Model } from 'mongoose';

export interface IMessageThread {
  title?: string | null;
  schoolBoard?: string | null;
  createdBy: string;
  participants: string[];
  isBroadcast?: boolean;
}

export interface IMessageThreadDoc extends IMessageThread, Document {}

export interface IMessageThreadModel extends Model<IMessageThreadDoc> {
  paginate(filter: any, options: any): Promise<any>;
}

export interface IMessage {
  thread: string;
  sender: string;
  content: string;
}

export interface IMessageDoc extends IMessage, Document {}

export interface IMessageModel extends Model<IMessageDoc> {
  paginate(filter: any, options: any): Promise<any>;
}
