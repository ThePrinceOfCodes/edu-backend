"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOrganizationActivityLogs = exports.getActivityLogs = void 0;
const joi_1 = __importDefault(require("joi"));
const activity_log_interfaces_1 = require("./activity_log.interfaces");
const commonQuery = {
    actorId: joi_1.default.string().uuid(),
    organizationId: joi_1.default.string().uuid(),
    projectId: joi_1.default.string().uuid(),
    type: joi_1.default.string().valid(...Object.values(activity_log_interfaces_1.ActivityLogType)),
    action: joi_1.default.string().valid(...Object.values(activity_log_interfaces_1.ActivityLogAction)),
    targetType: joi_1.default.string().valid(...Object.values(activity_log_interfaces_1.ActivityTargetType)),
    targetId: joi_1.default.string().allow(''),
    startDate: joi_1.default.date().iso(),
    endDate: joi_1.default.date().iso(),
    sortBy: joi_1.default.string(),
    limit: joi_1.default.number().integer(),
    page: joi_1.default.number().integer(),
};
exports.getActivityLogs = {
    query: joi_1.default.object().keys(commonQuery),
};
exports.getOrganizationActivityLogs = {
    params: joi_1.default.object().keys({
        organizationId: joi_1.default.string().uuid().required(),
    }),
    query: joi_1.default.object().keys({
        actorId: joi_1.default.string().uuid(),
        projectId: joi_1.default.string().uuid(),
        type: joi_1.default.string().valid(...Object.values(activity_log_interfaces_1.ActivityLogType)),
        action: joi_1.default.string().valid(...Object.values(activity_log_interfaces_1.ActivityLogAction)),
        targetType: joi_1.default.string().valid(...Object.values(activity_log_interfaces_1.ActivityTargetType)),
        targetId: joi_1.default.string().allow(''),
        startDate: joi_1.default.date().iso(),
        endDate: joi_1.default.date().iso(),
        sortBy: joi_1.default.string(),
        limit: joi_1.default.number().integer(),
        page: joi_1.default.number().integer(),
    }),
};
//# sourceMappingURL=activity_log.validation.js.map