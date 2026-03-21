"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncHubstaffActivity = exports.fetchActivities = exports.hubstaffAnalyticsClient = void 0;
const axios_1 = __importDefault(require("axios"));
const bottleneck_1 = __importDefault(require("bottleneck"));
const moment_1 = __importDefault(require("moment"));
const project_model_1 = __importDefault(require("../projects/project.model"));
const hubstaff_access_token_model_1 = __importDefault(require("./hubstaff_access_token.model"));
const hubstaff_services_1 = require("./hubstaff.services");
const index_1 = require("../redis/index");
const config_1 = __importDefault(require("../../config/config"));
const ai_services_1 = require("../ai/ai.services");
const openai_services_1 = require("../ai/openai.services");
const anthropic_services_1 = require("../ai/anthropic.services");
const fs_1 = __importDefault(require("fs"));
const HUBSTAFF_API_URL = 'https://api.hubstaff.com/v2';
class HubstaffAnalyticsClient {
    constructor() {
        this.localLimiter = new bottleneck_1.default({
            maxConcurrent: 5,
            minTime: 200 // 5 req/s roughly
        });
    }
    /**
     * Retrieves the access token from Redis or DB, refreshing if necessary.
     */
    async getAccessToken(organizationId) {
        const key = `${config_1.default.redisBaseKey}hubstaff_access_token:${organizationId}`;
        const cachedToken = await index_1.redisClient.get(key);
        if (cachedToken) {
            return cachedToken;
        }
        const accessData = await hubstaff_access_token_model_1.default.findOne({ organizationId });
        if (!accessData) {
            throw new Error(`Hubstaff credentials not found for organization ${organizationId}`);
        }
        const now = new Date().getTime();
        let token = accessData.access_token;
        if (now > accessData.expires_in) {
            console.log(`[Hubstaff Analytics] Token expired for ${organizationId}, attempting refresh.`);
            const refreshedData = await hubstaff_services_1.hubstaffService.refreshToken(organizationId);
            if (refreshedData) {
                token = refreshedData.access_token;
            }
            else {
                throw new Error(`Failed to refresh token for organization ${organizationId}`);
            }
        }
        await index_1.redisClient.set(key, token, 'EX', 300);
        return token;
    }
    /**
     * Refreshes the access token using the refresh token from DB.
     */
    async refreshAccessToken(organizationId) {
        const lockKey = `${config_1.default.redisBaseKey}hubstaff_refresh_lock:${organizationId}`;
        const isLocked = await index_1.redisClient.set(lockKey, 'locked', 'EX', 30, 'NX');
        if (!isLocked) {
            await new Promise(resolve => setTimeout(resolve, 2000));
            return this.getAccessToken(organizationId);
        }
        try {
            const refreshedData = await hubstaff_services_1.hubstaffService.refreshToken(organizationId);
            if (!refreshedData) {
                throw new Error('Failed to refresh token');
            }
            const access_token = refreshedData.access_token;
            const key = `${config_1.default.redisBaseKey}hubstaff_access_token:${organizationId}`;
            await index_1.redisClient.set(key, access_token, 'EX', 3600);
            return access_token;
        }
        finally {
            await index_1.redisClient.del(lockKey);
        }
    }
    /**
     * Centralized request handler.
     */
    async request(organizationId, method, endpoint, opts = {}) {
        return this.localLimiter.schedule(async () => {
            var _a, _b;
            const { params, data, retryCount = 0 } = opts;
            let token = await this.getAccessToken(organizationId);
            try {
                const res = await axios_1.default.request({
                    method,
                    url: endpoint,
                    params,
                    data,
                    headers: {
                        Authorization: `Bearer ${token}`
                    },
                    timeout: 30000
                });
                return res.data;
            }
            catch (err) {
                if (((_a = err.response) === null || _a === void 0 ? void 0 : _a.status) === 401 && retryCount < 2) {
                    console.log(`[Hubstaff Analytics] 401 Unauthorized for organization ${organizationId}. Refreshing token...`);
                    await this.refreshAccessToken(organizationId);
                    return this.request(organizationId, method, endpoint, Object.assign(Object.assign({}, opts), { retryCount: retryCount + 1 }));
                }
                if (((_b = err.response) === null || _b === void 0 ? void 0 : _b.status) === 429 && retryCount < 3) {
                    const delay = 2000 * (retryCount + 1);
                    console.warn(`[Hubstaff Analytics] 429 Rate Limited. Retrying in ${delay}ms`);
                    await new Promise(r => setTimeout(r, delay));
                    return this.request(organizationId, method, endpoint, Object.assign(Object.assign({}, opts), { retryCount: retryCount + 1 }));
                }
                throw err;
            }
        });
    }
    async paginate(organizationId, endpoint, params = {}, dataKey) {
        let results = [];
        let nextStartId;
        let hasMore = true;
        while (hasMore) {
            const currentParams = Object.assign({}, params);
            if (nextStartId) {
                currentParams.page_start_id = nextStartId;
            }
            const response = await this.request(organizationId, 'get', endpoint, { params: currentParams });
            const items = response[dataKey];
            if (Array.isArray(items)) {
                results = results.concat(items);
            }
            if (response.pagination && response.pagination.next_page_start_id) {
                nextStartId = response.pagination.next_page_start_id;
            }
            else {
                hasMore = false;
            }
        }
        return results;
    }
}
exports.hubstaffAnalyticsClient = new HubstaffAnalyticsClient();
const fetchActivities = async (organizationId, hubstaffOrganizationId, hubstaffProjectId, startTime, endTime) => {
    var _a, _b, _c, _d, _e, _f;
    const activities = [];
    const screenshots = [];
    let activityCursor = null;
    do {
        let q = `page_limit=500&project_ids=${hubstaffProjectId}&time_slot[start]=${startTime}&time_slot[stop]=${endTime}`;
        if (activityCursor)
            q += `&page_start_id=${activityCursor}`;
        const res = await exports.hubstaffAnalyticsClient.request(organizationId, 'get', `${HUBSTAFF_API_URL}/organizations/${hubstaffOrganizationId}/activities?${q}`);
        if ((_a = res.activities) === null || _a === void 0 ? void 0 : _a.length) {
            activities.push(...res.activities);
        }
        activityCursor = (_c = (_b = res.pagination) === null || _b === void 0 ? void 0 : _b.next_page_start_id) !== null && _c !== void 0 ? _c : null;
    } while (activityCursor);
    if (!activities.length)
        return [];
    const userIds = Array.from(new Set(activities.map(a => a.user_id)));
    let screenshotCursor = null;
    do {
        let q = `page_limit=500&project_ids=${hubstaffProjectId}&user_ids=${userIds.join(',')}&time_slot[start]=${startTime}&time_slot[stop]=${endTime}`;
        if (screenshotCursor)
            q += `&page_start_id=${screenshotCursor}`;
        const res = await exports.hubstaffAnalyticsClient.request(organizationId, 'get', `${HUBSTAFF_API_URL}/organizations/${hubstaffOrganizationId}/screenshots?${q}`);
        if ((_d = res.screenshots) === null || _d === void 0 ? void 0 : _d.length) {
            screenshots.push(...res.screenshots.map((s) => (Object.assign(Object.assign({}, s), { recordedAtMs: new Date(s.recorded_at).getTime() }))));
        }
        screenshotCursor = (_f = (_e = res.pagination) === null || _e === void 0 ? void 0 : _e.next_page_start_id) !== null && _f !== void 0 ? _f : null;
    } while (screenshotCursor);
    const screenshotIndex = new Map();
    for (const s of screenshots) {
        const key = `${s.user_id}:${s.project_id}`;
        if (!screenshotIndex.has(key))
            screenshotIndex.set(key, []);
        screenshotIndex.get(key).push(s);
    }
    for (const list of screenshotIndex.values()) {
        list.sort((a, b) => a.recordedAtMs - b.recordedAtMs);
    }
    const TEN_MINUTES = 10 * 60 * 1000;
    return activities.map(activity => {
        const slotStart = new Date(activity.time_slot).getTime();
        const slotEnd = slotStart + TEN_MINUTES;
        const key = `${activity.user_id}:${activity.project_id}`;
        const candidates = screenshotIndex.get(key) || [];
        const matchedScreenshots = candidates.filter(s => s.recordedAtMs >= slotStart && s.recordedAtMs < slotEnd);
        return {
            user_id: activity.user_id,
            project_id: activity.project_id,
            date: activity.date,
            time_slot: activity.time_slot,
            tracked: activity.tracked,
            keyboard: activity.keyboard,
            mouse: activity.mouse,
            overall: activity.overall,
            performance: (activity.overall / (activity.input_tracked || activity.tracked)) * 100,
            screenshots: matchedScreenshots,
        };
    });
};
exports.fetchActivities = fetchActivities;
function groupActivitiesByUser(activities) {
    const map = new Map();
    for (const activity of activities) {
        const userId = activity.user_id;
        if (!map.has(userId))
            map.set(userId, []);
        map.get(userId).push(activity);
    }
    for (const slots of map.values()) {
        slots.sort((a, b) => new Date(a.time_slot).getTime() - new Date(b.time_slot).getTime());
    }
    return map;
}
const syncHubstaffActivity = async () => {
    const projects = await project_model_1.default.find({ projectType: 'analytics', status: 'active' });
    const summaryResults = [];
    for (const project of projects) {
        try {
            const organizationId = project.organizationId;
            const hubstaffProjectId = project.hubstaffProjectId;
            if (!hubstaffProjectId)
                continue;
            const accessData = await hubstaff_access_token_model_1.default.findOne({ organizationId });
            if (!accessData) {
                console.warn(`No Hubstaff credentials found for organization ${organizationId}`);
                continue;
            }
            console.log(`Processing Project ${project.name} (ID: ${project._id}, Hubstaff: ${hubstaffProjectId})`);
            const end = (0, moment_1.default)().startOf('hour');
            const start = (0, moment_1.default)(end).subtract(1, 'hour');
            const paramStart = start.toISOString();
            const paramEnd = end.toISOString();
            let hsOrgIds = accessData.hubstaff_organization_id.map(id => id.toString());
            for (const hsOrgId of hsOrgIds) {
                try {
                    console.log(`Fetching activities for Project ${hubstaffProjectId} in Org ${hsOrgId}`);
                    const activities = await (0, exports.fetchActivities)(organizationId, hsOrgId, hubstaffProjectId, paramStart, paramEnd);
                    if (!activities || !activities.length)
                        continue;
                    console.log(`Fetched ${activities.length} activities for project ${hubstaffProjectId}.`);
                    const groupedData = groupActivitiesByUser(activities);
                    const openai = new openai_services_1.OpenAIClient();
                    const anthropic = new anthropic_services_1.AnthropicClient();
                    for (const [userId, slots] of groupedData.entries()) {
                        if (!slots.length)
                            continue;
                        const summary = {
                            avg_activity: slots.reduce((acc, s) => acc + s.overall, 0) / slots.length,
                            min_activity: Math.min(...slots.map(s => s.overall)),
                            max_activity: Math.max(...slots.map(s => s.overall)),
                            avg_keyboard: slots.reduce((acc, s) => acc + s.keyboard, 0) / slots.length,
                            avg_mouse: slots.reduce((acc, s) => acc + s.mouse, 0) / slots.length,
                            screenshot_count: slots.reduce((acc, s) => acc + s.screenshots.length, 0),
                            unique_screens: slots.reduce((acc, s) => acc + s.screenshots.length, 0),
                            repeated_screen_ratio: 0,
                        };
                        const hourlyData = {
                            user_id: userId,
                            project_id: hubstaffProjectId,
                            start: paramStart,
                            end: paramEnd,
                            slots: slots,
                            summary,
                        };
                        const token = await exports.hubstaffAnalyticsClient.getAccessToken(organizationId);
                        const request = await (0, ai_services_1.buildHourlyLLMRequest)(hourlyData, token);
                        console.log(`Sending AI request for user ${userId}...`);
                        let openaiRes = null;
                        let anthropicRes = null;
                        try {
                            openaiRes = await openai.generate(request.input);
                        }
                        catch (e) {
                            console.error('OpenAI failed:', e.message);
                        }
                        try {
                            anthropicRes = await anthropic.generate(request.input);
                        }
                        catch (e) {
                            console.error('Anthropic failed:', e.message);
                        }
                        if (openaiRes || anthropicRes) {
                            summaryResults.push({
                                userId,
                                projectId: hubstaffProjectId,
                                slotTime: `${(0, moment_1.default)(paramStart).format('HH:mm')} - ${(0, moment_1.default)(paramEnd).format('HH:mm')}`,
                                openai: openaiRes ? { cost: openaiRes.usage.estimatedCostUSD, response: openaiRes.data, model: openaiRes.usage.model } : null,
                                anthropic: anthropicRes ? { cost: anthropicRes.usage.estimatedCostUSD, response: anthropicRes.data, model: anthropicRes.usage.model } : null
                            });
                        }
                    }
                    break;
                }
                catch (err) {
                    console.error(`Error processing project ${hubstaffProjectId} in org ${hsOrgId}:`, err.message);
                }
            }
        }
        catch (error) {
            console.error(`Error processing project ${project._id}:`, error);
        }
    }
    if (summaryResults.length > 0) {
        // OpenAI Stats
        const openaiTotalCost = summaryResults.reduce((acc, r) => { var _a; return acc + (((_a = r.openai) === null || _a === void 0 ? void 0 : _a.cost) || 0); }, 0);
        const openaiAvgCost = openaiTotalCost / summaryResults.length;
        // Anthropic Stats
        const anthropicTotalCost = summaryResults.reduce((acc, r) => { var _a; return acc + (((_a = r.anthropic) === null || _a === void 0 ? void 0 : _a.cost) || 0); }, 0);
        const anthropicAvgCost = anthropicTotalCost / summaryResults.length;
        const STAFF_COUNT = 2867;
        // Extrapolations
        const openaiDaily = openaiAvgCost * STAFF_COUNT * 8;
        const openaiWeekly = openaiDaily * 5;
        const openaiMonthly = openaiWeekly * 4;
        const anthropicDaily = anthropicAvgCost * STAFF_COUNT * 8;
        const anthropicWeekly = anthropicDaily * 5;
        const anthropicMonthly = anthropicWeekly * 4;
        let message = `*Hubstaff Activity Review & Benchmark Summary*\n\n`;
        message += `*Processed Users:* ${summaryResults.length}\n`;
        message += `\n### Cost Benchmark\n`;
        message += `| Metric | OpenAI (GPT-4o) | Anthropic (Sonnet 3.5) |\n`;
        message += `| :--- | :--- | :--- |\n`;
        message += `| **Batch Total** | $${openaiTotalCost.toFixed(4)} | **$${anthropicTotalCost.toFixed(4)}** |\n`;
        message += `| **Avg / User** | $${openaiAvgCost.toFixed(4)} | **$${anthropicAvgCost.toFixed(4)}** |\n`;
        message += `| **Daily (Est)** | $${openaiDaily.toFixed(2)} | **$${anthropicDaily.toFixed(2)}** |\n`;
        message += `| **Weekly (Est)** | $${openaiWeekly.toFixed(2)} | **$${anthropicWeekly.toFixed(2)}** |\n`;
        message += `| **Monthly (Est)** | $${openaiMonthly.toFixed(2)} | **$${anthropicMonthly.toFixed(2)}** |\n\n`;
        message += `*(Based on Staff Count: ${STAFF_COUNT}, 8h/day)*\n\n`;
        message += `### User Analysis Details\n`;
        summaryResults.forEach(r => {
            message += `#### User ${r.userId} (${r.projectId}) | ${r.slotTime}\n`;
            if (r.openai) {
                message += `**OpenAI** (Model: ${r.openai.model}, Cost: $${r.openai.cost.toFixed(4)}):\n`;
                message += `\`\`\`json\n${r.openai.response}\n\`\`\`\n\n`;
            }
            else {
                message += `**OpenAI**: Failed/No Data\n\n`;
            }
            if (r.anthropic) {
                message += `**Anthropic** (Model: ${r.anthropic.model}, Cost: $${r.anthropic.cost.toFixed(4)}):\n`;
                message += `\`\`\`json\n${r.anthropic.response}\n\`\`\`\n\n`;
            }
            else {
                message += `**Anthropic**: Failed/No Data\n\n`;
            }
            message += `---\n`;
        });
        // Calculate filename based on the analyzed window (previous hour)
        const end = (0, moment_1.default)().startOf('hour');
        const start = (0, moment_1.default)(end).subtract(1, 'hour');
        const filename = `hubstaff_summary_${start.format('YYYY-MM-DD')}_${start.format('HHmm')}-${end.format('HHmm')}.md`;
        console.log("------------------------------------------");
        console.log(`Writing summary to ${filename}...`);
        fs_1.default.writeFileSync(filename, message);
        console.log("------------------------------------------");
    }
};
exports.syncHubstaffActivity = syncHubstaffActivity;
//# sourceMappingURL=hubstaff.analytics.service.js.map