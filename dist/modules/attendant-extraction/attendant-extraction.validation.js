"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.testPi = exports.testDocumentAi = exports.exportExtraction = exports.approveExtraction = exports.correctExtraction = exports.getExtraction = exports.listExtractions = exports.createExtraction = void 0;
const joi_1 = __importDefault(require("joi"));
exports.createExtraction = {
    body: joi_1.default.object().keys({
        schoolId: joi_1.default.string().required(),
        startDate: joi_1.default.date().required(),
        endDate: joi_1.default.date().required(),
    }),
};
exports.listExtractions = {
    query: joi_1.default.object().keys({
        status: joi_1.default.string().valid('uploaded', 'queued', 'processing', 'ocr_completed', 'llm_extracted', 'validation_failed', 'pending_review', 'corrected', 'approved', 'exported', 'failed').optional(),
        sortBy: joi_1.default.string(),
        limit: joi_1.default.number().integer(),
        page: joi_1.default.number().integer(),
    }),
};
exports.getExtraction = {
    params: joi_1.default.object().keys({
        id: joi_1.default.string().required(),
    }),
};
exports.correctExtraction = {
    params: joi_1.default.object().keys({
        id: joi_1.default.string().required(),
    }),
    body: joi_1.default.object().required().unknown(true),
};
exports.approveExtraction = {
    params: joi_1.default.object().keys({
        id: joi_1.default.string().required(),
    }),
};
exports.exportExtraction = {
    params: joi_1.default.object().keys({
        id: joi_1.default.string().required(),
    }),
    query: joi_1.default.object().keys({
        format: joi_1.default.string().valid('jsonl', 'csv', 'docai').default('jsonl'),
    }),
};
exports.testDocumentAi = {
    query: joi_1.default.object().keys({
        includeRaw: joi_1.default.boolean().truthy('true').falsy('false').default(false),
    }),
};
exports.testPi = {
    query: joi_1.default.object().keys({
        includeRawResponse: joi_1.default.boolean().truthy('true').falsy('false').default(false),
        includeValidationErrors: joi_1.default.boolean().truthy('true').falsy('false').default(true),
    }),
    body: joi_1.default.object().keys({
        prompt: joi_1.default.string().optional(),
        ocrText: joi_1.default.string().optional(),
        ocrLayoutSummary: joi_1.default.object().optional(),
    }),
};
//# sourceMappingURL=attendant-extraction.validation.js.map