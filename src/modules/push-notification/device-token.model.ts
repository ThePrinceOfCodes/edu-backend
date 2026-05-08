import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { toJSON } from '../toJSON';
import { IDeviceTokenDoc, IDeviceTokenModel } from './push-notification.interfaces';

const deviceTokenSchema = new mongoose.Schema<IDeviceTokenDoc, IDeviceTokenModel>(
  {
    _id: {
      type: String,
      default: uuidv4,
    },
    userId: {
      type: String,
      ref: 'User',
      required: true,
      index: true,
    },
    token: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      index: true,
    },
    platform: {
      type: String,
      trim: true,
      default: null,
    },
    deviceId: {
      type: String,
      trim: true,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    lastSeenAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

deviceTokenSchema.plugin(toJSON);

const DeviceToken = mongoose.model<IDeviceTokenDoc, IDeviceTokenModel>('DeviceToken', deviceTokenSchema);

export default DeviceToken;
