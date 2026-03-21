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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTimesheetSessions = exports.getActivityDetails = exports.queryMemberTimesheets = exports.queryOwnerTimesheets = exports.changeStatus = exports.submitTimesheet = exports.deleteTimesheetById = exports.updateTimesheetById = exports.getTimesheetById = exports.queryTimesheets = void 0;
const http_status_1 = __importDefault(require("http-status"));
const timesheet_model_1 = __importDefault(require("./timesheet.model"));
const errors_1 = require("../errors");
const organizations_1 = require("../organizations");
const organization_interfaces_1 = require("../organizations/organization.interfaces");
const sessions_1 = require("../sessions");
const screenshot_model_1 = __importDefault(require("../screenshots/screenshot.model"));
const moment_1 = __importDefault(require("moment"));
const dashboardService = __importStar(require("../dashboard/dashboard.service"));
const activity_logs_1 = require("../activity_logs");
/**
 * Query for timesheets
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @param {string} [userId] - The ID of the user requesting the timesheets
 * @returns {Promise<QueryResult>}
 */
const queryTimesheets = async (filter, options, userId) => {
    let finalFilter = Object.assign({}, filter);
    if (userId) {
        // Fetch all memberships for the user
        const memberships = await organizations_1.OrganizationMember.find({ userId });
        const adminOrgIds = [];
        const memberOrgIds = [];
        for (const membership of memberships) {
            if (membership.role === organization_interfaces_1.OrganizationMemberRole.OWNER || membership.role === organization_interfaces_1.OrganizationMemberRole.MANAGER) {
                adminOrgIds.push(membership.organizationId);
            }
            else {
                memberOrgIds.push(membership.organizationId);
            }
        }
        // Construct role-based filter
        const roleFilter = {
            $or: [
                // User can see all timesheets in organizations where they are NOT a simple member (e.g. OWNER, MANAGER)
                { organizationId: { $in: adminOrgIds } },
                // User can only see their OWN timesheets in organizations where they are a MEMBER
                { organizationId: { $in: memberOrgIds }, userId: userId }
            ]
        };
        // Combine with existing filter
        finalFilter = { $and: [finalFilter, roleFilter] };
    }
    const timesheets = await timesheet_model_1.default.paginate(finalFilter, options);
    return timesheets;
};
exports.queryTimesheets = queryTimesheets;
/**
 * Get timesheet by id
 * @param {string} id
 * @returns {Promise<ITimesheet | null>}
 */
const getTimesheetById = async (id) => {
    return timesheet_model_1.default.findById(id);
};
exports.getTimesheetById = getTimesheetById;
/**
 * Update timesheet by id
 * @param {string} timesheetId
 * @param {Object} updateBody
 * @returns {Promise<ITimesheet>}
 */
const updateTimesheetById = async (timesheetId, updateBody, actorId) => {
    const timesheet = await (0, exports.getTimesheetById)(timesheetId);
    if (!timesheet) {
        throw new errors_1.ApiError(http_status_1.default.NOT_FOUND, 'Timesheet not found');
    }
    const changedFields = Object.keys(updateBody || {}).filter((key) => updateBody[key] !== undefined);
    Object.assign(timesheet, updateBody);
    await timesheet.save();
    if (changedFields.length > 0) {
        await activity_logs_1.activityLogService.createActivityLog({
            type: activity_logs_1.activityLogInterfaces.ActivityLogType.ORGANIZATION,
            action: activity_logs_1.activityLogInterfaces.ActivityLogAction.TIMESHEET_UPDATED,
            description: `Timesheet was updated`,
            organizationId: timesheet.organizationId,
            actorId,
            targetId: timesheet.id,
            metadata: {
                module: 'timesheet',
                operation: 'update_timesheet',
                timesheetId: timesheet.id,
                changedFields,
            },
        });
    }
    return timesheet;
};
exports.updateTimesheetById = updateTimesheetById;
/**
 * Delete timesheet by id
 * @param {string} timesheetId
 * @returns {Promise<ITimesheet>}
 */
const deleteTimesheetById = async (timesheetId, actorId) => {
    const timesheet = await (0, exports.getTimesheetById)(timesheetId);
    if (!timesheet) {
        throw new errors_1.ApiError(http_status_1.default.NOT_FOUND, 'Timesheet not found');
    }
    await timesheet.deleteOne();
    await activity_logs_1.activityLogService.createActivityLog({
        type: activity_logs_1.activityLogInterfaces.ActivityLogType.ORGANIZATION,
        action: activity_logs_1.activityLogInterfaces.ActivityLogAction.TIMESHEET_DELETED,
        description: `Timesheet was deleted`,
        organizationId: timesheet.organizationId,
        actorId,
        targetId: timesheet.id,
        metadata: {
            module: 'timesheet',
            operation: 'delete_timesheet',
            timesheetId: timesheet.id,
            userId: timesheet.userId,
        },
    });
    return timesheet;
};
exports.deleteTimesheetById = deleteTimesheetById;
/**
 * Change timesheet status
 * @param {string} timesheetId
 * @param {string} userId
 * @param {string} status
 * @param {string} [reason]
 * @returns {Promise<ITimesheet>}
 */
const submitTimesheet = async (timesheetId, userId) => {
    const timesheet = await (0, exports.getTimesheetById)(timesheetId);
    if (!timesheet) {
        throw new errors_1.ApiError(http_status_1.default.NOT_FOUND, 'Timesheet not found');
    }
    if (timesheet.userId !== userId) {
        throw new errors_1.ApiError(http_status_1.default.FORBIDDEN, 'You can only submit your own timesheets');
    }
    if (timesheet.status !== 'open') {
        throw new errors_1.ApiError(http_status_1.default.BAD_REQUEST, `Timesheet cannot be submitted from status '${timesheet.status}'`);
    }
    timesheet.status = 'submitted';
    timesheet.submittedOn = new Date();
    await timesheet.save();
    await activity_logs_1.activityLogService.createActivityLog({
        type: activity_logs_1.activityLogInterfaces.ActivityLogType.ORGANIZATION,
        action: activity_logs_1.activityLogInterfaces.ActivityLogAction.TIMESHEET_UPDATED,
        description: `Timesheet was submitted`,
        organizationId: timesheet.organizationId,
        actorId: userId,
        targetId: timesheet.id,
        metadata: {
            module: 'timesheet',
            operation: 'submit_timesheet',
            status: timesheet.status,
        },
    });
    return timesheet;
};
exports.submitTimesheet = submitTimesheet;
const changeStatus = async (timesheetId, userId, status, reason) => {
    const timesheet = await (0, exports.getTimesheetById)(timesheetId);
    if (!timesheet) {
        throw new errors_1.ApiError(http_status_1.default.NOT_FOUND, 'Timesheet not found');
    }
    const member = await organizations_1.OrganizationMember.findOne({
        organizationId: timesheet.organizationId,
        userId: userId
    });
    if (!member || member.role === organization_interfaces_1.OrganizationMemberRole.MEMBER) {
        throw new errors_1.ApiError(http_status_1.default.FORBIDDEN, 'You do not have permission to change timesheet status');
    }
    timesheet.status = status;
    if (status === 'approved') {
        timesheet.approvedBy = userId;
        timesheet.approvedOn = new Date();
        timesheet.rejectionReason = undefined;
    }
    else if (status === 'rejected') {
        timesheet.rejectionReason = reason;
        // Optional: clear approval info if rejected
        timesheet.approvedBy = undefined;
        timesheet.approvedOn = undefined;
    }
    await timesheet.save();
    await activity_logs_1.activityLogService.createActivityLog({
        type: activity_logs_1.activityLogInterfaces.ActivityLogType.ORGANIZATION,
        action: activity_logs_1.activityLogInterfaces.ActivityLogAction.TIMESHEET_UPDATED,
        description: `Timesheet was ${status}`,
        organizationId: timesheet.organizationId,
        actorId: userId,
        targetId: timesheet.id,
        metadata: {
            module: 'timesheet',
            operation: 'change_timesheet_status',
            status,
            reason: reason || null,
        },
    });
    return timesheet;
};
exports.changeStatus = changeStatus;
const queryOwnerTimesheets = async (filter, options, requestingUserId) => {
    if (!filter.orgId) {
        throw new errors_1.ApiError(http_status_1.default.BAD_REQUEST, 'orgId is required');
    }
    // Verify requester is owner or manager of the org
    const member = await organizations_1.OrganizationMember.findOne({
        organizationId: filter.orgId,
        userId: requestingUserId,
    });
    if (!member || (member.role !== organization_interfaces_1.OrganizationMemberRole.OWNER && member.role !== organization_interfaces_1.OrganizationMemberRole.MANAGER)) {
        throw new errors_1.ApiError(http_status_1.default.FORBIDDEN, 'You do not have permission to view timesheets for this organization');
    }
    const query = {
        organizationId: filter.orgId,
        status: { $ne: 'open' }, // owners only see submitted/approved/rejected timesheets
    };
    if (filter.status)
        query.status = filter.status;
    if (filter.dateFrom && filter.dateTo) {
        const dateFrom = new Date(filter.dateFrom);
        const dateTo = new Date(filter.dateTo);
        query.$and = [
            { startDate: { $lte: dateTo } },
            { endDate: { $gte: dateFrom } },
        ];
    }
    // If search provided, resolve matching userIds first
    if (filter.search) {
        const User = (await Promise.resolve().then(() => __importStar(require('../users/user.model')))).default;
        const matchingUsers = await User.find({ name: { $regex: filter.search, $options: 'i' } }).select('_id');
        const userIds = matchingUsers.map((u) => u._id);
        query.userId = { $in: userIds };
    }
    const result = await timesheet_model_1.default.paginate(query, Object.assign(Object.assign({}, options), { populate: 'approvedBy,userId', sort: options.sortBy || '-createdAt' }));
    const enrichedDocs = await Promise.all(result.results.map(async (timesheet) => {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j;
        let details = { regularHours: 0, manualTime: 0, totalWorkedHours: '00:00:00', activityLevel: '0%', screenshotCount: 0 };
        try {
            details = await (0, exports.getActivityDetails)(timesheet);
        }
        catch (_) { }
        return {
            id: timesheet._id,
            userId: (_b = (_a = timesheet.userId) === null || _a === void 0 ? void 0 : _a._id) !== null && _b !== void 0 ? _b : timesheet.userId,
            user: (_d = (_c = timesheet.userId) === null || _c === void 0 ? void 0 : _c.name) !== null && _d !== void 0 ? _d : null,
            approvedBy: (_g = (_f = (_e = timesheet.approvedBy) === null || _e === void 0 ? void 0 : _e._id) !== null && _f !== void 0 ? _f : timesheet.approvedBy) !== null && _g !== void 0 ? _g : null,
            approvedByName: (_j = (_h = timesheet.approvedBy) === null || _h === void 0 ? void 0 : _h.name) !== null && _j !== void 0 ? _j : null,
            regularHours: details.regularHours,
            manualTime: details.manualTime,
            totalWorkedHours: details.totalWorkedHours,
            activityLevel: details.activityLevel,
            screenshotCount: details.screenshotCount,
            status: timesheet.status,
            paymentStatus: timesheet.paymentStatus,
            startDate: timesheet.startDate,
            endDate: timesheet.endDate,
            submittedOn: timesheet.submittedOn,
        };
    }));
    return {
        docs: enrichedDocs,
        totalDocs: result.totalDocs,
        limit: result.limit,
        totalPages: result.totalPages,
        page: result.page,
        hasPrevPage: result.hasPrevPage,
        hasNextPage: result.hasNextPage,
        prevPage: result.prevPage,
        nextPage: result.nextPage,
    };
};
exports.queryOwnerTimesheets = queryOwnerTimesheets;
const queryMemberTimesheets = async (filter, options, userId) => {
    const query = {
        userId,
    };
    // ✅ Filter by status
    if (filter.status) {
        query.status = filter.status;
    }
    // ✅ Filter by organization
    if (filter.orgId) {
        query.organizationId = filter.orgId;
    }
    // ✅ Date filtering (overlapping range — recommended)
    if (filter.dateFrom && filter.dateTo) {
        const dateFrom = new Date(filter.dateFrom);
        const dateTo = new Date(filter.dateTo);
        query.$and = [
            { startDate: { $lte: dateTo } },
            { endDate: { $gte: dateFrom } },
        ];
    }
    // ✅ Paginate
    const result = await timesheet_model_1.default.paginate(query, Object.assign(Object.assign({}, options), { populate: 'approvedBy,userId', sort: options.sortBy || '-createdAt' }));
    // ✅ Enrich each timesheet with computed details
    const enrichedDocs = await Promise.all(result.results.map(async (timesheet) => {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j;
        const details = await (0, exports.getActivityDetails)(timesheet);
        return {
            id: timesheet._id,
            userId: (_b = (_a = timesheet.userId) === null || _a === void 0 ? void 0 : _a._id) !== null && _b !== void 0 ? _b : timesheet.userId,
            user: (_d = (_c = timesheet.userId) === null || _c === void 0 ? void 0 : _c.name) !== null && _d !== void 0 ? _d : null,
            approvedBy: (_g = (_f = (_e = timesheet.approvedBy) === null || _e === void 0 ? void 0 : _e._id) !== null && _f !== void 0 ? _f : timesheet.approvedBy) !== null && _g !== void 0 ? _g : null,
            approvedByName: (_j = (_h = timesheet.approvedBy) === null || _h === void 0 ? void 0 : _h.name) !== null && _j !== void 0 ? _j : null,
            regularHours: details.regularHours,
            manualTime: details.manualTime,
            totalWorkedHours: details.totalWorkedHours,
            activityLevel: details.activityLevel,
            screenshotCount: details.screenshotCount,
            status: timesheet.status,
            startDate: timesheet.startDate,
            endDate: timesheet.endDate,
            submittedOn: timesheet.submittedOn,
        };
    }));
    return {
        docs: enrichedDocs,
        totalDocs: result.results.length,
        limit: result.limit,
        totalPages: result.totalPages,
        page: result.page,
    };
};
exports.queryMemberTimesheets = queryMemberTimesheets;
const getActivityDetails = async (timesheet) => {
    // Use timesheet start/end as the calculation range
    const start = new Date(timesheet.startDate).getTime();
    const end = new Date(timesheet.endDate).getTime();
    // Fetch sessions that overlap with the timesheet period
    const timesheetSessions = await sessions_1.Session.find({
        organizationId: timesheet.organizationId,
        userId: timesheet.userId,
        $or: [
            { startTime: { $lte: end }, endTime: { $gte: start } },
            { startTime: { $lte: end }, endTime: { $exists: false } },
        ],
    });
    // Sum overlapping duration (milliseconds), accounting for deducted seconds
    let totalMs = 0;
    for (const session of timesheetSessions) {
        const sStart = session.startTime;
        const sEnd = session.endTime || end;
        const overlapStart = Math.max(sStart, start);
        const overlapEnd = Math.min(sEnd, end);
        const overlapMs = Math.max(0, overlapEnd - overlapStart);
        const deductedMs = (session.deductedSeconds || 0) * 1000;
        const effectiveMs = Math.max(0, overlapMs - deductedMs);
        totalMs += effectiveMs;
    }
    const totalSeconds = Math.floor(totalMs / 1000);
    const totalWorkedHours = Math.floor(totalSeconds / 3600).toString().padStart(2, '0') + ':' + moment_1.default.utc((totalSeconds % 3600) * 1000).format('mm:ss');
    // regularHours: total hours as a float with 2 decimals
    const regularHours = Number((totalSeconds / 3600).toFixed(2));
    // manualTime: placeholder (no manual time stored on Session); keep 0
    const manualTime = 0;
    // Activity score based on sessions returned
    const activityLevel = `${dashboardService.calculateActivityScore(timesheetSessions)}%`;
    // Count screenshots by timestamp within the range
    const screenshotCount = await screenshot_model_1.default.countDocuments({ userId: timesheet.userId, timestamp: { $gte: start, $lte: end } });
    return {
        regularHours,
        manualTime,
        totalWorkedHours,
        activityLevel,
        screenshotCount,
    };
};
exports.getActivityDetails = getActivityDetails;
const getTimesheetSessions = async (timesheetId, requestingUserId) => {
    const timesheet = await (0, exports.getTimesheetById)(timesheetId);
    if (!timesheet) {
        throw new errors_1.ApiError(http_status_1.default.NOT_FOUND, 'Timesheet not found');
    }
    // Only the owner or an admin/manager of the org may view sessions
    const member = await organizations_1.OrganizationMember.findOne({
        organizationId: timesheet.organizationId,
        userId: requestingUserId,
    });
    const isOwner = timesheet.userId === requestingUserId;
    const isManager = member && (member.role === organization_interfaces_1.OrganizationMemberRole.OWNER || member.role === organization_interfaces_1.OrganizationMemberRole.MANAGER);
    if (!isOwner && !isManager) {
        throw new errors_1.ApiError(http_status_1.default.FORBIDDEN, 'You do not have permission to view these sessions');
    }
    const start = new Date(timesheet.startDate).getTime();
    const end = new Date(timesheet.endDate).getTime();
    // Fetch all sessions that overlap the timesheet period, populate project; sort by startTime
    const rawSessions = await sessions_1.Session.find({
        organizationId: timesheet.organizationId,
        userId: timesheet.userId,
        $or: [
            { startTime: { $lte: end }, endTime: { $gte: start } },
            { startTime: { $lte: end }, endTime: { $exists: false } },
        ],
    }).populate('projectId').sort({ startTime: 1 });
    // Merge sessions into streaks: a session joins the current streak only if
    // its startTime exactly matches (within 1 s tolerance) the endTime of the
    // previous session. When the streak breaks, a new group is started.
    const CONTINUITY_TOLERANCE_MS = 1000; // 1 second tolerance for rounding
    const mergedGroups = [];
    for (const session of rawSessions) {
        if (mergedGroups.length === 0) {
            mergedGroups.push([session]);
            continue;
        }
        const currentGroup = mergedGroups[mergedGroups.length - 1];
        const lastSession = currentGroup === null || currentGroup === void 0 ? void 0 : currentGroup[currentGroup.length - 1];
        const lastEnd = lastSession.endTime;
        // Only continue the streak when the previous session has a known endTime
        // and it aligns with this session's startTime within tolerance
        if (lastEnd != null && Math.abs(session.startTime - lastEnd) <= CONTINUITY_TOLERANCE_MS) {
            currentGroup === null || currentGroup === void 0 ? void 0 : currentGroup.push(session);
        }
        else {
            mergedGroups.push([session]);
        }
    }
    const enrichedSessions = await Promise.all(mergedGroups.map(async (group) => {
        const firstSession = group[0];
        const lastSession = group[group.length - 1];
        const sStart = firstSession.startTime;
        // const sEnd = lastSession.endTime ?? Date.now();
        // Aggregate per-session effective durations (exclude gaps between sessions)
        const durationSeconds = group.reduce((acc, s) => {
            var _a;
            const dur = Math.floor((((_a = s.endTime) !== null && _a !== void 0 ? _a : Date.now()) - s.startTime) / 1000);
            return acc + Math.max(0, dur - (s.deductedSeconds || 0));
        }, 0);
        const idleSeconds = group.reduce((acc, s) => acc + (s.idleSeconds || 0), 0);
        const keyboardEvents = group.reduce((acc, s) => acc + (s.keyboardEvents || 0), 0);
        const mouseEvents = group.reduce((acc, s) => acc + (s.mouseEvents || 0), 0);
        const activityScore = `${dashboardService.calculateActivityScore(group)}%`;
        // Collect screenshots from all sessions in the group
        const uuids = group.map((s) => s.uuid);
        const screenshots = await screenshot_model_1.default.find({
            sessionUuid: { $in: uuids },
        }).select('_id url timestamp').sort({ timestamp: 1 });
        return {
            ids: group.map((s) => s._id),
            sessionCount: group.length,
            project: firstSession.projectId,
            startTime: new Date(sStart).toISOString(),
            endTime: lastSession.endTime ? new Date(lastSession.endTime).toISOString() : null,
            durationSeconds,
            durationFormatted: Math.floor(durationSeconds / 3600).toString().padStart(2, '0') + ':' +
                moment_1.default.utc((durationSeconds % 3600) * 1000).format('mm:ss'),
            idleSeconds,
            activityRate: activityScore,
            keyboardEvents,
            mouseEvents,
            screenshots: screenshots.map((s) => ({
                id: s._id,
                url: s.url,
                timestamp: s.timestamp,
                takenAt: new Date(s.timestamp).toISOString(),
            })),
            screenshotCount: screenshots.length,
        };
    }));
    return {
        timesheetId,
        startDate: timesheet.startDate,
        endDate: timesheet.endDate,
        sessions: enrichedSessions,
        totalSessions: enrichedSessions.length,
    };
};
exports.getTimesheetSessions = getTimesheetSessions;
//# sourceMappingURL=timesheet.service.js.map