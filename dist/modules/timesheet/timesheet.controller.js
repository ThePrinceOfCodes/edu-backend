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
exports.getMemberTimesheets = exports.submitTimesheet = exports.getTimesheetSessions = exports.getOwnerTimesheets = exports.updateStatus = exports.rejectTimesheet = exports.approveTimesheet = exports.deleteTimesheet = exports.updateTimesheet = exports.getTimesheet = exports.getTimesheets = void 0;
const http_status_1 = __importDefault(require("http-status"));
const utils_1 = require("../utils");
const errors_1 = require("../errors");
const timesheetService = __importStar(require("./timesheet.service"));
const pick_1 = __importDefault(require("../utils/pick"));
exports.getTimesheets = (0, utils_1.catchAsync)(async (req, res) => {
    var _a;
    const filter = (0, pick_1.default)(req.query, ['status']);
    const options = (0, pick_1.default)(req.query, ['sortBy', 'limit', 'page']);
    const result = await timesheetService.queryTimesheets(filter, options, (_a = req.account) === null || _a === void 0 ? void 0 : _a.id);
    res.send(result);
});
exports.getTimesheet = (0, utils_1.catchAsync)(async (req, res) => {
    if (typeof req.params['timesheetId'] === 'string') {
        const timesheet = await timesheetService.getTimesheetById(req.params['timesheetId']);
        if (!timesheet) {
            throw new errors_1.ApiError(http_status_1.default.NOT_FOUND, 'Timesheet not found');
        }
        res.send(timesheet);
    }
});
exports.updateTimesheet = (0, utils_1.catchAsync)(async (req, res) => {
    var _a;
    if (!((_a = req.account) === null || _a === void 0 ? void 0 : _a.id)) {
        throw new errors_1.ApiError(http_status_1.default.UNAUTHORIZED, 'Authentication required');
    }
    if (typeof req.params['timesheetId'] === 'string') {
        const timesheet = await timesheetService.updateTimesheetById(req.params['timesheetId'], req.body, req.account.id);
        res.send(timesheet);
    }
});
exports.deleteTimesheet = (0, utils_1.catchAsync)(async (req, res) => {
    var _a;
    if (!((_a = req.account) === null || _a === void 0 ? void 0 : _a.id)) {
        throw new errors_1.ApiError(http_status_1.default.UNAUTHORIZED, 'Authentication required');
    }
    if (typeof req.params['timesheetId'] === 'string') {
        await timesheetService.deleteTimesheetById(req.params['timesheetId'], req.account.id);
        res.status(http_status_1.default.NO_CONTENT).send();
    }
});
exports.approveTimesheet = (0, utils_1.catchAsync)(async (req, res) => {
    var _a;
    if (!((_a = req.account) === null || _a === void 0 ? void 0 : _a.id)) {
        throw new errors_1.ApiError(http_status_1.default.UNAUTHORIZED, 'Authentication required');
    }
    const timesheet = await timesheetService.changeStatus(req.params['timesheetId'] || "", req.account.id, 'approved');
    res.send(timesheet);
});
exports.rejectTimesheet = (0, utils_1.catchAsync)(async (req, res) => {
    var _a;
    if (!((_a = req.account) === null || _a === void 0 ? void 0 : _a.id)) {
        throw new errors_1.ApiError(http_status_1.default.UNAUTHORIZED, 'Authentication required');
    }
    const timesheet = await timesheetService.changeStatus(req.params['timesheetId'] || '', req.account.id, 'rejected', req.body.reason);
    res.send(timesheet);
});
exports.updateStatus = (0, utils_1.catchAsync)(async (req, res) => {
    if (!req.account) {
        throw new errors_1.ApiError(http_status_1.default.UNAUTHORIZED, 'Authentication required');
    }
    if (typeof req.params['timesheetId'] === 'string') {
        const timesheet = await timesheetService.changeStatus(req.params['timesheetId'], req.account.id, req.body.status, req.body.reason);
        res.send(timesheet);
    }
});
exports.getOwnerTimesheets = (0, utils_1.catchAsync)(async (req, res) => {
    var _a;
    if (!((_a = req.account) === null || _a === void 0 ? void 0 : _a.id)) {
        throw new errors_1.ApiError(http_status_1.default.UNAUTHORIZED, 'Authentication required');
    }
    const filter = (0, pick_1.default)(req.query, ['status', 'dateFrom', 'dateTo', 'orgId', 'search']);
    const options = (0, pick_1.default)(req.query, ['sortBy', 'limit', 'page']);
    const result = await timesheetService.queryOwnerTimesheets(filter, options, req.account.id);
    res.send({
        results: result.docs,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
        totalResults: result.totalDocs,
        hasPrevPage: result.hasPrevPage,
        hasNextPage: result.hasNextPage,
        prevPage: result.prevPage,
        nextPage: result.nextPage,
    });
});
exports.getTimesheetSessions = (0, utils_1.catchAsync)(async (req, res) => {
    var _a;
    if (!((_a = req.account) === null || _a === void 0 ? void 0 : _a.id)) {
        throw new errors_1.ApiError(http_status_1.default.UNAUTHORIZED, 'Authentication required');
    }
    const { timesheetId } = req.params;
    const result = await timesheetService.getTimesheetSessions(timesheetId || "", req.account.id);
    res.send(result);
});
exports.submitTimesheet = (0, utils_1.catchAsync)(async (req, res) => {
    if (!req.account) {
        throw new errors_1.ApiError(http_status_1.default.UNAUTHORIZED, 'Authentication required');
    }
    const { timesheetId } = req.params;
    const timesheet = await timesheetService.submitTimesheet(timesheetId || "", req.account.id);
    res.send(timesheet);
});
exports.getMemberTimesheets = (0, utils_1.catchAsync)(async (req, res) => {
    if (!req.account) {
        throw new errors_1.ApiError(http_status_1.default.UNAUTHORIZED, 'Authentication required');
    }
    const filter = (0, pick_1.default)(req.query, ['status', 'dateFrom', 'dateTo', 'orgId']);
    const options = (0, pick_1.default)(req.query, ['sortBy', 'limit', 'page']);
    const result = await timesheetService.queryMemberTimesheets(filter, options, req.account.id);
    // Ensure paginated response structure
    res.send({
        results: result.docs,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
        totalResults: result.totalDocs,
    });
});
//# sourceMappingURL=timesheet.controller.js.map