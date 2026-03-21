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
exports.generateOrgNarrative = exports.generateStaffInsights = exports.orchestrateHourlyInsights = void 0;
const moment_timezone_1 = __importDefault(require("moment-timezone"));
const organization_model_1 = __importDefault(require("../organizations/organization.model"));
const session_model_1 = __importDefault(require("../sessions/session.model"));
const hourlyBatch_model_1 = __importDefault(require("./hourlyBatch.model"));
const staffHourlyInsight_model_1 = __importDefault(require("./staffHourlyInsight.model"));
const orgHourlyInsight_model_1 = __importDefault(require("./orgHourlyInsight.model"));
const ai_services_1 = require("./ai.services");
const openai_services_1 = require("./openai.services");
const constants_1 = require("./constants");
const aiService = __importStar(require("./ai.service"));
const operations_1 = require("../sharedb/operations");
const aiClient = new openai_services_1.OpenAIClient();
const orchestrateHourlyInsights = (agenda) => {
    agenda.define('orchestrate-hourly-insights', async (job) => {
        const { testStartTime, testEndTime } = job.attrs.data || {};
        const organizations = await organization_model_1.default.find({ enableInsights: true }).lean();
        for (const org of organizations) {
            // Default to the previous full hour
            const startTime = testStartTime || (0, moment_timezone_1.default)().subtract(1, 'hour').startOf('hour').valueOf();
            const endTime = testEndTime || (0, moment_timezone_1.default)(startTime).add(1, 'hour').valueOf();
            const batchId = `${org._id}_${(0, moment_timezone_1.default)(startTime).format('YYYY-MM-DD-HH')}`;
            // Find (user, project) pairs active during this specific hour
            const activePairs = await session_model_1.default.aggregate([
                {
                    $match: {
                        organizationId: org._id,
                        startTime: { $lt: endTime },
                        $or: [{ endTime: { $gt: startTime } }, { isActive: true }]
                    }
                },
                {
                    $group: {
                        _id: { userId: "$userId", projectId: "$projectId" }
                    }
                }
            ]);
            if (activePairs.length === 0)
                continue;
            const workItems = activePairs.map(p => ({ userId: p._id.userId, projectId: p._id.projectId }));
            // Create or update batch tracking
            await hourlyBatch_model_1.default.findOneAndUpdate({ batchId }, {
                organizationId: org._id,
                staffIds: workItems.map(w => w.userId),
                totalCount: workItems.length,
                completedCount: 0,
                status: 'pending'
            }, { upsert: true, new: true });
            // Fan-out: Schedule worker jobs for this specific (user, project) hour
            for (const item of workItems) {
                await agenda.now('generate-staff-insights', {
                    userId: item.userId,
                    projectId: item.projectId,
                    organizationId: org._id,
                    batchId,
                    startTime,
                    endTime
                });
            }
        }
    });
};
exports.orchestrateHourlyInsights = orchestrateHourlyInsights;
const generateStaffInsights = (agenda) => {
    agenda.define('generate-staff-insights', async (job) => {
        const { userId, projectId, organizationId, batchId, startTime, endTime } = job.attrs.data;
        try {
            // 1. Check for existing insight early to avoid redundant AI calls
            const existing = await staffHourlyInsight_model_1.default.findOne({ userId, projectId, batchId });
            // 2. Data Gathering & Transformation
            const hourlyData = await (0, ai_services_1.prepareHourlyData)(userId, startTime, endTime, projectId);
            if (hourlyData.summary.screenshot_count === 0) {
                // No activity (visuals) to analyze. This ensures weekends/idle time don't trigger AI calls.
                await incrementBatchCount(batchId, agenda);
                return;
            }
            if (existing) {
                console.log(`[AI Insight] Skipping AI call: ${userId}/${projectId} already has results for batch ${batchId}. Updating hourlyData only.`);
                existing.hourlyData = hourlyData;
                existing.projectId = projectId || hourlyData.project_id;
                await existing.save();
                await incrementBatchCount(batchId, agenda);
                return;
            }
            // 3. AI Execution
            const llmRequest = await (0, ai_services_1.buildHourlyLLMRequest)(hourlyData);
            // Prevent Agenda timeouts before long AI call
            await job.touch();
            const response = await aiClient.generate(llmRequest.input);
            const aiResult = typeof response.data === 'string' ? JSON.parse(response.data.replace(/```json|```/g, '')) : response.data;
            // 4. Persistence
            await staffHourlyInsight_model_1.default.create({
                userId,
                organizationId,
                batchId,
                projectId: projectId || hourlyData.project_id,
                startTime: new Date(startTime),
                endTime: new Date(endTime),
                hourlyData,
                aiResult
            });
            // Log AI Usage
            await aiService.logAiUsage({
                organizationId,
                insightType: 'staff',
                batchId,
                userId
            }, response.usage);
            // 5. Fan-in logic
            await incrementBatchCount(batchId, agenda);
        }
        catch (error) {
            console.error(`Error generating staff insights for user ${userId}:`, error);
            throw error;
        }
    });
};
exports.generateStaffInsights = generateStaffInsights;
async function incrementBatchCount(batchId, agenda) {
    const batch = await hourlyBatch_model_1.default.findOneAndUpdate({ batchId }, { $inc: { completedCount: 1 } }, { new: true });
    if (batch && batch.completedCount >= batch.totalCount) {
        await hourlyBatch_model_1.default.updateOne({ batchId }, { status: 'completed' });
        // Trigger Org Narrative Job
        await agenda.now('generate-org-narrative', {
            organizationId: batch.organizationId,
            batchId
        });
    }
}
const generateOrgNarrative = (agenda) => {
    agenda.define('generate-org-narrative', async (job) => {
        var _a;
        const { organizationId, batchId } = job.attrs.data;
        try {
            // 1. Get the date context directly from the batchId (format: {orgId}_{YYYY-MM-DD-HH})
            const dateStr = batchId.split('_').pop();
            const batchMoment = (0, moment_timezone_1.default)(dateStr, 'YYYY-MM-DD-HH');
            if (!batchMoment.isValid()) {
                console.error(`[Org Narrative] Invalid batchId format for date extraction: ${batchId}`);
                return;
            }
            const dayStart = batchMoment.clone().startOf('day').toDate();
            const dayEnd = batchMoment.clone().endOf('day').toDate();
            const dayCode = batchMoment.format('YYYY-MM-DD');
            // 2. Aggregate Data from ALL individual staff insights for the FULL DAY
            const statsArr = await staffHourlyInsight_model_1.default.aggregate([
                {
                    $match: {
                        organizationId,
                        startTime: { $gte: dayStart, $lte: dayEnd }
                    }
                },
                {
                    $group: {
                        _id: null,
                        avgConfidence: { $avg: '$aiResult.confidence' },
                        totalInsightsProduced: { $sum: 1 },
                        uniqueStaffCount: { $addToSet: '$userId' },
                        highPriorityStaff: {
                            $addToSet: {
                                $cond: [
                                    {
                                        $or: [
                                            { $eq: ['$aiResult.review_priority', 'high'] },
                                            { $gte: ['$aiResult.review_score', 0.8] }
                                        ]
                                    },
                                    '$userId',
                                    '$$REMOVE'
                                ]
                            }
                        },
                        allSummaries: { $push: { $ifNull: ['$aiResult.hourly_summary', { $arrayElemAt: ['$aiResult.work_summary', 0] }] } },
                        allPatterns: { $push: '$aiResult.patterns_observed' },
                        startTime: { $min: '$startTime' },
                        endTime: { $max: '$endTime' }
                    }
                },
                {
                    $project: {
                        avgConfidence: 1,
                        totalInsightsProduced: 1,
                        staffCount: { $size: '$uniqueStaffCount' },
                        highPriorityStaff: 1,
                        allSummaries: 1,
                        allPatterns: 1,
                        startTime: 1,
                        endTime: 1
                    }
                }
            ]);
            if (statsArr.length === 0) {
                console.warn(`[Org Narrative] No data aggregated for day ${dayCode}`);
                return;
            }
            // Notify frontend via ShareDB
            await (0, operations_1.submitOperation)('organization-naratives', organizationId, {
                status: 'processing',
                batchId,
                dayCode,
            });
            const stats = statsArr[0];
            const flattenedPatterns = stats.allPatterns.flat();
            // 3. Prepare AI Context
            const staffPerformanceDesc = stats.allSummaries
                .map((summary, i) => `Report ${i + 1}: ${summary}`)
                .join('\n');
            const prompt = `
Organization Daily Dashboard Summary Request
Date: ${dayCode}
Total Staff Observed: ${stats.staffCount}
Total Hourly Reports Processed: ${stats.totalInsightsProduced}
Avg Team Confidence Score: ${((_a = stats.avgConfidence) === null || _a === void 0 ? void 0 : _a.toFixed(1)) || 'N/A'}
Staff Flagged as High Priority: ${stats.highPriorityStaff.length}

Aggregated Hourly Summaries for the Day:
${staffPerformanceDesc}

Aggregated Patterns Observed:
${[...new Set(flattenedPatterns)].join(', ')}

Please provide a cumulative executive summary for the whole day and updated integrity signals.
`;
            // 3. Call LLM
            await job.touch();
            const response = await aiClient.generate([
                { role: 'system', content: constants_1.SYSTEM_PROMPT_ORG },
                { role: 'user', content: prompt }
            ]);
            const aiResult = typeof response.data === 'string'
                ? JSON.parse(response.data.replace(/```json|```/g, ''))
                : response.data;
            // Log AI Usage
            await aiService.logAiUsage({
                organizationId,
                insightType: 'org',
                batchId
            }, response.usage);
            // 4. Persistence - Upsert by Day (One record per day, updated every hour)
            await orgHourlyInsight_model_1.default.findOneAndUpdate({ organizationId, dayCode }, {
                organizationId,
                batchId,
                dayCode,
                startTime: stats.startTime,
                endTime: stats.endTime,
                executiveSummary: aiResult.executive_summary,
                integrityStatus: aiResult.integrity_status,
                distribution: {
                    sustained: aiResult.distribution.sustained,
                    fragmented: aiResult.distribution.fragmented,
                    idle: aiResult.distribution.idle
                },
                signals: {
                    fragmentedCount: aiResult.signals.fragmented_count,
                    idleCount: aiResult.signals.idle_count
                },
                stats: {
                    totalStaff: stats.staffCount,
                    avgConfidence: stats.avgConfidence,
                    highPriorityCount: stats.highPriorityStaff.length
                },
                flaggedStaff: stats.highPriorityStaff
            }, { upsert: true, new: true });
            // Notify frontend via ShareDB
            await (0, operations_1.submitOperation)('organization-naratives', organizationId, {
                status: 'ready',
                batchId,
                dayCode,
            }, true);
            console.log(`[Org Narrative] Completed for org ${organizationId}, batch ${batchId}`);
        }
        catch (error) {
            console.error(`Error generating org narrative for batch ${batchId}:`, error);
            throw error;
        }
    });
};
exports.generateOrgNarrative = generateOrgNarrative;
exports.default = (agenda) => {
    (0, exports.orchestrateHourlyInsights)(agenda);
    (0, exports.generateStaffInsights)(agenda);
    (0, exports.generateOrgNarrative)(agenda);
};
//# sourceMappingURL=ai.jobs.js.map