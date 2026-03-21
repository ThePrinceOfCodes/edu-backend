"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAggregatedSessions = exports.getAppUsage = exports.getTodaySessions = exports.syncSessions = void 0;
const joi_1 = __importDefault(require("joi"));
exports.syncSessions = {
    body: joi_1.default.array().items(joi_1.default.object().keys({
        uuid: joi_1.default.string().required(),
        projectId: joi_1.default.string().required(),
        startTime: joi_1.default.number().required(),
        endTime: joi_1.default.number().allow(null),
        isActive: joi_1.default.boolean(),
        idleSeconds: joi_1.default.number(),
        deductedSeconds: joi_1.default.number(),
        keyboardEvents: joi_1.default.number(),
        mouseEvents: joi_1.default.number(),
        activity_logs: joi_1.default.array().items(joi_1.default.object().keys({
            appName: joi_1.default.string().required(),
            timestamp: joi_1.default.number().required(),
            url: joi_1.default.string().allow(null, ''),
            windowTitle: joi_1.default.string().allow(null, '')
        }))
    })).required()
};
exports.getTodaySessions = {
    query: joi_1.default.object().keys({
        projectId: joi_1.default.string().uuid(),
    }),
};
exports.getAppUsage = {
    query: joi_1.default.object().keys({
        userId: joi_1.default.string(),
        projectId: joi_1.default.string().uuid(),
        startDate: joi_1.default.string(),
        endDate: joi_1.default.string(),
    }),
};
exports.getAggregatedSessions = {
    query: joi_1.default.object().keys({
        userId: joi_1.default.string().optional(),
        organizationId: joi_1.default.string().optional(),
        projectId: joi_1.default.string().optional(),
        startDate: joi_1.default.string().required(),
        endDate: joi_1.default.string().required(),
    }),
};
//# sourceMappingURL=session.validation.js.map