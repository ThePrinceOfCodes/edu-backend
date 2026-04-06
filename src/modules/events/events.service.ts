import httpStatus from 'http-status';
import { ApiError } from '../errors';
import { IUserDoc } from '../users/user.interfaces';
import EventModel from './event.model';

const getActorId = (actor: IUserDoc) => {
  const id = (actor as any).id || (actor as any)._id;
  return String(id);
};

const buildAccessFilter = (actor: IUserDoc, queryParams: { school?: string } = {}) => {
  const filter: Record<string, any> = {};

  if (actor.accountType === 'internal') {
    // internal users see all events
    if (queryParams.school) {
      filter['school'] = queryParams.school;
    }
  } else if (actor.schoolBoardId) {
    filter['schoolBoard'] = actor.schoolBoardId;
    if (queryParams.school) {
      filter['school'] = queryParams.school;
    }
  } else if ((actor as any).schoolId) {
    filter['school'] = (actor as any).schoolId;
  }

  return filter;
};

export const createEvent = async (
  payload: {
    title: string;
    description?: string | null;
    startDate: Date;
    endDate?: Date | null;
    allDay?: boolean;
    school?: string | null;
    color?: string | null;
  },
  actor: IUserDoc
) => {
  const actorId = getActorId(actor);

  const event = await EventModel.create({
    title: payload.title,
    description: payload.description || null,
    startDate: payload.startDate,
    ...(payload.endDate !== undefined ? { endDate: payload.endDate } : {}),
    allDay: payload.allDay !== undefined ? payload.allDay : true,
    schoolBoard: actor.schoolBoardId || null,
    ...(payload.school ? { school: payload.school } : {}),
    ...(payload.color ? { color: payload.color } : {}),
    createdBy: actorId,
  });

  return event;
};

export const queryEvents = async (
  queryParams: {
    school?: string;
    startDate?: string;
    endDate?: string;
  },
  options: { limit?: string; page?: string; sortBy?: string },
  actor: IUserDoc
) => {
  const filter = buildAccessFilter(actor, queryParams);

  if (queryParams.startDate) {
    filter['startDate'] = filter['startDate'] || {};
    filter['startDate']['$gte'] = new Date(queryParams.startDate);
  }

  if (queryParams.endDate) {
    filter['startDate'] = filter['startDate'] || {};
    filter['startDate']['$lte'] = new Date(queryParams.endDate);
  }

  const result = await EventModel.paginate(filter, {
    sortBy: options.sortBy || 'startDate:asc',
    limit: options.limit ? Number(options.limit) : 100,
    page: options.page ? Number(options.page) : 1,
  });

  return result;
};

export const getEventById = async (eventId: string, actor: IUserDoc) => {
  const accessFilter = buildAccessFilter(actor);
  const event = await EventModel.findOne({ _id: eventId, ...accessFilter });

  if (!event) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Event not found');
  }

  return event;
};

export const updateEventById = async (
  eventId: string,
  payload: {
    title?: string;
    description?: string | null;
    startDate?: Date;
    endDate?: Date | null;
    allDay?: boolean;
    school?: string | null;
    color?: string | null;
  },
  actor: IUserDoc
) => {
  const event = await getEventById(eventId, actor);

  Object.assign(event, {
    ...(payload.title !== undefined ? { title: payload.title } : {}),
    ...(payload.description !== undefined ? { description: payload.description } : {}),
    ...(payload.startDate !== undefined ? { startDate: payload.startDate } : {}),
    ...(payload.endDate !== undefined ? { endDate: payload.endDate } : {}),
    ...(payload.allDay !== undefined ? { allDay: payload.allDay } : {}),
    ...(payload.school !== undefined ? { school: payload.school } : {}),
    ...(payload.color !== undefined ? { color: payload.color } : {}),
  });

  await event.save();
  return event;
};

export const deleteEventById = async (eventId: string, actor: IUserDoc) => {
  const event = await getEventById(eventId, actor);
  await event.deleteOne();
};
