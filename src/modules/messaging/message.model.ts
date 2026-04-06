import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { toJSON } from '../toJSON';
import { paginate } from '../paginate';
import { IMessageDoc, IMessageModel } from './messaging.interfaces';

const messageSchema = new mongoose.Schema<IMessageDoc, IMessageModel>(
  {
    _id: {
      type: String,
      default: uuidv4,
    },
    thread: {
      type: String,
      ref: 'MessageThread',
      required: true,
    },
    sender: {
      type: String,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      trim: true,
      required: true,
    },
    attachments: {
      type: [
        {
          name: { type: String, required: true },
          url: { type: String, required: true },
          type: { type: String, default: null },
          size: { type: Number, default: null },
        },
      ],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

messageSchema.plugin(toJSON);
messageSchema.plugin(paginate);

const MessageModel = mongoose.model<IMessageDoc, IMessageModel>('Message', messageSchema);

export default MessageModel;
