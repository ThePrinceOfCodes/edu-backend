"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const uuid_1 = require("uuid");
const index_1 = require("../toJSON/index");
const index_2 = require("../paginate/index");
const aiUsageSchema = new mongoose_1.default.Schema({
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
        index: true,
    },
    userId: {
        type: String,
        index: true,
    },
    insightType: {
        type: String,
        enum: ['staff', 'org'],
        required: true,
        index: true,
    },
    provider: {
        type: String,
        required: true,
    },
    aiModel: {
        type: String,
        required: true,
    },
    inputTokens: {
        type: Number,
        required: true,
    },
    outputTokens: {
        type: Number,
        required: true,
    },
    totalTokens: {
        type: Number,
        required: true,
    },
    estimatedCostUSD: {
        type: Number,
        required: true,
    },
}, {
    timestamps: { createdAt: true, updatedAt: false },
});
aiUsageSchema.plugin(index_1.toJSON);
aiUsageSchema.plugin(index_2.paginate);
const AiUsage = mongoose_1.default.model('AiUsage', aiUsageSchema);
exports.default = AiUsage;
//# sourceMappingURL=aiUsage.model.js.map