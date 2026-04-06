import express from 'express';
import validate from '../../modules/validate/validate.middleware';
import { authenticate, authorize } from '../../modules/auth';
import * as messagingValidation from '../../modules/messaging/messaging.validation';
import * as messagingController from '../../modules/messaging/messaging.controller';

const router = express.Router();

router
  .route('/threads')
  .post(authenticate, authorize('messages.write'), validate(messagingValidation.createThread), messagingController.createThread)
  .get(authenticate, authorize('messages.read'), validate(messagingValidation.getThreads), messagingController.getThreads);

router
  .route('/threads/:threadId/messages')
  .get(
    authenticate,
    authorize('messages.read'),
    validate(messagingValidation.getThreadMessages),
    messagingController.getThreadMessages
  )
  .post(
    authenticate,
    authorize('messages.write'),
    validate(messagingValidation.sendMessage),
    messagingController.sendMessage
  );

export default router;
