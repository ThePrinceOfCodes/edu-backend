import { GoogleAuth } from 'google-auth-library';
import { request as gaxiosRequest } from 'gaxios';
import config from '../../config/config';
import { logger } from '../logger';
import { School } from '../school';
import { User } from '../users';
import { IAttendantExtractionDoc } from '../attendant-extraction/attendant-extraction.interfaces';
import DeviceToken from './device-token.model';
import { IFcmTokenPayload, IPushNotificationPayload, IPushSendResult } from './push-notification.interfaces';

const FCM_SCOPE = 'https://www.googleapis.com/auth/firebase.messaging';

class PushNotificationService {
  private auth = new GoogleAuth({ scopes: [FCM_SCOPE] });

  private getExtractionId(extraction: IAttendantExtractionDoc) {
    return String((extraction as any).id || (extraction as any)._id || '');
  }

  public async registerToken(userId: string, payload: IFcmTokenPayload) {
    return DeviceToken.findOneAndUpdate(
      { token: payload.fcm_token },
      {
        $set: {
          userId,
          token: payload.fcm_token,
          platform: payload.platform || null,
          deviceId: payload.deviceId || null,
          isActive: true,
          lastSeenAt: new Date(),
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }

  public async unregisterToken(userId: string, token: string) {
    await DeviceToken.updateMany(
      { userId, token },
      {
        $set: {
          isActive: false,
        },
      }
    );
  }

  public async sendToUser(userId: string, payload: IPushNotificationPayload) {
    return this.sendToUsers([userId], payload);
  }

  public async sendToUsers(userIds: string[], payload: IPushNotificationPayload): Promise<IPushSendResult> {
    const uniqueUserIds = [...new Set(userIds.filter(Boolean))];

    if (!config.pushNotifications.enabled || !config.pushNotifications.projectId || uniqueUserIds.length === 0) {
      return {
        requestedUsers: uniqueUserIds.length,
        tokensAttempted: 0,
        successCount: 0,
        failureCount: 0,
      };
    }

    const deviceTokens = await DeviceToken.find({
      userId: { $in: uniqueUserIds },
      isActive: true,
    });

    const tokensByValue = new Map<string, any>();
    for (const deviceToken of deviceTokens as any[]) {
      tokensByValue.set(deviceToken.token, deviceToken);
    }
    const uniqueDeviceTokens = [...tokensByValue.values()] as any[];

    if (!uniqueDeviceTokens.length) {
      return {
        requestedUsers: uniqueUserIds.length,
        tokensAttempted: 0,
        successCount: 0,
        failureCount: 0,
      };
    }

    const accessToken = await this.getAccessToken();
    if (!accessToken) {
      logger.warn('Push notifications skipped because no Google access token could be resolved');
      return {
        requestedUsers: uniqueUserIds.length,
        tokensAttempted: uniqueDeviceTokens.length,
        successCount: 0,
        failureCount: uniqueDeviceTokens.length,
      };
    }

    let successCount = 0;
    let failureCount = 0;

    for (const deviceToken of uniqueDeviceTokens) {
      try {
        await gaxiosRequest({
          method: 'POST',
          url: `https://fcm.googleapis.com/v1/projects/${config.pushNotifications.projectId}/messages:send`,
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          data: {
            message: {
              token: deviceToken.token,
              notification: {
                title: payload.title,
                body: payload.body,
              },
              data: payload.data || {},
            },
          },
        });
        successCount += 1;
      } catch (error: any) {
        failureCount += 1;
        logger.error(`Push notification send failed: ${error?.message || error}`);

        if (this.shouldDeactivateToken(error)) {
          await DeviceToken.updateOne({ _id: deviceToken.id }, { $set: { isActive: false } });
        }
      }
    }

    return {
      requestedUsers: uniqueUserIds.length,
      tokensAttempted: uniqueDeviceTokens.length,
      successCount,
      failureCount,
    };
  }

  public async sendAttendanceReviewAlert(extraction: IAttendantExtractionDoc) {
    const school = await School.findById(extraction.schoolId);
    if (!school) {
      logger.warn(`Push notification skipped because school ${extraction.schoolId} was not found`);
      return;
    }

    const configuredAdminIds = (school.adminUsers || []).filter(Boolean);
    const fallbackAdminIds = school.adminUser ? [school.adminUser] : [];
    const schoolAdminIds = configuredAdminIds.length ? configuredAdminIds : fallbackAdminIds;

    const schoolAdmins = schoolAdminIds.length
      ? await User.find({ _id: { $in: schoolAdminIds }, role: 'school-admin', status: 'active' })
      : [];

    const recipientIds = [
      ...new Set([
        ...schoolAdmins.map((user: any) => user.id),
        ...(extraction.createdBy ? [extraction.createdBy] : []),
      ]),
    ];

    if (!recipientIds.length) {
      logger.warn(`Push notification skipped because no recipients were resolved for extraction ${this.getExtractionId(extraction)}`);
      return;
    }

    await this.sendToUsers(recipientIds, {
      title: 'Attendance review required',
      body: 'A new attendance extraction needs review.',
      data: {
        type: 'attendance_review',
        extractionId: this.getExtractionId(extraction),
        schoolId: extraction.schoolId,
        actorUserId: extraction.createdBy || '',
        startDate: extraction.startDate.toISOString(),
        endDate: extraction.endDate.toISOString(),
      },
    });
  }

  private async getAccessToken() {
    try {
      const client = await this.auth.getClient();
      const accessToken = await client.getAccessToken();

      if (!accessToken) {
        return null;
      }

      return typeof accessToken === 'string' ? accessToken : accessToken.token;
    } catch (error) {
      logger.error(`Failed to obtain Google access token for push notifications: ${error}`);
      return null;
    }
  }

  private shouldDeactivateToken(error: any) {
    const errorCode = error?.response?.data?.error?.details?.[0]?.errorCode;
    const errorStatus = error?.response?.data?.error?.status;
    const errorMessage = String(error?.response?.data?.error?.message || error?.message || '').toLowerCase();

    return (
      errorCode === 'UNREGISTERED' ||
      errorStatus === 'NOT_FOUND' ||
      errorMessage.includes('registration token is not a valid fcm registration token') ||
      errorMessage.includes('invalid registration token')
    );
  }
}

export const pushNotificationService = new PushNotificationService();
