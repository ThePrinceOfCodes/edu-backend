import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { toJSON } from '../toJSON';
import { paginate } from '../paginate';
import { IMessageThreadDoc, IMessageThreadModel } from './messaging.interfaces';

const messagingThreadSchema = new mongoose.Schema<IMessageThreadDoc, IMessageThreadModel>(
  {
    _id: {
      type: String,
      default: uuidv4,
    },
    title: {
      type: String,
      trim: true,
      default: null,
    },
    schoolBoard: {
      type: String,
      ref: 'SchoolBoard',
      default: null,
    },
    createdBy: {
      type: String,
      ref: 'User',
      required: true,
    },
    participants: {
      type: [String],
      ref: 'User',
      default: [],
    },
    isBroadcast: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

messagingThreadSchema.plugin(toJSON);
messagingThreadSchema.plugin(paginate);

const MessageThread = mongoose.model<IMessageThreadDoc, IMessageThreadModel>('MessageThread', messagingThreadSchema);

export default MessageThread;
