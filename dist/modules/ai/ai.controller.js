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
exports.getAiUsage = exports.triggerOrgNarrative = exports.updateInsightNotes = exports.getUserProjectInsights = exports.getInsightsToReview = exports.runUserInsights = exports.getOrgInsights = exports.getStaffInsights = void 0;
const http_status_1 = __importDefault(require("http-status"));
const index_1 = require("../utils/index");
const aiService = __importStar(require("./ai.service"));
const index_2 = require("../errors/index");
const index_3 = require("../scheduler/index");
exports.getStaffInsights = (0, index_1.catchAsync)(async (req, res) => {
    const projectId = req.query['projectId'];
    const userId = req.query['userId'];
    const startDate = req.query['startDate'] ? new Date(req.query['startDate']) : undefined;
    const endDate = req.query['endDate'] ? new Date(req.query['endDate']) : undefined;
    if (!projectId) {
        throw new index_2.ApiError(http_status_1.default.BAD_REQUEST, 'projectId is required');
    }
    const insights = await aiService.getStaffInsights(projectId, userId, startDate, endDate);
    res.status(http_status_1.default.OK).send(insights);
});
exports.getOrgInsights = (0, index_1.catchAsync)(async (req, res) => {
    var _a;
    // Assuming organizationId is available in req.account or passed via query
    const organizationId = req.query['organizationId'] || ((_a = req.account) === null || _a === void 0 ? void 0 : _a.organizationId);
    const dayCode = req.query['dayCode'];
    const startDate = req.query['startDate'] ? new Date(req.query['startDate']) : undefined;
    const endDate = req.query['endDate'] ? new Date(req.query['endDate']) : undefined;
    if (!organizationId) {
        throw new index_2.ApiError(http_status_1.default.BAD_REQUEST, 'organizationId is required');
    }
    const insights = await aiService.getOrgInsights(organizationId, startDate, endDate, dayCode);
    res.status(http_status_1.default.OK).send(insights);
});
exports.runUserInsights = (0, index_1.catchAsync)(async (req, res) => {
    const { userId, projectId, startTime, endTime } = req.body;
    const insights = await aiService.runUserInsights(userId, projectId, startTime, endTime);
    res.status(http_status_1.default.CREATED).send(insights);
});
exports.getInsightsToReview = (0, index_1.catchAsync)(async (req, res) => {
    var _a;
    const organizationId = req.query['organizationId'] || ((_a = req.account) === null || _a === void 0 ? void 0 : _a.organizationId);
    const page = parseInt(req.query['page'], 10) || 1;
    const limit = parseInt(req.query['limit'], 10) || 10;
    const dayCode = req.query['dayCode'];
    const projectId = req.query['projectId'];
    if (!organizationId) {
        throw new index_2.ApiError(http_status_1.default.BAD_REQUEST, 'organizationId is required');
    }
    const result = await aiService.getInsightsToReview(organizationId, { page, limit, dayCode, projectId });
    res.status(http_status_1.default.OK).send(result);
});
exports.getUserProjectInsights = (0, index_1.catchAsync)(async (req, res) => {
    var _a;
    const organizationId = req.query['organizationId'] || ((_a = req.account) === null || _a === void 0 ? void 0 : _a.organizationId);
    const userId = req.query['userId'];
    const projectId = req.query['projectId'];
    const page = parseInt(req.query['page'], 10) || 1;
    const limit = parseInt(req.query['limit'], 10) || 10;
    const dayCode = req.query['dayCode'];
    if (!organizationId || !userId || !projectId) {
        throw new index_2.ApiError(http_status_1.default.BAD_REQUEST, 'organizationId, userId, and projectId are required');
    }
    const result = await aiService.getUserProjectInsights(organizationId, userId, projectId, { page, limit, dayCode });
    res.status(http_status_1.default.OK).send(result);
});
exports.updateInsightNotes = (0, index_1.catchAsync)(async (req, res) => {
    const { insightId } = req.params;
    const { notes } = req.body;
    if (!insightId) {
        throw new index_2.ApiError(http_status_1.default.BAD_REQUEST, 'insightId is required');
    }
    const insight = await aiService.updateInsightNotes(insightId, notes);
    res.status(http_status_1.default.OK).send(insight);
});
exports.triggerOrgNarrative = (0, index_1.catchAsync)(async (req, res) => {
    const { organizationId, batchId } = req.body;
    if (!organizationId || !batchId) {
        throw new index_2.ApiError(http_status_1.default.BAD_REQUEST, 'organizationId and batchId are required');
    }
    await index_3.agenda.now('generate-org-narrative', {
        organizationId,
        batchId,
    });
    res.status(http_status_1.default.ACCEPTED).send({ message: 'Org narrative trigger event initiated successfully' });
});
exports.getAiUsage = (0, index_1.catchAsync)(async (req, res) => {
    var _a;
    const organizationId = req.query['organizationId'] || ((_a = req.account) === null || _a === void 0 ? void 0 : _a.organizationId);
    const { insightType, startDate, endDate, page, limit } = req.query;
    if (!organizationId) {
        throw new index_2.ApiError(http_status_1.default.BAD_REQUEST, 'organizationId is required');
    }
    const usage = await aiService.getAiUsage(organizationId, { insightType, startDate, endDate, page, limit });
    res.status(http_status_1.default.OK).send(usage);
});
//# sourceMappingURL=ai.controller.js.map