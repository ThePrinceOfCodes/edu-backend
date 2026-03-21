"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const uuid_1 = require("uuid");
const index_1 = require("../toJSON/index");
const orgHourlyInsightSchema = new mongoose_1.default.Schema({
    _id: {
        type: String,
        default: uuid_1.v4,
    },
    organizationId: {
        type: String,
        required: true,
        index: true,
    },
    batchId: {
        type: String,
        required: true,
        index: true,
    },
    dayCode: {
        type: String,
        required: true,
        index: true,
    },
    startTime: {
        type: Date,
        required: true,
    },
    endTime: {
        type: Date,
        required: true,
    },
    executiveSummary: {
        type: String,
        required: true,
    },
    integrityStatus: {
        type: String,
        enum: ['stable', 'warning', 'critical'],
        required: true,
    },
    distribution: {
        sustained: { type: Number, default: 0 },
        fragmented: { type: Number, default: 0 },
        idle: { type: Number, default: 0 },
    },
    signals: {
        fragmentedCount: { type: Number, default: 0 },
        idleCount: { type: Number, default: 0 },
    },
    stats: {
        type: Object,
    },
    flaggedStaff: [
        {
            type: String,
        },
    ],
}, {
    timestamps: true,
});
orgHourlyInsightSchema.index({ organizationId: 1, dayCode: 1 }, { unique: true });
orgHourlyInsightSchema.plugin(index_1.toJSON);
const OrgHourlyInsight = mongoose_1.default.model('OrgHourlyInsight', orgHourlyInsightSchema);
exports.default = OrgHourlyInsight;
//# sourceMappingURL=orgHourlyInsight.model.js.map