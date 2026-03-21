"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const uuid_1 = require("uuid");
const index_1 = require("../toJSON/index");
const staffHourlyInsightSchema = new mongoose_1.default.Schema({
    _id: {
        type: String,
        default: uuid_1.v4,
    },
    userId: {
        type: String,
        required: true,
        index: true,
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
    projectId: {
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
    hourlyData: {
        type: Object,
        required: true,
    },
    aiResult: {
        type: Object,
        required: true,
    },
    notes: {
        type: String,
        default: '',
    },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});
staffHourlyInsightSchema.virtual('project', {
    ref: 'Project',
    localField: 'projectId',
    foreignField: '_id',
    justOne: true,
});
staffHourlyInsightSchema.virtual('organization', {
    ref: 'Organization',
    localField: 'organizationId',
    foreignField: '_id',
    justOne: true,
});
staffHourlyInsightSchema.virtual('user', {
    ref: 'User',
    localField: 'userId',
    foreignField: '_id',
    justOne: true,
});
const index_2 = require("../paginate/index");
staffHourlyInsightSchema.plugin(index_1.toJSON);
staffHourlyInsightSchema.plugin(index_2.paginate);
const StaffHourlyInsight = mongoose_1.default.model('StaffHourlyInsight', staffHourlyInsightSchema);
exports.default = StaffHourlyInsight;
//# sourceMappingURL=staffHourlyInsight.model.js.map