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
const projectBreakdownSchema = new mongoose_1.default.Schema({
    projectId: { type: String, ref: 'Project', required: true },
    projectName: { type: String, default: null },
    hours: { type: Number, required: true, min: 0 },
    ratePerHour: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'USD' },
    amount: { type: Number, required: true, min: 0 },
}, { _id: false });
const paymentItemSchema = new mongoose_1.default.Schema({
    userId: { type: String, ref: 'User', required: true },
    timesheetId: { type: String, ref: 'Timesheet', required: true },
    timesheetStartDate: { type: Date, required: true },
    timesheetEndDate: { type: Date, required: true },
    totalLoggedHours: { type: Number, required: true, min: 0 },
    totalHolidayHours: { type: Number, required: true, min: 0 },
    totalPtoHours: { type: Number, required: true, min: 0 },
    projectBreakdowns: { type: [projectBreakdownSchema], default: [] },
    totalAmount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'USD' },
}, { _id: false });
const paymentSchema = new mongoose_1.default.Schema({
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
    paymentItems: {
        type: [paymentItemSchema],
        default: [],
    },
    totalAmount: {
        type: Number,
        required: true,
        min: 0,
    },
    currency: {
        type: String,
        default: 'USD',
        trim: true,
        uppercase: true,
    },
    status: {
        type: String,
        enum: Object.values(payment_interfaces_1.PaymentStatus),
        default: payment_interfaces_1.PaymentStatus.PENDING,
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
}, {
    timestamps: true,
});
paymentSchema.plugin(toJSON_1.toJSON);
paymentSchema.plugin(paginate_1.paginate);
// Enforce that the same timesheet can never appear in two Payment records.
// The multikey unique index covers each element of the timesheetIds array.
paymentSchema.index({ timesheetIds: 1 }, { unique: true, sparse: true });
const Payment = mongoose_1.default.model('Payment', paymentSchema);
exports.default = Payment;
//# sourceMappingURL=payment.model.js.map