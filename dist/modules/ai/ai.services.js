"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.prepareHourlyData = exports.buildHourlyLLMRequest = exports.sampleScreenshotsAcrossHour = exports.isVisuallyDistinct = exports.buildHourlyPrompt = exports.withRetry = exports.buildLLMImageInputs = exports.downloadImageAsBase64 = void 0;
const axios_1 = __importDefault(require("axios"));
const moment_1 = __importDefault(require("moment"));
const bottleneck_1 = __importDefault(require("bottleneck"));
const session_model_1 = __importDefault(require("../sessions/session.model"));
const screenshot_model_1 = __importDefault(require("../screenshots/screenshot.model"));
const constants_1 = require("./constants");
const limiter = new bottleneck_1.default({
    minTime: 2000,
    reservoir: 10,
    reservoirRefreshAmount: 10,
    reservoirRefreshInterval: 60 * 1000 // refresh every 60 seconds
});
async function downloadImageAsBase64(url, token) {
    var _a;
    const headers = {};
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    try {
        const res = await axios_1.default.get(url, {
            responseType: 'arraybuffer',
            timeout: 10000,
            headers,
        });
        return Buffer.from(res.data).toString('base64');
    }
    catch (err) {
        const status = (_a = err === null || err === void 0 ? void 0 : err.response) === null || _a === void 0 ? void 0 : _a.status;
        console.warn(`[AI] Failed to download image (status ${status !== null && status !== void 0 ? status : 'unknown'}): ${url}`);
        return null;
    }
}
exports.downloadImageAsBase64 = downloadImageAsBase64;
async function buildLLMImageInputs(screenshots, token) {
    const selected = screenshots.slice(0, 12); // enforce cap
    const results = await Promise.all(selected.map(async (s) => {
        const base64 = await downloadImageAsBase64(s.full_url, token);
        if (!base64)
            return null;
        return {
            type: 'image_url',
            image_url: {
                url: `data:image/webp;base64,${base64}`,
            },
        };
    }));
    return results.filter((item) => item !== null);
}
exports.buildLLMImageInputs = buildLLMImageInputs;
async function withRetry(fn, maxRetries = 5) {
    var _a, _b, _c, _d, _e;
    let attempt = 0;
    let lastError;
    while (attempt <= maxRetries) {
        try {
            return await limiter.schedule(() => fn());
        }
        catch (err) {
            lastError = err;
            const status = (err === null || err === void 0 ? void 0 : err.status) || ((_a = err === null || err === void 0 ? void 0 : err.response) === null || _a === void 0 ? void 0 : _a.status) || ((_d = (_c = (_b = err === null || err === void 0 ? void 0 : err.response) === null || _b === void 0 ? void 0 : _b.data) === null || _c === void 0 ? void 0 : _c.error) === null || _d === void 0 ? void 0 : _d.status);
            if (![429, 408, 500, 502, 503, 504].includes(status)) {
                throw err;
            }
            // Extract retry delay from headers if available
            let delay = Math.min(Math.pow(2, attempt) * 1000, 30000) + Math.random() * 1000;
            const headers = (err === null || err === void 0 ? void 0 : err.headers) || ((_e = err === null || err === void 0 ? void 0 : err.response) === null || _e === void 0 ? void 0 : _e.headers);
            if (headers) {
                const retryAfterMs = headers['retry-after-ms'] || headers['x-ratelimit-reset-tokens-ms'];
                const retryAfter = headers['retry-after'] || headers['x-ratelimit-reset-tokens'];
                if (retryAfterMs) {
                    delay = Math.max(delay, parseInt(retryAfterMs, 10));
                }
                else if (retryAfter) {
                    const seconds = parseFloat(retryAfter);
                    if (!isNaN(seconds)) {
                        delay = Math.max(delay, seconds * 1000);
                    }
                    else if (typeof retryAfter === 'string' && (retryAfter.includes('m') || retryAfter.includes('s'))) {
                        const match = retryAfter.match(/(?:(\d+)m)?(?:([\d.]+)s)?(?:([\d.]+)ms)?/);
                        if (match) {
                            const m = parseInt(match[1] || '0', 10);
                            const s = parseFloat(match[2] || '0');
                            const ms = parseFloat(match[3] || '0');
                            delay = Math.max(delay, (m * 60 + s) * 1000 + ms);
                        }
                    }
                }
            }
            // If it was a 429, add a safety buffer
            if (status === 429) {
                delay += 2000 + Math.random() * 3000;
            }
            console.warn(`[AI Retry] status ${status} on attempt ${attempt + 1}. Waiting ${Math.round(delay)}ms...`);
            await new Promise(r => setTimeout(r, delay));
            attempt++;
        }
    }
    throw lastError;
}
exports.withRetry = withRetry;
function buildHourlyPrompt(hourlyData, reviewedCount) {
    return `
Analyze the following one-hour work window.

Context:
- This window contains one or more activity sessions.
- Context switching is normal at this timescale.
- Keyboard and mouse metrics are approximate indicators only.

Time Window:
- Start: ${hourlyData.start}
- End: ${hourlyData.end}

Aggregated Metrics:
- Number of slots: ${hourlyData.slots.length}
- Avg overall activity: ${hourlyData.summary.avg_activity.toFixed(1)}
- Min activity: ${hourlyData.summary.min_activity.toFixed(1)}
- Max activity: ${hourlyData.summary.max_activity.toFixed(1)}
- Avg keyboard activity: ${hourlyData.summary.avg_keyboard.toFixed(1)}
- Avg mouse activity: ${hourlyData.summary.avg_mouse.toFixed(1)}
- Total screenshots captured: ${hourlyData.summary.screenshot_count}
- Unique screen states: ${hourlyData.summary.unique_screens}
- Repeated screen ratio: ${(hourlyData.summary.repeated_screen_ratio * 100).toFixed(1)}%

Slot Breakdown (Sessions):
${hourlyData.slots.map((s, i) => `
Slot ${i + 1}:
- Time: ${s.time_slot}
- Overall activity: ${s.overall}
- Keyboard: ${s.keyboard}
- Mouse: ${s.mouse}
- Screenshots in slot: ${s.screenshots.length}
`).join('\n')}

Instructions:
- Look for trends across slots, not isolated moments.
- Highlight consistency or inconsistency between metrics and visuals.
- Identify repetition or lack of visible progress over time.
- If behavior appears normal for an hour window, state that clearly.

Required JSON response:
{
  "hourly_summary": "A concise paragraph (2-3 sentences) summarizing the hour's focus and consistency.",
  "primary_activity": "Short label of the main task (e.g., 'Email & Documents')",
  "screenshots_reviewed": ${reviewedCount},
  "activity_pattern": "Short description of the work rhythm (e.g., 'Mostly consistent', 'Highly fragmented', 'Focused')",
  "work_summary": ["Bullet point 1 detailing specific work", "Bullet point 2 detailing specific work", "Bullet point 3 detailing specific work"],
  "time_allocation": [
    {"activity": "Top Activity 1", "percentage": number},
    {"activity": "Top Activity 2", "percentage": number},
    {"activity": "Top Activity 3", "percentage": number}
  ],
  "review_score": number (A score from 0 to 1 where 0 is no review needed and 1 is review critically required. Use 0.9 for suspicious activity.),
  "review_evidence": ["Evidence 1", "Evidence 2", "Evidence 3"] (3 bullet points explaining why the review score is high. Provide these if review_score > 0.5, otherwise return an empty array),
  "primary_signal": string (Short description of the main concern if review_score > 0.5, e.g., 'Low activity detected', 'Repetitive screen states', 'Highly fragmented work rhythm'. Return null if review_score <= 0.5),
  "review_priority": "low" | "medium" | "high" (Mapping: score < 0.4 = low, 0.4-0.7 = medium, > 0.7 = high),
  "confidence": number (0 to 1),
  "patterns_observed": ["pattern 1", "pattern 2"] (Include for backward compatibility)
}
`;
}
exports.buildHourlyPrompt = buildHourlyPrompt;
function isVisuallyDistinct(a, b) {
    return (a.app !== b.app ||
        Math.abs(a.recordedAtMs - b.recordedAtMs) > 2 * 60 * 1000);
}
exports.isVisuallyDistinct = isVisuallyDistinct;
function sampleScreenshotsAcrossHour(slots, maxImages = 9) {
    if (!slots.length)
        return [];
    // 1. Flatten screenshots with slot index
    const allScreenshots = slots.flatMap((slot, slotIndex) => slot.screenshots.map((s) => (Object.assign(Object.assign({}, s), { slotIndex }))));
    if (!allScreenshots.length)
        return [];
    // 2. Sort by time
    allScreenshots.sort((a, b) => a.recordedAtMs - b.recordedAtMs);
    // 3. Split into temporal buckets
    const buckets = {
        early: [],
        middle: [],
        late: [],
    };
    const firstTime = allScreenshots[0].recordedAtMs;
    const lastTime = allScreenshots[allScreenshots.length - 1].recordedAtMs;
    const span = lastTime - firstTime || 1;
    for (const s of allScreenshots) {
        const t = (s.recordedAtMs - firstTime) / span;
        if (t < 0.33)
            buckets.early.push(s);
        else if (t < 0.66)
            buckets.middle.push(s);
        else
            buckets.late.push(s);
    }
    // 4. Sample each bucket with dedupe
    const sampled = [];
    function sampleBucket(bucket, limit) {
        for (const s of bucket) {
            if (sampled.length >= maxImages)
                break;
            const last = sampled[sampled.length - 1];
            if (!last || isVisuallyDistinct(last, s)) {
                sampled.push(s);
            }
            if (sampled.length >= limit)
                break;
        }
    }
    const perBucket = Math.ceil(maxImages / 3);
    sampleBucket(buckets.early, perBucket);
    sampleBucket(buckets.middle, perBucket * 2);
    sampleBucket(buckets.late, maxImages);
    // 5. Final safety trim
    return sampled.slice(0, maxImages);
}
exports.sampleScreenshotsAcrossHour = sampleScreenshotsAcrossHour;
async function buildHourlyLLMRequest(hourlyData, token) {
    const sampledScreenshots = sampleScreenshotsAcrossHour(hourlyData.slots);
    const prompt = buildHourlyPrompt(hourlyData, sampledScreenshots.length);
    const images = await buildLLMImageInputs(sampledScreenshots, token);
    return {
        input: [
            { role: 'system', content: constants_1.SYSTEM_PROMPT_HOURLY },
            {
                role: 'user',
                content: [
                    { type: 'text', text: prompt },
                    ...images,
                ],
            },
        ],
    };
}
exports.buildHourlyLLMRequest = buildHourlyLLMRequest;
async function prepareHourlyData(userId, startTime, endTime, projectId) {
    var _a;
    // 1. Get sessions within or overlapping the hour window
    const query = {
        userId,
        startTime: { $lt: endTime },
        $or: [{ endTime: { $gt: startTime } }, { isActive: true }]
    };
    if (projectId) {
        query.projectId = projectId;
    }
    const sessions = await session_model_1.default.find(query).lean();
    // 2. Get screenshots for these sessions
    const screenshots = await screenshot_model_1.default.find({
        sessionUuid: { $in: sessions.map(s => s.uuid) }
    }).lean();
    const slots = [];
    const overallActivities = [];
    const keyboardActivities = [];
    const mouseActivities = [];
    // 3. Use actual sessions as slots, clamped strictly to the requested hour
    const sortedSessions = sessions.sort((a, b) => a.startTime - b.startTime);
    for (const session of sortedSessions) {
        // Clamp session segment to the requested window
        const sStart = Math.max(session.startTime, startTime);
        const sEnd = Math.min(session.endTime || Date.now(), endTime);
        const segmentDurationMs = sEnd - sStart;
        if (segmentDurationMs <= 0)
            continue;
        // Find screenshots that fall within THIS session AND strictly within THIS hour segment
        const slotScreenshots = screenshots.filter(s => s.sessionUuid === session.uuid &&
            s.timestamp >= sStart &&
            s.timestamp < sEnd);
        // Find app usage for this session strictly within this hour segment
        const slotAppUsage = (session.appUsage || []).filter(u => u.timestamp >= sStart &&
            u.timestamp < sEnd);
        // Calculate activity metrics for this segment
        const sessionTotalDuration = (session.endTime || Date.now()) - session.startTime || 1;
        const proportion = segmentDurationMs / sessionTotalDuration;
        const segmentKeyboard = (session.keyboardEvents || 0) * proportion;
        const segmentMouse = (session.mouseEvents || 0) * proportion;
        const totalEvents = segmentKeyboard + segmentMouse;
        const MAX_EVENTS_PER_MINUTE = 200;
        const durationMinutes = segmentDurationMs / 60000;
        let overall = (totalEvents / durationMinutes) / MAX_EVENTS_PER_MINUTE * 100;
        let kb = (segmentKeyboard / durationMinutes) / MAX_EVENTS_PER_MINUTE * 100;
        let m = (segmentMouse / durationMinutes) / MAX_EVENTS_PER_MINUTE * 100;
        overall = Math.min(overall, 100);
        kb = Math.min(kb, 100);
        m = Math.min(m, 100);
        overallActivities.push(overall);
        keyboardActivities.push(kb);
        mouseActivities.push(m);
        slots.push({
            // Format time in UTC to match the window boundaries consistently
            time_slot: `${moment_1.default.utc(sStart).format('HH:mm')} - ${moment_1.default.utc(sEnd).format('HH:mm')} (UTC)`,
            overall: parseFloat(overall.toFixed(1)),
            keyboard: parseFloat(kb.toFixed(1)),
            mouse: parseFloat(m.toFixed(1)),
            screenshots: slotScreenshots.map(s => {
                const nearestApp = slotAppUsage.length > 0
                    ? slotAppUsage.reduce((prev, curr) => Math.abs(curr.timestamp - s.timestamp) < Math.abs(prev.timestamp - s.timestamp) ? curr : prev, slotAppUsage[0])
                    : null;
                return {
                    app: (nearestApp === null || nearestApp === void 0 ? void 0 : nearestApp.appName) || 'Unknown',
                    recordedAtMs: s.timestamp,
                    full_url: s.url
                };
            })
        });
    }
    // 4. Summarize
    const avgActivity = overallActivities.length > 0 ? overallActivities.reduce((a, b) => a + b, 0) / overallActivities.length : 0;
    const avgKb = keyboardActivities.length > 0 ? keyboardActivities.reduce((a, b) => a + b, 0) / keyboardActivities.length : 0;
    const avgMouse = mouseActivities.length > 0 ? mouseActivities.reduce((a, b) => a + b, 0) / mouseActivities.length : 0;
    // Use sampleScreenshotsAcrossHour to get visually distinct screenshots count
    const sampledDistinct = sampleScreenshotsAcrossHour(slots, 100);
    const uniqueScreens = sampledDistinct.length;
    return {
        user_id: userId,
        project_id: ((_a = sortedSessions[0]) === null || _a === void 0 ? void 0 : _a.projectId) || 'N/A',
        start: (0, moment_1.default)(startTime).toISOString(),
        end: (0, moment_1.default)(endTime).toISOString(),
        slots,
        summary: {
            avg_activity: parseFloat(avgActivity.toFixed(1)),
            min_activity: overallActivities.length > 0 ? parseFloat(Math.min(...overallActivities).toFixed(1)) : 0,
            max_activity: overallActivities.length > 0 ? parseFloat(Math.max(...overallActivities).toFixed(1)) : 0,
            avg_keyboard: parseFloat(avgKb.toFixed(1)),
            avg_mouse: parseFloat(avgMouse.toFixed(1)),
            screenshot_count: slots.reduce((acc, slot) => acc + slot.screenshots.length, 0),
            unique_screens: uniqueScreens,
            repeated_screen_ratio: (slots.reduce((acc, slot) => acc + slot.screenshots.length, 0)) > 0
                ? parseFloat((1 - (uniqueScreens / (slots.reduce((acc, slot) => acc + slot.screenshots.length, 0)))).toFixed(2))
                : 0
        }
    };
}
exports.prepareHourlyData = prepareHourlyData;
//# sourceMappingURL=ai.services.js.map