"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserAppUsage = exports.getAggregatedSessions = exports.getTodaySessions = exports.syncSessions = void 0;
const session_model_1 = __importDefault(require("./session.model"));
const index_1 = require("../projects/index");
const index_2 = require("../screenshots/index");
const index_3 = require("../organizations/index");
// import { ApiError } from '../errors/index';
// import httpStatus from 'http-status';
const moment_1 = __importDefault(require("moment"));
const organization_interfaces_1 = require("../organizations/organization.interfaces");
const syncSessions = async (sessions, userId) => {
    const results = [];
    for (const sessionData of sessions) {
        // Validate project membership?
        // OPTIONAL: Check if user is actually member of the project
        // const member = await ProjectMember.findOne({ projectId: sessionData.projectId, userId });
        // if (!member) continue; // Skip or throw?
        // Upsert session based on uuid
        if (!sessionData.uuid || !sessionData.projectId) {
            continue;
        }
        const project = await index_1.Project.findById(sessionData.projectId);
        if (!project)
            continue;
        const session = await session_model_1.default.findOneAndUpdate({ uuid: sessionData.uuid }, Object.assign(Object.assign({}, sessionData), { userId, organizationId: project.organizationId }), { new: true, upsert: true });
        results.push(session);
    }
    // Only update onboarding step if it's the first organization sync (desktop connected)
    const organizationIds = [...new Set(results.map(s => s.organizationId).filter(Boolean))];
    // The previous logic was already calling updateOnboardingStep once per unique organization ID
    // found in the current batch of sessions. This is robust and handles idempotency.
    // The comments indicated this was the desired behavior.
    // Re-applying the logic means keeping it as is, as it correctly updates once per relevant organization.
    for (const orgId of organizationIds) {
        await index_3.organizationService.updateOnboardingStep(orgId, organization_interfaces_1.OnboardingStep.DESKTOP_CONNECTED);
    }
    return results;
};
exports.syncSessions = syncSessions;
const getTodaySessions = async (userId, projectId) => {
    const startOfDay = (0, moment_1.default)().startOf('day').valueOf();
    const endOfDay = (0, moment_1.default)().endOf('day').valueOf();
    const query = {
        userId,
        startTime: { $gte: startOfDay, $lte: endOfDay }
    };
    if (projectId) {
        query.projectId = projectId;
    }
    const sessions = await session_model_1.default.find(query).sort({ startTime: 1 });
    return sessions;
};
exports.getTodaySessions = getTodaySessions;
const getAggregatedSessions = async (userId, projectId, startDate, endDate, organizationId) => {
    var _a;
    let userIds = [];
    if (userId) {
        userIds = [userId];
    }
    else if (organizationId) {
        const members = await index_3.OrganizationMember.find({ organizationId });
        userIds = members.map(m => m.userId);
    }
    if (userIds.length === 0) {
        return [];
    }
    const start = (0, moment_1.default)(startDate).startOf('day').valueOf();
    const end = (0, moment_1.default)(endDate).endOf('day').valueOf();
    const query = {
        userId: { $in: userIds },
        startTime: { $gte: start, $lte: end }
    };
    if (projectId) {
        query.projectId = projectId;
    }
    const sessions = await session_model_1.default.find(query)
        .populate('project', 'name')
        .sort({ startTime: 1 });
    // Fetch screenshots for the date range
    const screenshots = await index_2.Screenshot.find({
        userId: { $in: userIds },
        timestamp: { $gte: start, $lte: end }
    }).sort({ timestamp: 1 });
    const groupedSessions = {};
    for (const session of sessions) {
        const dayKey = (0, moment_1.default)(session.startTime).format('YYYY-MM-DD');
        // Group by day, user, and project to ensure correct breakdown
        const groupKey = `${dayKey}_${session.userId}`;
        const sessionEnd = session.endTime || Date.now();
        const duration = sessionEnd - session.startTime;
        const screenshotList = screenshots.filter((screenshot) => screenshot.sessionUuid === session.uuid && screenshot.userId === session.userId);
        if (!groupedSessions[groupKey]) {
            groupedSessions[groupKey] = {
                day: dayKey,
                projectId: session.projectId,
                projectName: ((_a = session.project) === null || _a === void 0 ? void 0 : _a.name) || 'Unknown Project',
                userId: session.userId,
                organizationId: session.organizationId,
                idleSeconds: 0,
                startTime: session.startTime,
                endTime: sessionEnd,
                duration: 0,
                activityRateSum: 0,
                sessionCount: 0,
                screenshots: [],
                appUsage: [],
                breakdown: []
            };
        }
        const agg = groupedSessions[groupKey];
        if (!agg)
            continue;
        // Update startTime to be the earliest
        if (session.startTime < agg.startTime) {
            agg.startTime = session.startTime;
        }
        // Update endTime to be the latest
        if (sessionEnd > agg.endTime) {
            agg.endTime = sessionEnd;
        }
        if (session.appUsage && session.appUsage.length > 0) {
            agg.appUsage = [...agg.appUsage, ...session.appUsage];
        }
        if (screenshotList.length > 0) {
            agg.screenshots = [...agg.screenshots, ...screenshotList];
        }
        agg.duration += duration;
        agg.idleSeconds += session.idleSeconds;
        // Calculate activity rate for this session on a 0-100% scale
        // Hubstaff calculates activity as (Active Seconds / Total Seconds).
        // Since we only have total events, we estimate activty based on "Events Per Minute".
        // We assume a threshold (e.g., 200 events/min) represents "100% usage" or continuous activity.
        const MAX_EVENTS_PER_MINUTE = 200;
        const sessionEvents = (session.keyboardEvents || 0) + (session.mouseEvents || 0);
        // duration is in ms
        const sessionDurationMinutes = duration / 60000;
        let sessionActivityRate = 0;
        if (sessionDurationMinutes > 0) {
            const eventsPerMinute = sessionEvents / sessionDurationMinutes;
            // Normalize to a percentage of the max threshold
            sessionActivityRate = (eventsPerMinute / MAX_EVENTS_PER_MINUTE) * 100;
            // Cap at 100%
            if (sessionActivityRate > 100)
                sessionActivityRate = 100;
        }
        agg.activityRateSum += sessionActivityRate;
        agg.sessionCount += 1;
        const durationInMinutes = duration / (60 * 1000);
        // Add to breakdown
        agg.breakdown.push(Object.assign(Object.assign({}, session.toJSON()), { activity: parseFloat(sessionActivityRate.toFixed(2)), duration: durationInMinutes }));
    }
    const results = Object.values(groupedSessions).map(agg => {
        // Calculate average activity rate
        let averageActivityRate = 0;
        if (agg.sessionCount > 0) {
            averageActivityRate = agg.activityRateSum / agg.sessionCount;
        }
        // Convert duration to hours for the response
        const durationInHours = agg.duration / (60 * 60 * 1000);
        return {
            day: agg.day,
            projectId: agg.projectId,
            projectName: agg.projectName,
            userId: agg.userId,
            organizationId: agg.organizationId,
            idleSeconds: agg.idleSeconds,
            startTime: agg.startTime,
            endTime: agg.endTime,
            duration: durationInHours,
            activityRate: parseFloat(averageActivityRate.toFixed(2)),
            screenshots: agg.screenshots,
            appUsage: agg.appUsage,
            breakdown: agg.breakdown
        };
    });
    return results.sort((a, b) => a.startTime - b.startTime);
};
exports.getAggregatedSessions = getAggregatedSessions;
const getUserAppUsage = async (userId, projectId, startDate, endDate) => {
    const query = { userId };
    if (projectId) {
        query.projectId = projectId;
    }
    if (startDate || endDate) {
        query.startTime = {};
        if (startDate) {
            query.startTime.$gte = (0, moment_1.default)(startDate).startOf('day').valueOf();
        }
        if (endDate) {
            query.startTime.$lte = (0, moment_1.default)(endDate).endOf('day').valueOf();
        }
        // Clean up empty object if only one was set or none
        if (Object.keys(query.startTime).length === 0) {
            delete query.startTime;
        }
    }
    const sessions = await session_model_1.default.find(query).select('appUsage');
    const allUsage = sessions.reduce((acc, session) => {
        if (session.appUsage && session.appUsage.length > 0) {
            acc.push(...session.appUsage);
        }
        return acc;
    }, []);
    return allUsage.sort((a, b) => b.timestamp - a.timestamp);
};
exports.getUserAppUsage = getUserAppUsage;
//# sourceMappingURL=session.service.js.map