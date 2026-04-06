import httpStatus from 'http-status';
import { Request, Response } from 'express';
import { catchAsync, pick } from '../utils';
import * as eventsService from './events.service';

const getEventIdFromParams = (req: Request) => req.params['eventId'] as string;

export const createEvent = catchAsync(async (req: Request, res: Response) => {
  const event = await eventsService.createEvent(req.body, req.account);
  res.status(httpStatus.CREATED).send(event);
});

export const getEvents = catchAsync(async (req: Request, res: Response) => {
  const queryParams = pick(req.query, ['school', 'startDate', 'endDate']) as {
    school?: string;
    startDate?: string;
    endDate?: string;
  };
  const options = pick(req.query, ['sortBy', 'limit', 'page']) as {
    sortBy?: string;
    limit?: string;
    page?: string;
  };
  const result = await eventsService.queryEvents(queryParams, options, req.account);
  res.send(result);
});

export const getEvent = catchAsync(async (req: Request, res: Response) => {
  const event = await eventsService.getEventById(getEventIdFromParams(req), req.account);
  res.send(event);
});

export const updateEvent = catchAsync(async (req: Request, res: Response) => {
  const event = await eventsService.updateEventById(getEventIdFromParams(req), req.body, req.account);
  res.send(event);
});

export const deleteEvent = catchAsync(async (req: Request, res: Response) => {
  await eventsService.deleteEventById(getEventIdFromParams(req), req.account);
  res.status(httpStatus.NO_CONTENT).send();
});
