import express from 'express';
import validate from '../../modules/validate/validate.middleware';
import { authenticate, authorize } from '../../modules/auth';
import * as eventsValidation from '../../modules/events/events.validation';
import * as eventsController from '../../modules/events/events.controller';

const router = express.Router();

router
  .route('/')
  .post(authenticate, authorize('events.write'), validate(eventsValidation.createEvent), eventsController.createEvent)
  .get(authenticate, authorize('events.read'), validate(eventsValidation.getEvents), eventsController.getEvents);

router
  .route('/:eventId')
  .get(authenticate, authorize('events.read'), validate(eventsValidation.getEvent), eventsController.getEvent)
  .patch(authenticate, authorize('events.write'), validate(eventsValidation.updateEvent), eventsController.updateEvent)
  .delete(
    authenticate,
    authorize('events.write'),
    validate(eventsValidation.deleteEvent),
    eventsController.deleteEvent
  );

export default router;
