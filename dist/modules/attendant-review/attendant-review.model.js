"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const uuid_1 = require("uuid");
const paginate_1 = require("../paginate");
const toJSON_1 = require("../toJSON");
const attendantReviewSchema = new mongoose_1.default.Schema({
    _id: {
        type: String,
        default: uuid_1.v4,
    },
    extractionId: {
        type: String,
        required: true,
        ref: 'AttendantExtraction',
    },
    schoolId: {
        type: String,
        required: true,
        ref: 'School',
    },
    sourceImagePath: {
        type: String,
        required: true,
        trim: true,
    },
    rawRow: {
        type: mongoose_1.default.Schema.Types.Mixed,
        required: true,
    },
    parsedAttempt: {
        type: mongoose_1.default.Schema.Types.Mixed,
    },
    reason: {
        type: String,
        trim: true,
        default: '',
    },
    confidence: {
        type: Number,
        default: 0,
    },
    resolvedStudentId: {
        type: String,
        ref: 'Student',
    },
    resolvedStatus: {
        type: String,
        enum: ['pending', 'resolved', 'ignored'],
        default: 'pending',
        required: true,
    },
}, { timestamps: true });
attendantReviewSchema.plugin(toJSON_1.toJSON);
attendantReviewSchema.plugin(paginate_1.paginate);
const AttendantReview = mongoose_1.default.model('AttendantReview', attendantReviewSchema);
exports.default = AttendantReview;
//# sourceMappingURL=attendant-review.model.js.map