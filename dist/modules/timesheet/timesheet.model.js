"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const toJSON_1 = require("../toJSON");
const paginate_1 = require("../paginate");
const timesheetSchema = new mongoose_1.default.Schema({
    startDate: {
        type: Date,
        required: true,
    },
    endDate: {
        type: Date,
        required: true,
    },
    status: {
        type: String,
        enum: ['open', 'submitted', 'approved', 'rejected'],
        default: 'open',
    },
    submittedOn: {
        type: Date,
        required: true,
    },
    organizationId: {
        type: String,
        ref: 'Organization',
        required: true,
    },
    userId: {
        type: String,
        ref: 'User',
        required: true,
    },
    approvedBy: {
        type: String,
        ref: 'User',
    },
    approvedOn: {
        type: Date,
    },
    rejectionReason: {
        type: String,
    },
    paymentStatus: {
        type: String,
        enum: ['paid', 'notpaid', 'pending'],
        default: 'pending',
    },
}, {
    timestamps: true,
});
// add plugin that converts mongoose to json
timesheetSchema.plugin(toJSON_1.toJSON);
timesheetSchema.plugin(paginate_1.paginate);
const Timesheet = mongoose_1.default.model('Timesheet', timesheetSchema);
exports.default = Timesheet;
//# sourceMappingURL=timesheet.model.js.map