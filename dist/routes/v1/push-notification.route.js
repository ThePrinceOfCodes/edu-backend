"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const validate_middleware_1 = __importDefault(require("../../modules/validate/validate.middleware"));
const auth_1 = require("../../modules/auth");
const push_notification_1 = require("../../modules/push-notification");
const router = express_1.default.Router();
router.post('/test', auth_1.authenticate, auth_1.requireInternalUser, (0, validate_middleware_1.default)(push_notification_1.pushNotificationValidation.sendTestNotification), push_notification_1.pushNotificationController.sendTestNotification);
router
    .route('/')
    .post(auth_1.authenticate, (0, validate_middleware_1.default)(push_notification_1.pushNotificationValidation.registerToken), push_notification_1.pushNotificationController.registerToken)
    .delete(auth_1.authenticate, (0, validate_middleware_1.default)(push_notification_1.pushNotificationValidation.unregisterToken), push_notification_1.pushNotificationController.unregisterToken);
exports.default = router;
//# sourceMappingURL=push-notification.route.js.map