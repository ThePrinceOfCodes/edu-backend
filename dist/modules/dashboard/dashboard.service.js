"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDashboardData = exports.getOwnerDashboard = exports.getMemberDashboard = exports.calculateActivityScore = void 0;
const http_status_1 = __importDefault(require("http-status"));
const moment_1 = __importDefault(require("moment"));
const session_model_1 = __importDefault(require("../sessions/session.model"));
const screenshot_model_1 = __importDefault(require("../screenshots/screenshot.model"));
const project_model_1 = __importDefault(require("../projects/project.model"));
const project_member_model_1 = __importDefault(require("../projects/project_member.model"));
const organization_member_model_1 = __importDefault(require("../organizations/organization_member.model"));
// User import removed as unused
const errors_1 = require("../errors");
const organization_interfaces_1 = require("../organizations/organization.interfaces");
const calculateActivityScore = (sessions) => {
    if (!sessions.length)
        return 0;
    let totalDuration = 0; // ms
    let effectiveActive = 0; // ms
    let totalEvents = 0;
    sessions.forEach(s => {
        if (!s.startTime || !s.endTime)
            return;
        const duration = s.endTime - s.startTime;
        if (duration <= 0)
            return;
        const idle = s.idleSeconds || 0;
        const deducted = s.deductedSeconds || 0;
        const active = Math.max(0, duration - idle - deducted);
        totalDuration += duration;
        effectiveActive += active;
        totalEvents += (s.keyboardEvents || 0) + (s.mouseEvents || 0);
    });
    if (!totalDuration)
        return 0;
    // ---- Time-based activity (how much of the session was not idle)
    const timeRatio = effectiveActive / totalDuration;
    // ---- Event density
    const totalMinutes = totalDuration / 60 / 1000;
    const eventsPerMinute = totalMinutes > 0 ? totalEvents / totalMinutes : 0;
    const MAX_EVENTS_PER_MINUTE = 300;
    const eventRatio = Math.min(eventsPerMinute / MAX_EVENTS_PER_MINUTE, 1);
    // ---- Combine both signals (weighted)
    // Time = 40%, Input = 60%
    const score = (timeRatio * 0.4 + eventRatio * 0.6) * 100;
    return Math.round(score);
};
exports.calculateActivityScore = calculateActivityScore;
// --- TREND CALCULATION HELPERS ---
const calculateTrendPercentage = (current, previous) => {
    if (previous === 0)
        return current > 0 ? "+100%" : "0%";
    const diff = ((current - previous) / previous) * 100;
    return (diff >= 0 ? "+" : "") + diff.toFixed(1) + "%";
};
const formatTimeTrend = (currentSeconds, previousSeconds) => {
    const diffSeconds = Math.abs(currentSeconds - previousSeconds);
    const prefix = currentSeconds >= previousSeconds ? "+" : "-";
    const hours = Math.floor(diffSeconds / 3600);
    const minutes = Math.floor((diffSeconds % 3600) / 60);
    const seconds = Math.floor(diffSeconds % 60);
    return `${prefix}${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};
// ---------------------------------
/**
 * Get dashboard data for member
 * @param {string} organizationId
 * @param {string} userId
 * @returns {Promise<IMemberDashboard>}
 */
const getMemberDashboard = async (organizationId, userId) => {
    const startOfToday = (0, moment_1.default)().startOf('day').valueOf();
    const startOfWeek = (0, moment_1.default)().startOf('isoWeek').valueOf();
    const endOfWeek = (0, moment_1.default)().endOf('isoWeek').valueOf();
    // Metrics: Worked Week
    const weekSessions = await session_model_1.default.find({
        organizationId,
        userId,
        startTime: { $gte: startOfWeek, $lte: endOfWeek }
    });
    const workedSecondsWeek = (weekSessions.reduce((acc, session) => acc + (session.endTime ? session.endTime - session.startTime : 0) - (session.deductedSeconds || 0), 0)) / 1000;
    // Metrics: Worked Today
    const todaySessions = await session_model_1.default.find({
        organizationId,
        userId,
        startTime: { $gte: startOfToday }
    });
    const workedSecondsToday = (todaySessions.reduce((acc, session) => acc + (session.endTime ? session.endTime - session.startTime : 0) - (session.deductedSeconds || 0), 0)) / 1000;
    // --- PREVIOUS PERIODS FOR TRENDS ---
    const startOfLastWeek = (0, moment_1.default)().subtract(1, 'week').startOf('isoWeek').valueOf();
    const endOfLastWeek = (0, moment_1.default)().subtract(1, 'week').endOf('isoWeek').valueOf();
    const startOfYesterday = (0, moment_1.default)().subtract(1, 'day').startOf('day').valueOf();
    const endOfYesterday = (0, moment_1.default)().subtract(1, 'day').endOf('day').valueOf();
    const lastWeekSessions = await session_model_1.default.find({
        organizationId,
        userId,
        startTime: { $gte: startOfLastWeek, $lte: endOfLastWeek }
    });
    const workedSecondsLastWeek = (lastWeekSessions.reduce((acc, session) => acc + (session.endTime ? session.endTime - session.startTime : 0) - (session.deductedSeconds || 0), 0)) / 1000;
    const yesterdaySessions = await session_model_1.default.find({
        organizationId,
        userId,
        startTime: { $gte: startOfYesterday, $lte: endOfYesterday }
    });
    const workedSecondsYesterday = (yesterdaySessions.reduce((acc, session) => acc + (session.endTime ? session.endTime - session.startTime : 0) - (session.deductedSeconds || 0), 0)) / 1000;
    // -----------------------------------
    // Metrics: Projects Worked (Unique projects in sessions)
    const projectsWorked = new Set(weekSessions.map(s => s.projectId)).size;
    // Metrics: Earned (Need hourly rate from ProjectMember)
    // This is complex as rate might change or differ per project.
    // We will iterate sessions, find project member rate for each project, and calculate.
    let earnedWeek = 0;
    let earnedToday = 0;
    // Cache rates
    const projectRates = {};
    for (const session of weekSessions) {
        if (!projectRates[session.projectId]) {
            const pm = await project_member_model_1.default.findOne({ projectId: session.projectId, userId });
            projectRates[session.projectId] = (pm === null || pm === void 0 ? void 0 : pm.hourlyRate) || 0;
        }
        const durationHours = ((session.endTime ? session.endTime - session.startTime : 0) - (session.deductedSeconds || 0)) / 3600 / 1000;
        earnedWeek += durationHours * (projectRates[session.projectId] || 0);
        if (session.startTime >= startOfToday) {
            earnedToday += durationHours * (projectRates[session.projectId] || 0);
        }
    }
    // Chart Data Preparation (Daily)
    const dailyWorkedSeconds = [];
    const dailyActivityScores = [];
    for (let i = 0; i < 7; i++) {
        const dayStart = (0, moment_1.default)().startOf('isoWeek').add(i, 'days').valueOf();
        const dayEnd = (0, moment_1.default)().startOf('isoWeek').add(i, 'days').endOf('day').valueOf();
        const daySessions = weekSessions.filter(s => s.startTime >= dayStart && s.startTime <= dayEnd);
        const daySeconds = daySessions.reduce((acc, session) => acc + (session.endTime ? session.endTime - session.startTime : 0) - (session.deductedSeconds || 0), 0);
        dailyWorkedSeconds.push(Math.round(daySeconds / 3600 / 1000)); // Hours
        dailyActivityScores.push((0, exports.calculateActivityScore)(daySessions));
    }
    // Recent Activity (Sessions -> One Screenshot each)
    const recentSessionsForActivity = await session_model_1.default.find({ organizationId, userId })
        .sort({ startTime: -1 })
        .limit(6)
        .populate('projectId', 'name');
    const recentActivity = await Promise.all(recentSessionsForActivity.map(async (s) => {
        var _a;
        const screenshot = await screenshot_model_1.default.findOne({ sessionUuid: s.uuid });
        return {
            id: (screenshot === null || screenshot === void 0 ? void 0 : screenshot.id) || s.uuid,
            score: (0, exports.calculateActivityScore)([s]),
            project_name: ((_a = s.projectId) === null || _a === void 0 ? void 0 : _a.name) || 'Unknown Project',
            timestamp: screenshot ? new Date(screenshot.timestamp * 1000).toISOString() : new Date(s.startTime).toISOString(),
            screenshot_url: (screenshot === null || screenshot === void 0 ? void 0 : screenshot.url) || ''
        };
    }));
    // Weekly Chart
    const weeklyChart = dailyWorkedSeconds.map((val, i) => ({
        day: (0, moment_1.default)().startOf('isoWeek').add(i, 'days').format('ddd'),
        value: val
    }));
    // Timesheet (Recent sessions)
    const timesheet = await Promise.all(weekSessions
        .sort((a, b) => b.startTime - a.startTime)
        .slice(0, 5) // Sort before slicing to get the 5 most recent
        .map(async (s) => {
        const project = await project_model_1.default.findById(s.projectId);
        // Duration calculation in milliseconds, then convert to seconds
        const rawDurationMs = s.endTime ? (s.endTime - s.startTime) : 0;
        const deductedMs = (s.deductedSeconds || 0) * 1000; // Assuming deductedSeconds is in seconds
        const durationSeconds = Math.max(0, (rawDurationMs - deductedMs) / 1000);
        return {
            id: s._id,
            project: (project === null || project === void 0 ? void 0 : project.name) || 'Unknown',
            // Use moment(Number) for milliseconds
            date: (0, moment_1.default)(s.startTime).format('ddd, MMM D, YYYY'),
            start: (0, moment_1.default)(s.startTime).format('h:mm a'),
            end: s.endTime ? (0, moment_1.default)(s.endTime).format('h:mm a') : 'In progress',
            // Formatting duration
            duration: moment_1.default.utc(durationSeconds * 1000).format('H:mm:ss')
        };
    }));
    // Project Activity
    // Aggregate time per project
    const projectTimeMap = {};
    const projectSessionsMap = {};
    weekSessions.forEach(s => {
        const duration = (s.endTime ? s.endTime - s.startTime : 0) - (s.deductedSeconds || 0);
        projectTimeMap[s.projectId] = (projectTimeMap[s.projectId] || 0) + duration;
        if (!projectSessionsMap[s.projectId]) {
            projectSessionsMap[s.projectId] = [];
        }
        projectSessionsMap[s.projectId].push(s);
    });
    const projectActivity = await Promise.all(Object.keys(projectTimeMap).map(async (projectId) => {
        const project = await project_model_1.default.findById(projectId);
        return {
            id: projectId,
            name: (project === null || project === void 0 ? void 0 : project.name) || 'Unknown',
            time_spent: moment_1.default.utc((projectTimeMap[projectId] || 0)).format('H:mm:ss'),
            activity_score: (0, exports.calculateActivityScore)(projectSessionsMap[projectId] || [])
        };
    }));
    // Apps & URLs (Aggregate top 10)
    const appMap = {};
    weekSessions.forEach(s => {
        if (s.appUsage) {
            s.appUsage.forEach(a => {
                let key = '';
                let baseUrl = null;
                if (a.url) {
                    try {
                        const parsed = new URL(a.url);
                        baseUrl = `${parsed.protocol}//${parsed.host}`;
                        key = baseUrl;
                    }
                    catch (_a) {
                        key = a.url;
                        baseUrl = a.url;
                    }
                }
                else if (a.windowTitle) {
                    key = a.windowTitle;
                }
                else {
                    key = a.appName;
                }
                if (!appMap[key]) {
                    appMap[key] = {
                        appName: a.appName,
                        url: baseUrl,
                        hits: 0
                    };
                }
                appMap[key].hits++;
            });
        }
    });
    return {
        role: 'member',
        metrics: {
            worked_week: {
                value: Math.floor(workedSecondsWeek / 3600).toString().padStart(2, '0') + ':' + moment_1.default.utc(workedSecondsWeek * 1000).format('mm:ss'),
                trend: formatTimeTrend(workedSecondsWeek, workedSecondsLastWeek),
                trend_positive: workedSecondsWeek >= workedSecondsLastWeek,
                chart_data: dailyWorkedSeconds
            },
            weekly_activity: {
                value: `${(0, exports.calculateActivityScore)(weekSessions)}%`,
                trend: calculateTrendPercentage((0, exports.calculateActivityScore)(weekSessions), (0, exports.calculateActivityScore)(lastWeekSessions)),
                trend_positive: (0, exports.calculateActivityScore)(weekSessions) >= (0, exports.calculateActivityScore)(lastWeekSessions),
                chart_data: dailyActivityScores
            },
            earned_week: {
                value: `$${earnedWeek.toFixed(2)}`,
                progress: 75
            },
            projects_worked: {
                value: projectsWorked
            },
            today_activity: {
                value: `${(0, exports.calculateActivityScore)(todaySessions)}%`,
                trend: calculateTrendPercentage((0, exports.calculateActivityScore)(todaySessions), (0, exports.calculateActivityScore)(yesterdaySessions)),
                trend_positive: (0, exports.calculateActivityScore)(todaySessions) >= (0, exports.calculateActivityScore)(yesterdaySessions),
                chart_data: []
            },
            worked_today: {
                value: Math.floor(workedSecondsToday / 3600).toString().padStart(2, '0') + ':' + moment_1.default.utc(workedSecondsToday * 1000).format('mm:ss'),
                trend: formatTimeTrend(workedSecondsToday, workedSecondsYesterday),
                trend_positive: workedSecondsToday >= workedSecondsYesterday,
                chart_data: []
            },
            earned_today: {
                value: `$${earnedToday.toFixed(2)}`
            }
        },
        blocks: {
            recent_activity: recentActivity,
            weekly_chart: weeklyChart,
            timesheet: timesheet,
            project_activity: projectActivity,
            apps_urls: Object.values(appMap).sort((a, b) => b.hits - a.hits).slice(0, 10)
        }
    };
};
exports.getMemberDashboard = getMemberDashboard;
/**
 * Get dashboard data for owner/manager
 * @param {string} organizationId
 * @returns {Promise<IOwnerDashboard>}
 */
const getOwnerDashboard = async (organizationId) => {
    const startOfToday = (0, moment_1.default)().startOf('day').valueOf();
    const startOfWeek = (0, moment_1.default)().startOf('isoWeek').valueOf();
    const endOfWeek = (0, moment_1.default)().endOf('isoWeek').valueOf();
    // Fetch all sessions for organization this week
    const weekSessions = await session_model_1.default.find({
        organizationId,
        startTime: { $gte: startOfWeek, $lte: endOfWeek }
    });
    const todaySessions = weekSessions.filter(s => s.startTime >= startOfToday);
    const workedSecondsWeek = (weekSessions.reduce((acc, s) => acc + (s.endTime ? s.endTime - s.startTime : 0) - (s.deductedSeconds || 0), 0)) / 1000;
    const workedSecondsToday = (todaySessions.reduce((acc, s) => acc + (s.endTime ? s.endTime - s.startTime : 0) - (s.deductedSeconds || 0), 0)) / 1000;
    // --- PREVIOUS PERIODS FOR TEAM TRENDS ---
    const startOfLastWeek = (0, moment_1.default)().subtract(1, 'week').startOf('isoWeek').valueOf();
    const endOfLastWeek = (0, moment_1.default)().subtract(1, 'week').endOf('isoWeek').valueOf();
    const startOfYesterday = (0, moment_1.default)().subtract(1, 'day').startOf('day').valueOf();
    const endOfYesterday = (0, moment_1.default)().subtract(1, 'day').endOf('day').valueOf();
    const lastWeekSessions = await session_model_1.default.find({
        organizationId,
        startTime: { $gte: startOfLastWeek, $lte: endOfLastWeek }
    });
    const workedSecondsLastWeek = (lastWeekSessions.reduce((acc, s) => acc + (s.endTime ? s.endTime - s.startTime : 0) - (s.deductedSeconds || 0), 0)) / 1000;
    const yesterdaySessions = await session_model_1.default.find({
        organizationId,
        startTime: { $gte: startOfYesterday, $lte: endOfYesterday }
    });
    const workedSecondsYesterday = (yesterdaySessions.reduce((acc, s) => acc + (s.endTime ? s.endTime - s.startTime : 0) - (s.deductedSeconds || 0), 0)) / 1000;
    // ----------------------------------------
    const activeProjectIds = new Set(weekSessions.map(s => s.projectId));
    const activeProjectsCount = activeProjectIds.size;
    // Calculate spent
    // Ideally we batch fetch all project members needed
    let spentWeek = 0;
    let spentToday = 0;
    // This loop might be slow if many sessions, but optimizing: group by user/project first
    const userProjectPairs = new Set();
    weekSessions.forEach(s => userProjectPairs.add(`${s.userId}:${s.projectId}`));
    const rates = {};
    for (const pair of userProjectPairs) {
        const [uId, pId] = pair.split(':');
        const pm = await project_member_model_1.default.findOne({ projectId: pId, userId: uId });
        rates[pair] = (pm === null || pm === void 0 ? void 0 : pm.hourlyRate) || 0;
    }
    weekSessions.forEach(s => {
        const durationHours = ((s.endTime ? s.endTime - s.startTime : 0) - (s.deductedSeconds || 0)) / 1000 / 3600;
        const rate = rates[`${s.userId}:${s.projectId}`] || 0;
        spentWeek += durationHours * rate;
        if (s.startTime >= startOfToday) {
            spentToday += durationHours * rate;
        }
    });
    // Recent Team Activity (Sessions -> One Screenshot each)
    const recentSessionsForActivity = await session_model_1.default.find({ organizationId })
        .sort({ startTime: -1 })
        .limit(6)
        .populate('projectId', 'name')
        .populate('userId', 'name');
    const recentTeamActivity = await Promise.all(recentSessionsForActivity.map(async (s) => {
        var _a, _b;
        const screenshot = await screenshot_model_1.default.findOne({ sessionUuid: s.uuid });
        return {
            id: (screenshot === null || screenshot === void 0 ? void 0 : screenshot.id) || s.uuid,
            user_name: ((_a = s.userId) === null || _a === void 0 ? void 0 : _a.name) || 'Unknown User',
            project: ((_b = s.projectId) === null || _b === void 0 ? void 0 : _b.name) || 'Unknown Project',
            score: (0, exports.calculateActivityScore)([s]),
            time_ago: (0, moment_1.default)(s.startTime).fromNow(),
            screenshot_url: (screenshot === null || screenshot === void 0 ? void 0 : screenshot.url) || ''
        };
    }));
    // Worked Week Chart & Team Activity Chart
    const dailyWorkedSeconds = [];
    const dailyTeamActivity = [];
    for (let i = 0; i < 7; i++) {
        const dayStart = (0, moment_1.default)().startOf('isoWeek').add(i, 'days').valueOf();
        const dayEnd = (0, moment_1.default)().startOf('isoWeek').add(i, 'days').endOf('day').valueOf();
        const daySessions = weekSessions.filter(s => s.startTime >= dayStart && s.startTime <= dayEnd);
        const daySeconds = daySessions.reduce((acc, session) => acc + (session.endTime ? session.endTime - session.startTime : 0) - (session.deductedSeconds || 0), 0);
        dailyWorkedSeconds.push(Number((daySeconds / 3600 / 1000).toFixed(2)));
        dailyTeamActivity.push((0, exports.calculateActivityScore)(daySessions));
    }
    const workedWeekChart = dailyWorkedSeconds.map((val, i) => ({
        day: (0, moment_1.default)().startOf('isoWeek').add(i, 'days').format('ddd'),
        value: val
    }));
    // Members Status
    const orgMembers = await organization_member_model_1.default.find({ organizationId, role: organization_interfaces_1.OrganizationMemberRole.MEMBER }).populate('userId', 'name');
    const membersList = await Promise.all(orgMembers.map(async (m) => {
        const user = m.userId; // populated
        const userSessions = weekSessions.filter(s => s.userId === user.id);
        const userWeekSeconds = (userSessions.reduce((acc, s) => acc + (s.endTime ? s.endTime - s.startTime : 0) - (s.deductedSeconds || 0), 0)) / 1000;
        const today = todaySessions.filter(s => s.userId === user.id);
        const userTodaySeconds = (today.reduce((acc, s) => acc + (s.endTime ? s.endTime - s.startTime : 0) - (s.deductedSeconds || 0), 0)) / 1000;
        return {
            id: user.id,
            name: user.name || 'Unknown',
            status: userTodaySeconds > 0 ? "online" : 'offline',
            activity_score: (0, exports.calculateActivityScore)(userSessions),
            hours_this_week: Math.floor(userWeekSeconds / 3600).toString().padStart(2, '0') + ':' + moment_1.default.utc(userWeekSeconds * 1000).format('mm:ss')
        };
    }));
    // Project Budgets (Placeholder)
    const projectsList = await Promise.all(Array.from(activeProjectIds).map(async (pId) => {
        const p = await project_model_1.default.findById(pId);
        const projectWeekSeconds = (weekSessions
            .filter(s => s.projectId === pId)
            .reduce((acc, s) => acc + (s.endTime ? s.endTime - s.startTime : 0) - (s.deductedSeconds || 0), 0)) / 1000;
        return {
            id: pId,
            name: (p === null || p === void 0 ? void 0 : p.name) || 'Unknown',
            hours_spent: Number((projectWeekSeconds / 3600).toFixed(2)),
            budget_hours: 1000,
            progress_percent: 10 // Placeholder
        };
    }));
    // Apps & URLs (Aggregate top 10 across team)
    const appMap = {};
    weekSessions.forEach(s => {
        if (s.appUsage) {
            s.appUsage.forEach(a => {
                let key = '';
                let baseUrl = null;
                if (a.url) {
                    try {
                        const parsed = new URL(a.url);
                        baseUrl = `${parsed.protocol}//${parsed.host}`;
                        key = baseUrl;
                    }
                    catch (_a) {
                        key = a.url;
                        baseUrl = a.url;
                    }
                }
                else if (a.windowTitle) {
                    key = a.windowTitle;
                }
                else {
                    key = a.appName;
                }
                if (!appMap[key]) {
                    appMap[key] = {
                        appName: a.appName,
                        url: baseUrl,
                        hits: 0
                    };
                }
                appMap[key].hits++;
            });
        }
    });
    return {
        role: 'owner',
        metrics: {
            team_activity: {
                value: `${(0, exports.calculateActivityScore)(weekSessions)}%`,
                trend: calculateTrendPercentage((0, exports.calculateActivityScore)(weekSessions), (0, exports.calculateActivityScore)(lastWeekSessions)),
                trend_positive: (0, exports.calculateActivityScore)(weekSessions) >= (0, exports.calculateActivityScore)(lastWeekSessions),
                chart_data: dailyTeamActivity
            },
            worked_week: {
                value: Math.floor(workedSecondsWeek / 3600).toString().padStart(2, '0') + ':' + moment_1.default.utc(workedSecondsWeek * 1000).format('mm:ss'),
                // For large hours, custom format needed:
                trend: formatTimeTrend(workedSecondsWeek, workedSecondsLastWeek),
                trend_positive: workedSecondsWeek >= workedSecondsLastWeek,
                chart_data: dailyWorkedSeconds
            },
            spent_week: {
                value: `$${spentWeek.toFixed(2)}`
            },
            active_projects: {
                value: activeProjectsCount
            },
            team_today_activity: {
                value: `${(0, exports.calculateActivityScore)(todaySessions)}%`,
                trend: calculateTrendPercentage((0, exports.calculateActivityScore)(todaySessions), (0, exports.calculateActivityScore)(yesterdaySessions)),
                trend_positive: (0, exports.calculateActivityScore)(todaySessions) >= (0, exports.calculateActivityScore)(yesterdaySessions),
                chart_data: []
            },
            team_worked_today: {
                value: Math.floor(workedSecondsToday / 3600).toString().padStart(2, '0') + ':' + moment_1.default.utc(workedSecondsToday * 1000).format('mm:ss'),
                trend: formatTimeTrend(workedSecondsToday, workedSecondsYesterday),
                trend_positive: workedSecondsToday >= workedSecondsYesterday,
                chart_data: []
            },
            team_spent_today: {
                value: `$${spentToday.toFixed(2)}`
            }
        },
        blocks: {
            recent_team_activity: recentTeamActivity,
            worked_week_chart: workedWeekChart,
            projects_activity: projectsList,
            members_list: membersList,
            apps_urls: Object.values(appMap).sort((a, b) => b.hits - a.hits).slice(0, 10)
        }
    };
};
exports.getOwnerDashboard = getOwnerDashboard;
const getDashboardData = async (organizationId, userId) => {
    // Determine Role
    try {
        const orgMember = await organization_member_model_1.default.findOne({ organizationId, userId });
        if (!orgMember) {
            throw new errors_1.ApiError(http_status_1.default.FORBIDDEN, 'User is not a member of this organization');
        }
        if (orgMember.role === organization_interfaces_1.OrganizationMemberRole.OWNER || orgMember.role === organization_interfaces_1.OrganizationMemberRole.MANAGER) {
            return (0, exports.getOwnerDashboard)(organizationId);
        }
        else {
            return (0, exports.getMemberDashboard)(organizationId, userId);
        }
    }
    catch (error) {
        console.log(error);
        throw error;
    }
};
exports.getDashboardData = getDashboardData;
//# sourceMappingURL=dashboard.service.js.map