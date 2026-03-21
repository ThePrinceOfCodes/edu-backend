"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const uuid_1 = require("uuid");
const index_1 = require("../toJSON/index");
const hourlyBatchSchema = new mongoose_1.default.Schema({
    _id: {
        type: String,
        default: uuid_1.v4,
    },
    batchId: {
        type: String,
        required: true,
        index: true,
        unique: true,
    },
    organizationId: {
        type: String,
        required: true,
        index: true,
    },
    staffIds: [String],
    totalCount: {
        type: Number,
        default: 0,
    },
    completedCount: {
        type: Number,
        default: 0,
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'failed'],
        default: 'pending',
    },
}, {
    timestamps: true,
});
hourlyBatchSchema.plugin(index_1.toJSON);
const HourlyBatch = mongoose_1.default.model('HourlyBatch', hourlyBatchSchema);
exports.default = HourlyBatch;
//# sourceMappingURL=hourlyBatch.model.js.map