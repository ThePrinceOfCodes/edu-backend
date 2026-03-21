"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAiUsage = exports.triggerOrgNarrative = exports.updateInsightNotes = exports.getUserProjectInsights = exports.getInsightsToReview = exports.runUserInsights = exports.getOrgInsights = exports.getStaffInsights = void 0;
const joi_1 = __importDefault(require("joi"));
exports.getStaffInsights = {
    query: joi_1.default.object().keys({
        projectId: joi_1.default.string().required(),
        userId: joi_1.default.string().required(),
        startDate: joi_1.default.string().isoDate(),
        endDate: joi_1.default.string().isoDate(),
    }),
};
exports.getOrgInsights = {
    query: joi_1.default.object().keys({
        organizationId: joi_1.default.string(),
        dayCode: joi_1.default.string(),
        startDate: joi_1.default.string().isoDate(),
        endDate: joi_1.default.string().isoDate(),
    }),
};
exports.runUserInsights = {
    body: joi_1.default.object().keys({
        userId: joi_1.default.string().required(),
        projectId: joi_1.default.string().required(),
        startTime: joi_1.default.number(),
        endTime: joi_1.default.number(),
    }),
};
exports.getInsightsToReview = {
    query: joi_1.default.object().keys({
        organizationId: joi_1.default.string(),
        page: joi_1.default.number().integer(),
        limit: joi_1.default.number().integer(),
        dayCode: joi_1.default.string(),
        projectId: joi_1.default.string(),
    }),
};
exports.getUserProjectInsights = {
    query: joi_1.default.object().keys({
        organizationId: joi_1.default.string(),
        userId: joi_1.default.string().required(),
        projectId: joi_1.default.string().required(),
        page: joi_1.default.number().integer(),
        limit: joi_1.default.number().integer(),
        dayCode: joi_1.default.string(),
    }),
};
exports.updateInsightNotes = {
    params: joi_1.default.object().keys({
        insightId: joi_1.default.string().required(),
    }),
    body: joi_1.default.object().keys({
        notes: joi_1.default.string().required(),
    }),
};
exports.triggerOrgNarrative = {
    body: joi_1.default.object().keys({
        organizationId: joi_1.default.string().required(),
        batchId: joi_1.default.string().required(),
    }),
};
exports.getAiUsage = {
    query: joi_1.default.object().keys({
        organizationId: joi_1.default.string(),
        insightType: joi_1.default.string().valid('staff', 'org'),
        startDate: joi_1.default.string().isoDate(),
        endDate: joi_1.default.string().isoDate(),
        page: joi_1.default.number().integer(),
        limit: joi_1.default.number().integer(),
    }),
};
//# sourceMappingURL=ai.validation.js.map