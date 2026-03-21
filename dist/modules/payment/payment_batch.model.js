"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const uuid_1 = require("uuid");
const toJSON_1 = require("../toJSON");
const paginate_1 = require("../paginate");
const payment_interfaces_1 = require("./payment.interfaces");
const dateRangeSchema = new mongoose_1.default.Schema({
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
}, { _id: false });
const paymentBatchSchema = new mongoose_1.default.Schema({
    _id: {
        type: String,
        default: uuid_1.v4,
    },
    organizationId: {
        type: String,
        ref: 'Organization',
        required: true,
        index: true,
    },
    initiatedBy: {
        type: String,
        ref: 'User',
        required: true,
    },
    timesheetIds: {
        type: [String],
        ref: 'Timesheet',
        required: true,
    },
    dateRange: {
        type: dateRangeSchema,
        required: false,
        default: undefined,
    },
    createdOn: {
        type: Date,
        required: true,
        default: () => new Date(),
    },
    status: {
        type: String,
        enum: Object.values(payment_interfaces_1.BatchPaymentStatus),
        default: payment_interfaces_1.BatchPaymentStatus.PENDING,
    },
    totalTimesheets: {
        type: Number,
        required: true,
        min: 0,
        default: 0,
    },
    processedCount: {
        type: Number,
        required: true,
        min: 0,
        default: 0,
    },
    failedCount: {
        type: Number,
        required: true,
        min: 0,
        default: 0,
    },
    totalAmount: {
        type: Number,
        required: true,
        min: 0,
        default: 0,
    },
    currency: {
        type: String,
        default: 'USD',
        trim: true,
        uppercase: true,
    },
    notes: {
        type: String,
        trim: true,
        default: null,
    },
    processedAt: {
        type: Date,
        default: null,
    },
    paymentIds: {
        type: [String],
        ref: 'Payment',
        default: [],
    },
}, {
    timestamps: true,
});
paymentBatchSchema.plugin(toJSON_1.toJSON);
paymentBatchSchema.plugin(paginate_1.paginate);
const PaymentBatch = mongoose_1.default.model('PaymentBatch', paymentBatchSchema);
exports.default = PaymentBatch;
//# sourceMappingURL=payment_batch.model.js.map