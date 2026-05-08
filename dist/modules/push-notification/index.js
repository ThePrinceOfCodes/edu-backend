"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pushNotificationValidation = exports.pushNotificationService = exports.pushNotificationController = exports.DeviceToken = void 0;
const device_token_model_1 = __importDefault(require("./device-token.model"));
exports.DeviceToken = device_token_model_1.default;
const pushNotificationController = __importStar(require("./push-notification.controller"));
exports.pushNotificationController = pushNotificationController;
const push_notification_service_1 = require("./push-notification.service");
Object.defineProperty(exports, "pushNotificationService", { enumerable: true, get: function () { return push_notification_service_1.pushNotificationService; } });
const pushNotificationValidation = __importStar(require("./push-notification.validation"));
exports.pushNotificationValidation = pushNotificationValidation;
//# sourceMappingURL=index.js.map