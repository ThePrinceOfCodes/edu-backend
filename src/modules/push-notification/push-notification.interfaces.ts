import { Document, Model } from 'mongoose';

export interface IDeviceToken {
  userId: string;
  token: string;
  platform?: string | null;
  deviceId?: string | null;
  isActive: boolean;
  lastSeenAt: Date;
}

export interface IDeviceTokenDoc extends IDeviceToken, Document {}

export interface IDeviceTokenModel extends Model<IDeviceTokenDoc> {}

export interface IFcmTokenPayload {
  fcm_token: string;
  platform?: string | null;
  deviceId?: string | null;
}

export interface IPushNotificationPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
}

export interface IPushSendResult {
  requestedUsers: number;
  tokensAttempted: number;
  successCount: number;
  failureCount: number;
}
