import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import httpStatus from 'http-status';
import pick from '../utils/pick';
import ApiError from '../errors/ApiError';

const validate =
  (schema: Record<string, any>) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    const validSchema = pick(schema, ['params', 'query', 'body']);
    const object = pick(req, Object.keys(validSchema));
    const { value, error } = Joi.compile(validSchema)
      .prefs({ errors: { label: 'key' } })
      .validate(object, { stripUnknown: false, allowUnknown: true }); // Allow unknown fields

    if (error) {
      const errorMessage = error.details.map((details) => details.message).join(', ');
      console.log('Validation error details:', error.details); // Debug log
      return next(new ApiError(httpStatus.BAD_REQUEST, errorMessage.replace(/"/g, '')));
    }
    Object.assign(req, value);
    return next();
  };

export default validate;
