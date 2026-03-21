"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMemberTimesheets = exports.submitTimesheet = exports.getTimesheetSessions = exports.rejectTimesheet = exports.approveTimesheet = exports.getOwnerTimesheets = exports.updateStatus = exports.deleteTimesheet = exports.updateTimesheet = exports.getTimesheet = exports.getTimesheets = void 0;
const joi_1 = __importDefault(require("joi"));
exports.getTimesheets = {
    query: joi_1.default.object().keys({
        status: joi_1.default.string(),
        paymentStatus: joi_1.default.string(),
        sortBy: joi_1.default.string(),
        limit: joi_1.default.number().integer(),
        page: joi_1.default.number().integer(),
    }),
};
exports.getTimesheet = {
    params: joi_1.default.object().keys({
        timesheetId: joi_1.default.string().required(),
    }),
};
exports.updateTimesheet = {
    params: joi_1.default.object().keys({
        timesheetId: joi_1.default.string().required(),
    }),
    body: joi_1.default.object()
        .keys({
        startDate: joi_1.default.date(),
        endDate: joi_1.default.date(),
        status: joi_1.default.string(),
        paymentStatus: joi_1.default.string(),
        submittedOn: joi_1.default.date(),
        organizationId: joi_1.default.string(),
    })
        .min(1),
};
exports.deleteTimesheet = {
    params: joi_1.default.object().keys({
        timesheetId: joi_1.default.string().required(),
    }),
};
exports.updateStatus = {
    params: joi_1.default.object().keys({
        timesheetId: joi_1.default.string().required(),
    }),
    body: joi_1.default.object().keys({
        status: joi_1.default.string().required().valid('approved', 'rejected'),
        reason: joi_1.default.string().when('status', {
            is: 'rejected',
            then: joi_1.default.required(),
            otherwise: joi_1.default.forbidden()
        })
    }),
};
exports.getOwnerTimesheets = {
    query: joi_1.default.object().keys({
        orgId: joi_1.default.string().required(),
        status: joi_1.default.string().valid('open', 'submitted', 'approved', 'rejected'),
        dateFrom: joi_1.default.date(),
        dateTo: joi_1.default.date(),
        search: joi_1.default.string().allow(''),
        sortBy: joi_1.default.string(),
        limit: joi_1.default.number().integer(),
        page: joi_1.default.number().integer(),
    }),
};
exports.approveTimesheet = {
    params: joi_1.default.object().keys({
        timesheetId: joi_1.default.string().required(),
    }),
};
exports.rejectTimesheet = {
    params: joi_1.default.object().keys({
        timesheetId: joi_1.default.string().required(),
    }),
    body: joi_1.default.object().keys({
        reason: joi_1.default.string().required(),
    }),
};
exports.getTimesheetSessions = {
    params: joi_1.default.object().keys({
        timesheetId: joi_1.default.string().required(),
    }),
};
exports.submitTimesheet = {
    params: joi_1.default.object().keys({
        timesheetId: joi_1.default.string().required(),
    }),
};
exports.getMemberTimesheets = {
    query: joi_1.default.object().keys({
        status: joi_1.default.string(),
        dateFrom: joi_1.default.date(),
        dateTo: joi_1.default.date(),
        orgId: joi_1.default.string(),
        sortBy: joi_1.default.string(),
        limit: joi_1.default.number().integer(),
        page: joi_1.default.number().integer(),
    }),
};
//# sourceMappingURL=timesheet.validation.js.map