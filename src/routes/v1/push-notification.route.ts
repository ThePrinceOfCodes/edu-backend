import express from 'express';
import validate from '../../modules/validate/validate.middleware';
import { authenticate, requireInternalUser } from '../../modules/auth';
import { pushNotificationController, pushNotificationValidation } from '../../modules/push-notification';

const router = express.Router();

router.post(
  '/test',
  authenticate,
  requireInternalUser,
  validate(pushNotificationValidation.sendTestNotification),
  pushNotificationController.sendTestNotification
);

router
  .route('/')
  .post(authenticate, validate(pushNotificationValidation.registerToken), pushNotificationController.registerToken)
  .delete(authenticate, validate(pushNotificationValidation.unregisterToken), pushNotificationController.unregisterToken);

export default router;
