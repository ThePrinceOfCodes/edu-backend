import Joi from 'joi';

export const createExtraction = {
  body: Joi.object().keys({
    schoolId: Joi.string().required(),
    termId: Joi.string().required(),
    academicSessionId: Joi.string().required(),
    startDate: Joi.date().required(),
    endDate: Joi.date().required(),
  }),
};

export const listExtractions = {
  query: Joi.object().keys({
    status: Joi.string().valid('uploaded', 'queued', 'processing', 'ocr_completed', 'llm_extracted', 'validation_failed', 'pending_review', 'corrected', 'approved', 'exported', 'failed').optional(),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

export const getExtraction = {
  params: Joi.object().keys({
    id: Joi.string().required(),
  }),
};

export const correctExtraction = {
  params: Joi.object().keys({
    id: Joi.string().required(),
  }),
  body: Joi.object().required().unknown(true),
};

export const approveExtraction = {
  params: Joi.object().keys({
    id: Joi.string().required(),
  }),
};

export const exportExtraction = {
  params: Joi.object().keys({
    id: Joi.string().required(),
  }),
  query: Joi.object().keys({
    format: Joi.string().valid('jsonl', 'csv', 'docai').default('jsonl'),
  }),
};

export const testDocumentAi = {
  query: Joi.object().keys({
    includeRaw: Joi.boolean().truthy('true').falsy('false').default(false),
  }),
};

export const testPi = {
  query: Joi.object().keys({
    includeRawResponse: Joi.boolean().truthy('true').falsy('false').default(false),
    includeValidationErrors: Joi.boolean().truthy('true').falsy('false').default(true),
  }),
  body: Joi.object().keys({
    prompt: Joi.string().optional(),
    ocrText: Joi.string().optional(),
    ocrLayoutSummary: Joi.object().optional(),
  }),
};
