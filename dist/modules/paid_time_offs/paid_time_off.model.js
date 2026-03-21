"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const uuid_1 = require("uuid");
const index_1 = require("../toJSON/index");
const index_2 = require("../paginate/index");
const paid_time_off_interfaces_1 = require("./paid_time_off.interfaces");
const paidTimeOffSchema = new mongoose_1.default.Schema({
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
    projectId: {
        type: String,
        ref: 'Project',
        required: true,
        index: true,
    },
    policyId: {
        type: String,
        ref: 'PTOPolicy',
        required: true,
        index: true,
    },
    userId: {
        type: String,
        ref: 'User',
        required: true,
        index: true,
    },
    startDate: {
        type: Date,
        required: true,
    },
    endDate: {
        type: Date,
        required: true,
    },
    startTime: {
        type: String,
        default: null,
    },
    endTime: {
        type: String,
        default: null,
    },
    days: {
        type: [
            {
                _id: false,
                date: Date,
                hours: {
                    type: Number,
                    min: 0,
                    required: true,
                },
                isHoliday: {
                    type: Boolean,
                    default: false,
                },
                isWeekend: {
                    type: Boolean,
                    default: false,
                },
            }
        ],
        required: true,
    },
    totalDays: {
        type: Number,
        required: true,
    },
    totalHours: {
        type: Number,
        required: true,
    },
    reason: {
        type: String,
        trim: true,
        default: null,
    },
    status: {
        type: String,
        enum: Object.values(paid_time_off_interfaces_1.PaidTimeOffStatus),
        default: paid_time_off_interfaces_1.PaidTimeOffStatus.PENDING,
        index: true,
    },
    reviewedBy: {
        type: String,
        ref: 'User',
        default: null,
    },
    reviewedAt: {
        type: Date,
        default: null,
    },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});
paidTimeOffSchema.plugin(index_1.toJSON);
paidTimeOffSchema.plugin(index_2.paginate);
const PaidTimeOff = mongoose_1.default.model('PaidTimeOff', paidTimeOffSchema);
exports.default = PaidTimeOff;
//# sourceMappingURL=paid_time_off.model.js.map