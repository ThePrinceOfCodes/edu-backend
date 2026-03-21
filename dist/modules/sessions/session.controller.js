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
exports.getAppUsage = exports.getAggregatedSessions = exports.getTodaySessions = exports.syncSessions = void 0;
const http_status_1 = __importDefault(require("http-status"));
const index_1 = require("../utils/index");
const sessionService = __importStar(require("./session.service"));
const index_2 = require("../errors/index");
exports.syncSessions = (0, index_1.catchAsync)(async (req, res) => {
    if (!req.account)
        throw new index_2.ApiError(http_status_1.default.FORBIDDEN, 'Access denied');
    // Check if body is array
    let sessions = Array.isArray(req.body) ? req.body : [req.body];
    // Map activity_logs to appUsage if present
    sessions = sessions.map((session) => {
        if (session.activityLogs) {
            session.appUsage = session.activityLogs;
            delete session.activityLogs;
        }
        return session;
    });
    const results = await sessionService.syncSessions(sessions, req.account.id);
    res.status(http_status_1.default.OK).send(results);
});
exports.getTodaySessions = (0, index_1.catchAsync)(async (req, res) => {
    if (!req.account)
        throw new index_2.ApiError(http_status_1.default.FORBIDDEN, 'Access denied');
    const projectId = req.query['projectId'];
    const results = await sessionService.getTodaySessions(req.account.id, projectId);
    res.send(results);
});
exports.getAggregatedSessions = (0, index_1.catchAsync)(async (req, res) => {
    if (!req.account)
        throw new index_2.ApiError(http_status_1.default.FORBIDDEN, 'Access denied');
    const userId = req.query['userId'];
    const organizationId = req.query['organizationId'];
    const startDate = req.query['startDate'];
    const endDate = req.query['endDate'];
    const projectId = req.query['projectId'];
    const results = await sessionService.getAggregatedSessions(userId, projectId, startDate, endDate, organizationId);
    res.send(results);
});
exports.getAppUsage = (0, index_1.catchAsync)(async (req, res) => {
    if (!req.account)
        throw new index_2.ApiError(http_status_1.default.FORBIDDEN, 'Access denied');
    const userId = req.query['userId'] || req.account.id;
    const projectId = req.query['projectId'];
    const startDate = req.query['startDate'];
    const endDate = req.query['endDate'];
    const results = await sessionService.getUserAppUsage(userId, projectId, startDate, endDate);
    res.send(results);
});
//# sourceMappingURL=session.controller.js.map