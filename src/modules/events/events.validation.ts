import Joi from 'joi';

export const createEvent = {
  body: Joi.object().keys({
    title: Joi.string().trim().required(),
    description: Joi.string().trim().allow(null, '').optional(),
    startDate: Joi.date().required(),
    endDate: Joi.date().allow(null).optional(),
    allDay: Joi.boolean().optional(),
    school: Joi.string().trim().allow(null, '').optional(),
    color: Joi.string().trim().allow(null, '').optional(),
  }),
};

export const getEvents = {
  query: Joi.object().keys({
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
    sortBy: Joi.string(),
    school: Joi.string().trim(),
    startDate: Joi.string(),
    endDate: Joi.string(),
  }),
};

export const getEvent = {
  params: Joi.object().keys({
    eventId: Joi.string().required(),
  }),
};

export const updateEvent = {
  params: Joi.object().keys({
    eventId: Joi.string().required(),
  }),
  body: Joi.object()
    .keys({
      title: Joi.string().trim().optional(),
      description: Joi.string().trim().allow(null, '').optional(),
      startDate: Joi.date().optional(),
      endDate: Joi.date().allow(null).optional(),
      allDay: Joi.boolean().optional(),
      school: Joi.string().trim().allow(null, '').optional(),
      color: Joi.string().trim().allow(null, '').optional(),
    })
    .min(1),
};

export const deleteEvent = {
  params: Joi.object().keys({
    eventId: Joi.string().required(),
  }),
};
