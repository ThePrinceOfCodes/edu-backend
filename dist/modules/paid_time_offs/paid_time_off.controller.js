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
exports.getMyUsedHours = exports.reviewPaidTimeOff = exports.getMyPaidTimeOffs = exports.getPaidTimeOffs = exports.createPaidTimeOff = void 0;
const http_status_1 = __importDefault(require("http-status"));
const index_1 = require("../utils/index");
const paidTimeOffService = __importStar(require("./paid_time_off.service"));
const index_2 = require("../errors/index");
const _1 = require(".");
const holidays_1 = require("../holidays");
const paid_time_off_interfaces_1 = require("./paid_time_off.interfaces");
exports.createPaidTimeOff = (0, index_1.catchAsync)(async (req, res) => {
    const { organizationId } = req.params;
    const { policyId, excludeWeekends, excludeHolidays, days, reason, projectId, startTime, endTime } = req.body;
    const dates = days.map((d) => new Date(d.date));
    const startDate = new Date(Math.min(...dates.map((d) => d.getTime())));
    const endDate = new Date(Math.max(...dates.map((d) => d.getTime())));
    const isValidPolicy = await _1.ptoPolicyService.isValidPTOPolicy(policyId, organizationId, startDate);
    if (!isValidPolicy)
        throw new index_2.ApiError(http_status_1.default.FORBIDDEN, 'PTO Policy not found or invalid for organization');
    const hasOverlap = await paidTimeOffService.hasOverlap({
        startDate,
        endDate,
        userId: req.account.id,
        organizationId
    });
    if (hasOverlap)
        throw new index_2.ApiError(http_status_1.default.CONFLICT, 'Paid time off overlaps with existing paid time off');
    const holidays = await holidays_1.holidayService.getHolidayDatesForRange(organizationId, startDate, endDate);
    const { enrichedDays, totalDays, totalHours } = paidTimeOffService.enrichPaidTimeOffDays({
        days,
        holidays,
        excludeWeekends,
        excludeHolidays,
    });
    const paidTimeOff = await paidTimeOffService.createPaidTimeOff({
        policyId,
        projectId,
        organizationId,
        userId: req.account.id,
        startDate,
        endDate,
        startTime,
        endTime,
        excludeWeekends,
        excludeHolidays,
        days: enrichedDays,
        totalDays,
        totalHours,
        reason,
        status: paid_time_off_interfaces_1.PaidTimeOffStatus.PENDING,
    }, req.account.id);
    res.status(http_status_1.default.CREATED).json(paidTimeOff);
});
exports.getPaidTimeOffs = (0, index_1.catchAsync)(async (req, res) => {
    const { organizationId } = req.params;
    const options = {
        sortBy: req.query['sortBy'] || 'createdAt:desc',
        limit: parseInt(req.query['limit'], 10) || 10,
        page: parseInt(req.query['page'], 10) || 1,
        populate: 'userId,reviewedBy,policyId,projectId',
    };
    const result = await paidTimeOffService.queryPaidTimeOffs(Object.assign(Object.assign({}, req.query), { organizationId }), options);
    res.send(result);
});
exports.getMyPaidTimeOffs = (0, index_1.catchAsync)(async (req, res, next) => {
    // Force the userId to be the logged-in user
    req.query['userId'] = req.account.id;
    return (0, exports.getPaidTimeOffs)(req, res, next);
});
exports.reviewPaidTimeOff = (0, index_1.catchAsync)(async (req, res) => {
    const { paidTimeOffId } = req.params;
    const { status } = req.body;
    const updateBody = {
        status,
        reviewedBy: req.account.id,
        reviewedAt: new Date(),
    };
    const paidTimeOff = await paidTimeOffService.updatePaidTimeOffById(paidTimeOffId, updateBody, req.account.id);
    res.send(paidTimeOff);
});
exports.getMyUsedHours = (0, index_1.catchAsync)(async (req, res) => {
    const { organizationId } = req.params;
    const { policyId, projectId } = req.query;
    const usedHours = await paidTimeOffService.getUsedHours({
        userId: req.account.id,
        organizationId,
        policyId,
        projectId
    });
    res.status(http_status_1.default.OK).json({ usedHours });
});
//# sourceMappingURL=paid_time_off.controller.js.map