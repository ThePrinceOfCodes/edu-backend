"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOrganizationActivityLogs = exports.getActivityLogs = exports.getLatestActivityLogs = void 0;
const index_1 = require("../utils/index");
const activityLogService = __importStar(require("./activity_log.service"));
const buildDateRange = (startDate, endDate) => {
    const createdAt = {};
    let start = startDate ? new Date(startDate) : undefined;
    let end = endDate ? new Date(endDate) : undefined;
    if (start && end && start.getTime() > end.getTime()) {
        const temp = start;
        start = end;
        end = temp;
    }
    if (start) {
        createdAt['$gte'] = start;
    }
    if (end) {
        createdAt['$lte'] = end;
    }
    return Object.keys(createdAt).length ? createdAt : undefined;
};
exports.getLatestActivityLogs = (0, index_1.catchAsync)(async (_, res) => {
    const limit = 20;
    const page = 1;
    const options = {
        limit,
        page,
        sortBy: 'createdAt:desc',
        populate: 'actor'
    };
    // Internal user sees all, or filter by org if needed?
    // User request: "fetch the lartest 20 activities from activity log"
    // Assuming global or contextual. Given it's likely for the "Audit trail" or "Dashboard" internal view.
    // If internal user, maybe all? Or maybe filter by query?
    // For now, let's fetch ALL latest 20 across the system (internal admin view).
    // The service needs a function for this.
    const result = await activityLogService.getActivityLogs({}, options);
    res.send(result);
});
exports.getActivityLogs = (0, index_1.catchAsync)(async (req, res) => {
    const { actorId, organizationId, projectId, type, action, targetType, targetId, startDate, endDate } = req.query;
    const options = {
        sortBy: req.query['sortBy'] || 'createdAt:desc',
        limit: req.query['limit'],
        page: req.query['page'],
        populate: 'actor',
    };
    const filter = {};
    if (actorId)
        filter['actorId'] = actorId;
    if (organizationId)
        filter['organizationId'] = organizationId;
    if (projectId)
        filter['projectId'] = projectId;
    if (type)
        filter['type'] = type;
    if (action)
        filter['action'] = action;
    if (targetType)
        filter['targetType'] = targetType;
    if (targetId)
        filter['targetId'] = targetId;
    const createdAt = buildDateRange(startDate, endDate);
    if (createdAt)
        filter['createdAt'] = createdAt;
    const result = await activityLogService.getActivityLogs(filter, options);
    res.send(result);
});
exports.getOrganizationActivityLogs = (0, index_1.catchAsync)(async (req, res) => {
    const { organizationId } = req.params;
    const { actorId, projectId, type, action, targetType, targetId, startDate, endDate } = req.query;
    const options = {
        sortBy: req.query['sortBy'] || 'createdAt:desc',
        limit: req.query['limit'],
        page: req.query['page'],
        populate: 'actor',
    };
    const filter = { organizationId };
    if (actorId)
        filter['actorId'] = actorId;
    if (projectId)
        filter['projectId'] = projectId;
    if (type)
        filter['type'] = type;
    if (action)
        filter['action'] = action;
    if (targetType)
        filter['targetType'] = targetType;
    if (targetId)
        filter['targetId'] = targetId;
    const createdAt = buildDateRange(startDate, endDate);
    if (createdAt)
        filter['createdAt'] = createdAt;
    const result = await activityLogService.getActivityLogs(filter, options);
    res.send(result);
});
//# sourceMappingURL=activity_log.controller.js.map