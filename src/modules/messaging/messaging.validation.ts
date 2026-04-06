import Joi from 'joi';

export const createThread = {
  body: Joi.object().keys({
    title: Joi.string().trim().allow(null, ''),
    participantIds: Joi.array().items(Joi.string().trim()).default([]),
    isBroadcast: Joi.boolean().default(false),
  }),
};

export const getThreads = {
  query: Joi.object().keys({
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
    sortBy: Joi.string(),
  }),
};

export const getThreadMessages = {
  params: Joi.object().keys({
    threadId: Joi.string().required(),
  }),
  query: Joi.object().keys({
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
    sortBy: Joi.string(),
  }),
};

export const sendMessage = {
  params: Joi.object().keys({
    threadId: Joi.string().required(),
  }),
  body: Joi.object().keys({
    content: Joi.string().trim().required(),
    attachments: Joi.array()
      .items(
        Joi.object().keys({
          name: Joi.string().trim().required(),
          url: Joi.string().required(),
          type: Joi.string().trim().optional().allow(null, ''),
          size: Joi.number().optional(),
        })
      )
      .optional(),
  }),
};
