"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAiUsage = exports.logAiUsage = exports.getInsightsToReview = exports.getUserProjectInsights = exports.updateInsightNotes = exports.runUserInsights = exports.getOrgInsights = exports.getStaffInsights = void 0;
const staffHourlyInsight_model_1 = __importDefault(require("./staffHourlyInsight.model"));
const orgHourlyInsight_model_1 = __importDefault(require("./orgHourlyInsight.model"));
const ai_services_1 = require("./ai.services");
const openai_services_1 = require("./openai.services");
const moment_timezone_1 = __importDefault(require("moment-timezone"));
const index_1 = require("../projects/index");
const aiUsage_model_1 = __importDefault(require("./aiUsage.model"));
const aiClient = new openai_services_1.OpenAIClient();
/**
 * Fetch insights for a specific user and project
 * @param projectId
 * @param userId
 * @param startDate
 * @param endDate
 * @returns
 */
const getStaffInsights = async (projectId, userId, startDate, endDate) => {
    const query = { projectId };
    if (userId) {
        query.userId = userId;
    }
    if (startDate || endDate) {
        query.startTime = {};
        if (startDate)
            query.startTime.$gte = startDate;
        if (endDate)
            query.startTime.$lte = endDate;
    }
    return staffHourlyInsight_model_1.default.find(query).sort({ startTime: -1 });
};
exports.getStaffInsights = getStaffInsights;
/**
 * Fetch organizational insights
 * @param organizationId
 * @param startDate
 * @param endDate
 * @param dayCode
 * @returns
 */
const getOrgInsights = async (organizationId, startDate, endDate, dayCode) => {
    const query = { organizationId };
    if (dayCode) {
        query.dayCode = dayCode;
    }
    if (startDate || endDate) {
        query.startTime = query.startTime || {};
        if (startDate)
            query.startTime.$gte = startDate;
        if (endDate)
            query.startTime.$lte = endDate;
    }
    return orgHourlyInsight_model_1.default.find(query).sort({ startTime: -1 });
};
exports.getOrgInsights = getOrgInsights;
/**
 * Manually run AI insights for a specific user
 * @param userId
 * @param projectId
 * @param startTime
 * @param endTime
 * @returns
 */
const runUserInsights = async (userId, projectId, startTime, endTime) => {
    // 0. Fetch the project to get organizationId
    const project = await index_1.Project.findById(projectId);
    if (!project) {
        throw new Error('Project not found');
    }
    const organizationId = project.organizationId;
    // Default to the previous full hour if not provided (e.g., from 2 hours ago to 1 hour ago)
    const resolvedStartTime = startTime || (0, moment_timezone_1.default)().subtract(1, 'hour').startOf('hour').valueOf();
    const resolvedEndTime = endTime || (0, moment_timezone_1.default)(resolvedStartTime).startOf("hour").valueOf();
    const batchId = `manual_${userId}_${(0, moment_timezone_1.default)(resolvedStartTime).format('YYYY-MM-DD-HH-mm')}`;
    // 1. Data Gathering & Transformation
    const hourlyData = await (0, ai_services_1.prepareHourlyData)(userId, resolvedStartTime, resolvedEndTime, projectId);
    if (hourlyData.summary.screenshot_count === 0 && hourlyData.summary.avg_activity === 0) {
        return { message: 'No activity found for this period', hourlyData };
    }
    // 2. AI Execution
    const llmRequest = await (0, ai_services_1.buildHourlyLLMRequest)(hourlyData);
    const response = await aiClient.generate(llmRequest.input);
    const aiResult = typeof response.data === 'string' ? JSON.parse(response.data.replace(/```json|```/g, '')) : response.data;
    // 3. Persistence (Update if exists for this batch, or create)
    const insight = await staffHourlyInsight_model_1.default.findOneAndUpdate({ userId, organizationId, startTime: new Date(resolvedStartTime) }, {
        userId,
        organizationId,
        batchId,
        projectId,
        startTime: new Date(resolvedStartTime),
        endTime: new Date(resolvedEndTime),
        hourlyData,
        aiResult
    }, { upsert: true, new: true });
    // Log AI Usage
    await (0, exports.logAiUsage)({
        organizationId,
        insightType: 'staff',
        batchId,
        userId
    }, response.usage);
    return insight;
};
exports.runUserInsights = runUserInsights;
const updateInsightNotes = async (insightId, notes) => {
    return staffHourlyInsight_model_1.default.findByIdAndUpdate(insightId, { notes }, { new: true });
};
exports.updateInsightNotes = updateInsightNotes;
/**
 * Get all insights for a user in a project within an organization
 */
const getUserProjectInsights = async (organizationId, userId, projectId, options) => {
    const filter = { organizationId, userId, projectId };
    if (options.dayCode) {
        const startOfDay = (0, moment_timezone_1.default)(options.dayCode).startOf('day').toDate();
        const endOfDay = (0, moment_timezone_1.default)(options.dayCode).endOf('day').toDate();
        filter.startTime = { $gte: startOfDay, $lte: endOfDay };
    }
    return staffHourlyInsight_model_1.default.paginate(filter, Object.assign(Object.assign({}, options), { populate: 'user,project,organization' }));
};
exports.getUserProjectInsights = getUserProjectInsights;
/**
 * Get staff with high review scores (summary view)
 */
const getInsightsToReview = async (organizationId, options) => {
    const page = options.page || 1;
    const limit = options.limit || 10;
    const skip = (page - 1) * limit;
    const match = {
        organizationId,
        'aiResult.review_score': { $gt: 0.5 }
    };
    if (options.projectId) {
        match.projectId = options.projectId;
    }
    if (options.dayCode) {
        const startOfDay = (0, moment_timezone_1.default)(options.dayCode).startOf('day').toDate();
        const endOfDay = (0, moment_timezone_1.default)(options.dayCode).endOf('day').toDate();
        match.startTime = { $gte: startOfDay, $lte: endOfDay };
    }
    const pipeline = [
        {
            $match: match
        },
        {
            $sort: { startTime: -1 }
        },
        {
            $group: {
                _id: { userId: '$userId', projectId: '$projectId' },
                latestInsight: { $first: '$$ROOT' },
                count: { $sum: 1 }
            }
        },
        {
            $facet: {
                metadata: [{ $count: 'totalResults' }],
                results: [
                    { $skip: skip },
                    { $limit: limit },
                    {
                        $project: {
                            _id: 0,
                            userId: '$_id.userId',
                            projectId: '$_id.projectId',
                            latestInsight: 1,
                            count: 1
                        }
                    }
                ]
            }
        },
        { $unwind: '$metadata' }
    ];
    const aggregated = await staffHourlyInsight_model_1.default.aggregate(pipeline);
    if (aggregated.length === 0) {
        return {
            results: [],
            page,
            limit,
            totalPages: 0,
            totalResults: 0
        };
    }
    const { metadata, results } = aggregated[0];
    const totalResults = metadata.totalResults;
    const totalPages = Math.ceil(totalResults / limit);
    // Manually populate results (since aggregate doesn't do virtuals/populate easily)
    // We only need to populate 'latestInsight.project' and 'latestInsight.user' (if applicable)
    // For now, let's just use the virtuals on the doc if we return objects, but aggregate returns raw objects.
    // We can use $lookup in aggregate if needed, but let's see if we can just return these.
    // The user wants 'project', 'organization', and 'user' populated.
    const populatedResults = await staffHourlyInsight_model_1.default.populate(results.map((r) => r.latestInsight), { path: 'project organization user' });
    const finalResults = results.map((r, i) => (Object.assign(Object.assign({}, r), { latestInsight: populatedResults[i] })));
    return {
        results: finalResults,
        page,
        limit,
        totalPages,
        totalResults
    };
};
exports.getInsightsToReview = getInsightsToReview;
/**
 * Log AI usage to the database
 */
const logAiUsage = async (params, usage) => {
    const { model } = usage, rest = __rest(usage, ["model"]);
    return aiUsage_model_1.default.create(Object.assign(Object.assign(Object.assign({}, params), rest), { aiModel: model }));
};
exports.logAiUsage = logAiUsage;
/**
 * Get AI usage logs for an organization
 */
const getAiUsage = async (organizationId, options) => {
    const filter = { organizationId };
    if (options.insightType) {
        filter.insightType = options.insightType;
    }
    if (options.startDate || options.endDate) {
        filter.createdAt = {};
        if (options.startDate)
            filter.createdAt.$gte = new Date(options.startDate);
        if (options.endDate)
            filter.createdAt.$lte = new Date(options.endDate);
    }
    // Pagination options
    const paginateOptions = {
        page: parseInt(options.page, 10) || 1,
        limit: parseInt(options.limit, 10) || 10,
        sort: { createdAt: -1 },
    };
    return aiUsage_model_1.default.paginate(filter, paginateOptions);
};
exports.getAiUsage = getAiUsage;
//# sourceMappingURL=ai.service.js.map