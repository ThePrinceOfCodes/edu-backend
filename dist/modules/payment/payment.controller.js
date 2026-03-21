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
exports.getPaymentBatch = exports.getPaymentBatches = exports.executePaymentBatch = exports.createPaymentBatch = exports.getPayment = exports.getPayments = exports.processPayment = exports.getPaymentTimesheets = void 0;
const http_status_1 = __importDefault(require("http-status"));
const utils_1 = require("../utils");
const errors_1 = require("../errors");
const paymentService = __importStar(require("./payment.service"));
const pick_1 = __importDefault(require("../utils/pick"));
/**
 * GET /payment-timesheets
 * Fetch all approved timesheets enriched with hours, holiday hours, PTO hours,
 * and per-project rate breakdowns.
 */
exports.getPaymentTimesheets = (0, utils_1.catchAsync)(async (req, res) => {
    var _a;
    if (!((_a = req.account) === null || _a === void 0 ? void 0 : _a.id)) {
        throw new errors_1.ApiError(http_status_1.default.UNAUTHORIZED, 'Authentication required');
    }
    const orgId = req.query['orgId'];
    if (!orgId) {
        throw new errors_1.ApiError(http_status_1.default.BAD_REQUEST, 'orgId query parameter is required');
    }
    const filters = (0, pick_1.default)(req.query, ['dateFrom', 'dateTo', 'paymentStatus']);
    const paymentIdsParam = req.query['paymentIds'];
    const paymentIds = paymentIdsParam
        ? (Array.isArray(paymentIdsParam) ? paymentIdsParam : String(paymentIdsParam).split(','))
            .map((id) => String(id).trim())
            .filter(Boolean)
        : undefined;
    const result = await paymentService.getPaymentTimesheets(orgId, req.account.id, filters, paymentIds);
    res.send(result);
});
/**
 * POST /payment-timesheets/process
 * Save a payment record for a batch of approved timesheets.
 */
exports.processPayment = (0, utils_1.catchAsync)(async (req, res) => {
    var _a;
    if (!((_a = req.account) === null || _a === void 0 ? void 0 : _a.id)) {
        throw new errors_1.ApiError(http_status_1.default.UNAUTHORIZED, 'Authentication required');
    }
    const payment = await paymentService.processPayment(req.body, req.account.id);
    res.status(http_status_1.default.CREATED).send(payment);
});
/**
 * GET /payment-timesheets/payments
 * List all payment records for an organisation.
 */
exports.getPayments = (0, utils_1.catchAsync)(async (req, res) => {
    var _a;
    if (!((_a = req.account) === null || _a === void 0 ? void 0 : _a.id)) {
        throw new errors_1.ApiError(http_status_1.default.UNAUTHORIZED, 'Authentication required');
    }
    const orgId = req.query['orgId'];
    if (!orgId) {
        throw new errors_1.ApiError(http_status_1.default.BAD_REQUEST, 'orgId query parameter is required');
    }
    const options = (0, pick_1.default)(req.query, ['page', 'limit', 'sortBy']);
    const result = await paymentService.getPayments(orgId, req.account.id, options);
    res.send(result);
});
/**
 * GET /payment-timesheets/payments/:paymentId
 * Get a single payment record by ID.
 */
exports.getPayment = (0, utils_1.catchAsync)(async (req, res) => {
    var _a;
    if (!((_a = req.account) === null || _a === void 0 ? void 0 : _a.id)) {
        throw new errors_1.ApiError(http_status_1.default.UNAUTHORIZED, 'Authentication required');
    }
    const payment = await paymentService.getPaymentById(req.params['paymentId'], req.account.id);
    res.send(payment);
});
// ---------------------------------------------------------------------------
// Batch Payment
// ---------------------------------------------------------------------------
/**
 * POST /payment-timesheets/batch
 * Create a PENDING PaymentBatch for a set of approved timesheets.
 */
exports.createPaymentBatch = (0, utils_1.catchAsync)(async (req, res) => {
    var _a;
    if (!((_a = req.account) === null || _a === void 0 ? void 0 : _a.id)) {
        throw new errors_1.ApiError(http_status_1.default.UNAUTHORIZED, 'Authentication required');
    }
    const batch = await paymentService.createPaymentBatch(req.body, req.account.id);
    res.status(http_status_1.default.CREATED).send(batch);
});
/**
 * PATCH /payment-timesheets/batch/:batchId
 * Execute a PENDING batch — marks all linked payments COMPLETED.
 */
exports.executePaymentBatch = (0, utils_1.catchAsync)(async (req, res) => {
    var _a;
    if (!((_a = req.account) === null || _a === void 0 ? void 0 : _a.id)) {
        throw new errors_1.ApiError(http_status_1.default.UNAUTHORIZED, 'Authentication required');
    }
    const batch = await paymentService.executePaymentBatch(req.params['batchId'], req.account.id);
    res.send(batch);
});
/**
 * GET /payment-timesheets/batch
 * List all payment batches for an organisation.
 */
exports.getPaymentBatches = (0, utils_1.catchAsync)(async (req, res) => {
    var _a;
    if (!((_a = req.account) === null || _a === void 0 ? void 0 : _a.id)) {
        throw new errors_1.ApiError(http_status_1.default.UNAUTHORIZED, 'Authentication required');
    }
    const orgId = req.query['orgId'];
    if (!orgId) {
        throw new errors_1.ApiError(http_status_1.default.BAD_REQUEST, 'orgId query parameter is required');
    }
    const options = (0, pick_1.default)(req.query, ['page', 'limit', 'sortBy', 'status', 'dateFrom', 'dateTo', 'currency']);
    const result = await paymentService.getPaymentBatches(orgId, req.account.id, options);
    res.send(result);
});
/**
 * GET /payment-timesheets/batch/:batchId
 * Get a single payment batch by ID.
 */
exports.getPaymentBatch = (0, utils_1.catchAsync)(async (req, res) => {
    var _a;
    if (!((_a = req.account) === null || _a === void 0 ? void 0 : _a.id)) {
        throw new errors_1.ApiError(http_status_1.default.UNAUTHORIZED, 'Authentication required');
    }
    const batch = await paymentService.getPaymentBatchById(req.params['batchId'], req.account.id);
    res.send(batch);
});
//# sourceMappingURL=payment.controller.js.map