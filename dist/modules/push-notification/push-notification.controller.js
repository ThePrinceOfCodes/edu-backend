"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendTestNotification = exports.unregisterToken = exports.registerToken = void 0;
const http_status_1 = __importDefault(require("http-status"));
const utils_1 = require("../utils");
const errors_1 = require("../errors");
const push_notification_service_1 = require("./push-notification.service");
const getActorId = (req) => {
    const account = req.account;
    return String((account === null || account === void 0 ? void 0 : account.id) || (account === null || account === void 0 ? void 0 : account._id) || '');
};
exports.registerToken = (0, utils_1.catchAsync)(async (req, res) => {
    const actorId = getActorId(req);
    if (!actorId) {
        throw new errors_1.ApiError(http_status_1.default.UNAUTHORIZED, 'Please authenticate');
    }
    const token = await push_notification_service_1.pushNotificationService.registerToken(actorId, req.body);
    res.status(http_status_1.default.OK).send(token);
});
exports.unregisterToken = (0, utils_1.catchAsync)(async (req, res) => {
    const actorId = getActorId(req);
    if (!actorId) {
        throw new errors_1.ApiError(http_status_1.default.UNAUTHORIZED, 'Please authenticate');
    }
    await push_notification_service_1.pushNotificationService.unregisterToken(actorId, req.body.fcm_token);
    res.status(http_status_1.default.NO_CONTENT).send();
});
exports.sendTestNotification = (0, utils_1.catchAsync)(async (req, res) => {
    const result = await push_notification_service_1.pushNotificationService.sendToUsers(req.body.userIds, {
        title: req.body.title,
        body: req.body.body,
        data: (req.body.data || {}),
    });
    res.status(http_status_1.default.OK).send(result);
});
//# sourceMappingURL=push-notification.controller.js.map