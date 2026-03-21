"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPaymentBatch = exports.getPaymentBatches = exports.executePaymentBatch = exports.createPaymentBatch = exports.getPayment = exports.getPayments = exports.processPayment = exports.getPaymentTimesheets = void 0;
const joi_1 = __importDefault(require("joi"));
const projectBreakdownSchema = joi_1.default.object({
    projectId: joi_1.default.string().required(),
    projectName: joi_1.default.string().allow(null, '').optional(),
    hours: joi_1.default.number().min(0).required(),
    ratePerHour: joi_1.default.number().min(0).required(),
    currency: joi_1.default.string().optional(),
    amount: joi_1.default.number().min(0).required(),
});
const paymentItemSchema = joi_1.default.object({
    userId: joi_1.default.string().required(),
    timesheetId: joi_1.default.string().required(),
    timesheetStartDate: joi_1.default.date().required(),
    timesheetEndDate: joi_1.default.date().required(),
    totalLoggedHours: joi_1.default.number().min(0).required(),
    totalHolidayHours: joi_1.default.number().min(0).required(),
    totalPtoHours: joi_1.default.number().min(0).required(),
    projectBreakdowns: joi_1.default.array().items(projectBreakdownSchema).default([]),
    totalAmount: joi_1.default.number().min(0).required(),
    currency: joi_1.default.string().optional(),
});
exports.getPaymentTimesheets = {
    query: joi_1.default.object().keys({
        orgId: joi_1.default.string().required(),
        dateFrom: joi_1.default.date().optional(),
        dateTo: joi_1.default.date().optional(),
        paymentStatus: joi_1.default.string().valid('paid', 'notpaid').optional(),
    }),
};
exports.processPayment = {
    body: joi_1.default.object().keys({
        organizationId: joi_1.default.string().required(),
        timesheetId: joi_1.default.string().required(),
        paymentItems: paymentItemSchema.required(),
        totalAmount: joi_1.default.number().min(0).required(),
        currency: joi_1.default.string().optional().default('USD'),
        notes: joi_1.default.string().allow('', null).optional(),
    }),
};
exports.getPayments = {
    query: joi_1.default.object().keys({
        orgId: joi_1.default.string().required(),
        sortBy: joi_1.default.string().optional(),
        limit: joi_1.default.number().integer().optional(),
        page: joi_1.default.number().integer().optional(),
    }),
};
exports.getPayment = {
    params: joi_1.default.object().keys({
        paymentId: joi_1.default.string().required(),
    }),
};
// ---------------------------------------------------------------------------
// Batch Payment
// ---------------------------------------------------------------------------
exports.createPaymentBatch = {
    body: joi_1.default.object().keys({
        organizationId: joi_1.default.string().required(),
        timesheetIds: joi_1.default.array().items(joi_1.default.string()).min(1).required(),
        dateRange: joi_1.default.object({
            startDate: joi_1.default.date().required(),
            endDate: joi_1.default.date().required(),
        }).optional(),
        currency: joi_1.default.string().optional().default('USD'),
        notes: joi_1.default.string().allow('', null).optional(),
    }),
};
exports.executePaymentBatch = {
    params: joi_1.default.object().keys({
        batchId: joi_1.default.string().required(),
    }),
};
exports.getPaymentBatches = {
    query: joi_1.default.object().keys({
        orgId: joi_1.default.string().required(),
        sortBy: joi_1.default.string().optional(),
        limit: joi_1.default.number().integer().optional(),
        page: joi_1.default.number().integer().optional(),
        status: joi_1.default.string().valid('pending', 'processing', 'completed', 'partial', 'failed').optional(),
        dateFrom: joi_1.default.date().optional(),
        dateTo: joi_1.default.date().optional(),
        currency: joi_1.default.string().optional(),
    }),
};
exports.getPaymentBatch = {
    params: joi_1.default.object().keys({
        batchId: joi_1.default.string().required(),
    }),
};
//# sourceMappingURL=payment.validation.js.map