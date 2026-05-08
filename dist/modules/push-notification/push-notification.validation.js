"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendTestNotification = exports.unregisterToken = exports.registerToken = void 0;
const joi_1 = __importDefault(require("joi"));
const tokenBody = joi_1.default.object().keys({
    fcm_token: joi_1.default.string().trim().required(),
    platform: joi_1.default.string().trim().allow('', null).optional(),
    deviceId: joi_1.default.string().trim().allow('', null).optional(),
});
exports.registerToken = {
    body: tokenBody,
};
exports.unregisterToken = {
    body: tokenBody,
};
exports.sendTestNotification = {
    body: joi_1.default.object().keys({
        userIds: joi_1.default.array().items(joi_1.default.string().trim()).min(1).required(),
        title: joi_1.default.string().trim().required(),
        body: joi_1.default.string().trim().required(),
        data: joi_1.default.object().pattern(joi_1.default.string(), joi_1.default.string()).optional(),
    }),
};
//# sourceMappingURL=push-notification.validation.js.map