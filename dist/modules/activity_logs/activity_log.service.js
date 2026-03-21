"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getActivityLogs = exports.getOrganizationActivityLogs = exports.getProjectActivityLogs = exports.createActivityLog = void 0;
const activity_log_model_1 = __importDefault(require("./activity_log.model"));
const activity_log_enrichment_1 = require("./activity_log.enrichment");
/**
 * Create a new activity log
 * @param logBody
 */
const createActivityLog = async (logBody) => {
    return activity_log_model_1.default.create(logBody);
};
exports.createActivityLog = createActivityLog;
/**
 * Get activity logs for a project
 * @param projectId
 * @param options Pagination options
 */
const getProjectActivityLogs = async (projectId, options = {}) => {
    const filter = { projectId };
    // @ts-ignore
    const result = await activity_log_model_1.default.paginate(filter, options);
    return (0, activity_log_enrichment_1.enrichActivityLogs)(result);
};
exports.getProjectActivityLogs = getProjectActivityLogs;
/**
 * Get activity logs for an organization
 * @param organizationId
 * @param options
 */
const getOrganizationActivityLogs = async (organizationId, options = {}) => {
    const filter = { organizationId };
    // @ts-ignore
    const result = await activity_log_model_1.default.paginate(filter, options);
    return (0, activity_log_enrichment_1.enrichActivityLogs)(result);
};
exports.getOrganizationActivityLogs = getOrganizationActivityLogs;
/**
 * Get all activity logs with filter
 * @param filter
 * @param options
 */
const getActivityLogs = async (filter, options = {}) => {
    // @ts-ignore
    const result = await activity_log_model_1.default.paginate(filter, options);
    return (0, activity_log_enrichment_1.enrichActivityLogs)(result);
};
exports.getActivityLogs = getActivityLogs;
//# sourceMappingURL=activity_log.service.js.map