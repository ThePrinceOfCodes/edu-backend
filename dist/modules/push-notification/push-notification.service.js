"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pushNotificationService = void 0;
const google_auth_library_1 = require("google-auth-library");
const gaxios_1 = require("gaxios");
const config_1 = __importDefault(require("../../config/config"));
const logger_1 = require("../logger");
const school_1 = require("../school");
const users_1 = require("../users");
const device_token_model_1 = __importDefault(require("./device-token.model"));
const FCM_SCOPE = 'https://www.googleapis.com/auth/firebase.messaging';
class PushNotificationService {
    constructor() {
        this.auth = new google_auth_library_1.GoogleAuth({ scopes: [FCM_SCOPE] });
    }
    getExtractionId(extraction) {
        return String(extraction.id || extraction._id || '');
    }
    async registerToken(userId, payload) {
        return device_token_model_1.default.findOneAndUpdate({ token: payload.fcm_token }, {
            $set: {
                userId,
                token: payload.fcm_token,
                platform: payload.platform || null,
                deviceId: payload.deviceId || null,
                isActive: true,
                lastSeenAt: new Date(),
            },
        }, { upsert: true, new: true, setDefaultsOnInsert: true });
    }
    async unregisterToken(userId, token) {
        await device_token_model_1.default.updateMany({ userId, token }, {
            $set: {
                isActive: false,
            },
        });
    }
    async sendToUser(userId, payload) {
        return this.sendToUsers([userId], payload);
    }
    async sendToUsers(userIds, payload) {
        const uniqueUserIds = [...new Set(userIds.filter(Boolean))];
        if (!config_1.default.pushNotifications.enabled || !config_1.default.pushNotifications.projectId || uniqueUserIds.length === 0) {
            return {
                requestedUsers: uniqueUserIds.length,
                tokensAttempted: 0,
                successCount: 0,
                failureCount: 0,
            };
        }
        const deviceTokens = await device_token_model_1.default.find({
            userId: { $in: uniqueUserIds },
            isActive: true,
        });
        const tokensByValue = new Map();
        for (const deviceToken of deviceTokens) {
            tokensByValue.set(deviceToken.token, deviceToken);
        }
        const uniqueDeviceTokens = [...tokensByValue.values()];
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
            logger_1.logger.warn('Push notifications skipped because no Google access token could be resolved');
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
                await (0, gaxios_1.request)({
                    method: 'POST',
                    url: `https://fcm.googleapis.com/v1/projects/${config_1.default.pushNotifications.projectId}/messages:send`,
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
            }
            catch (error) {
                failureCount += 1;
                logger_1.logger.error(`Push notification send failed: ${(error === null || error === void 0 ? void 0 : error.message) || error}`);
                if (this.shouldDeactivateToken(error)) {
                    await device_token_model_1.default.updateOne({ _id: deviceToken.id }, { $set: { isActive: false } });
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
    async sendAttendanceReviewAlert(extraction) {
        const school = await school_1.School.findById(extraction.schoolId);
        if (!school) {
            logger_1.logger.warn(`Push notification skipped because school ${extraction.schoolId} was not found`);
            return;
        }
        const configuredAdminIds = (school.adminUsers || []).filter(Boolean);
        const fallbackAdminIds = school.adminUser ? [school.adminUser] : [];
        const schoolAdminIds = configuredAdminIds.length ? configuredAdminIds : fallbackAdminIds;
        const schoolAdmins = schoolAdminIds.length
            ? await users_1.User.find({ _id: { $in: schoolAdminIds }, role: 'school-admin', status: 'active' })
            : [];
        const recipientIds = [
            ...new Set([
                ...schoolAdmins.map((user) => user.id),
                ...(extraction.createdBy ? [extraction.createdBy] : []),
            ]),
        ];
        if (!recipientIds.length) {
            logger_1.logger.warn(`Push notification skipped because no recipients were resolved for extraction ${this.getExtractionId(extraction)}`);
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
    async getAccessToken() {
        try {
            const client = await this.auth.getClient();
            const accessToken = await client.getAccessToken();
            if (!accessToken) {
                return null;
            }
            return typeof accessToken === 'string' ? accessToken : accessToken.token;
        }
        catch (error) {
            logger_1.logger.error(`Failed to obtain Google access token for push notifications: ${error}`);
            return null;
        }
    }
    shouldDeactivateToken(error) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
        const errorCode = (_e = (_d = (_c = (_b = (_a = error === null || error === void 0 ? void 0 : error.response) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.error) === null || _c === void 0 ? void 0 : _c.details) === null || _d === void 0 ? void 0 : _d[0]) === null || _e === void 0 ? void 0 : _e.errorCode;
        const errorStatus = (_h = (_g = (_f = error === null || error === void 0 ? void 0 : error.response) === null || _f === void 0 ? void 0 : _f.data) === null || _g === void 0 ? void 0 : _g.error) === null || _h === void 0 ? void 0 : _h.status;
        const errorMessage = String(((_l = (_k = (_j = error === null || error === void 0 ? void 0 : error.response) === null || _j === void 0 ? void 0 : _j.data) === null || _k === void 0 ? void 0 : _k.error) === null || _l === void 0 ? void 0 : _l.message) || (error === null || error === void 0 ? void 0 : error.message) || '').toLowerCase();
        return (errorCode === 'UNREGISTERED' ||
            errorStatus === 'NOT_FOUND' ||
            errorMessage.includes('registration token is not a valid fcm registration token') ||
            errorMessage.includes('invalid registration token'));
    }
}
exports.pushNotificationService = new PushNotificationService();
//# sourceMappingURL=push-notification.service.js.map