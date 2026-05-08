import Joi from 'joi';

const tokenBody = Joi.object().keys({
  fcm_token: Joi.string().trim().required(),
  platform: Joi.string().trim().allow('', null).optional(),
  deviceId: Joi.string().trim().allow('', null).optional(),
});

export const registerToken = {
  body: tokenBody,
};

export const unregisterToken = {
  body: tokenBody,
};

export const sendTestNotification = {
  body: Joi.object().keys({
    userIds: Joi.array().items(Joi.string().trim()).min(1).required(),
    title: Joi.string().trim().required(),
    body: Joi.string().trim().required(),
    data: Joi.object().pattern(Joi.string(), Joi.string()).optional(),
  }),
};
