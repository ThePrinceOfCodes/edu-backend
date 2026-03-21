"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../../modules/auth");
const validate_1 = require("../../modules/validate");
const payment_1 = require("../../modules/payment");
const router = express_1.default.Router();
/**
 * GET  /payment-timesheets
 *   → Fetch all approved timesheets with enriched payment data
 *     (total logged hours, holiday hours, PTO hours, per-project rate breakdowns)
 */
router
    .route('/')
    .get(auth_1.authenticate, (0, validate_1.validate)(payment_1.paymentValidation.getPaymentTimesheets), payment_1.paymentController.getPaymentTimesheets);
/**
 * POST /payment-timesheets/process
 *   → Create a payment record for a batch of approved timesheets
 */
router
    .route('/process')
    .post(auth_1.authenticate, (0, validate_1.validate)(payment_1.paymentValidation.processPayment), payment_1.paymentController.processPayment);
/**
 * GET  /payment-timesheets/payments
 *   → List all saved payment records for an organisation
 */
router
    .route('/payments')
    .get(auth_1.authenticate, (0, validate_1.validate)(payment_1.paymentValidation.getPayments), payment_1.paymentController.getPayments);
/**
 * GET  /payment-timesheets/payments/:paymentId
 *   → Retrieve a single payment record
 */
router
    .route('/payments/:paymentId')
    .get(auth_1.authenticate, (0, validate_1.validate)(payment_1.paymentValidation.getPayment), payment_1.paymentController.getPayment);
/**
 * POST /payment-timesheets/batch
 *   → Create a PENDING PaymentBatch for a set of approved timesheets
 * GET  /payment-timesheets/batch
 *   → List all payment batch records for an organisation
 */
router
    .route('/batch')
    .post(auth_1.authenticate, (0, validate_1.validate)(payment_1.paymentValidation.createPaymentBatch), payment_1.paymentController.createPaymentBatch)
    .get(auth_1.authenticate, (0, validate_1.validate)(payment_1.paymentValidation.getPaymentBatches), payment_1.paymentController.getPaymentBatches);
/**
 * GET   /payment-timesheets/batch/:batchId
 *   → Retrieve a single payment batch record
 * PATCH /payment-timesheets/batch/:batchId
 *   → Execute (process) a PENDING batch — marks all linked payments COMPLETED
 */
router
    .route('/batch/:batchId')
    .get(auth_1.authenticate, (0, validate_1.validate)(payment_1.paymentValidation.getPaymentBatch), payment_1.paymentController.getPaymentBatch)
    .patch(auth_1.authenticate, (0, validate_1.validate)(payment_1.paymentValidation.executePaymentBatch), payment_1.paymentController.executePaymentBatch);
/**
 * POST /payment-timesheets/batch/:batchId/process
 *   → Execute a PENDING batch — marks all linked payments COMPLETED (POST alias)
 */
router
    .route('/batch/:batchId/process')
    .post(auth_1.authenticate, (0, validate_1.validate)(payment_1.paymentValidation.executePaymentBatch), payment_1.paymentController.executePaymentBatch);
exports.default = router;
//# sourceMappingURL=payment.route.js.map