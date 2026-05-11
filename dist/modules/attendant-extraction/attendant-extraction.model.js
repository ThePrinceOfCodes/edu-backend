"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const uuid_1 = require("uuid");
const paginate_1 = require("../paginate");
const toJSON_1 = require("../toJSON");
const attendantExtractionSchema = new mongoose_1.default.Schema({
    _id: {
        type: String,
        default: uuid_1.v4,
    },
    createdBy: {
        type: String,
        ref: 'User',
        default: null,
    },
    imagePath: {
        type: String,
        trim: true,
    },
    originalImagePath: {
        type: String,
        required: true,
        trim: true,
    },
    mimeType: {
        type: String,
        required: true,
        trim: true,
    },
    schoolId: {
        type: String,
        required: true,
        ref: 'School',
    },
    termId: {
        type: String,
        ref: 'Term',
    },
    academicSessionId: {
        type: String,
        ref: 'AcademicSession',
    },
    startDate: {
        type: Date,
        required: true,
    },
    endDate: {
        type: Date,
        required: true,
    },
    preprocessedImagePath: {
        type: String,
        trim: true,
    },
    rawOcrJson: {
        type: mongoose_1.default.Schema.Types.Mixed,
    },
    rawText: {
        type: String,
    },
    parsedJson: {
        type: mongoose_1.default.Schema.Types.Mixed,
    },
    documentAiRawOutput: {
        type: mongoose_1.default.Schema.Types.Mixed,
    },
    documentAiText: {
        type: String,
    },
    documentAiLayoutSummary: {
        type: mongoose_1.default.Schema.Types.Mixed,
    },
    llmRawResponse: {
        type: String,
    },
    llmExtractedOutput: {
        type: mongoose_1.default.Schema.Types.Mixed,
    },
    humanCorrectedOutput: {
        type: mongoose_1.default.Schema.Types.Mixed,
        default: null,
    },
    validationErrors: {
        type: [String],
        default: [],
    },
    provider: {
        type: String,
        trim: true,
    },
    model: {
        type: String,
        trim: true,
    },
    approvalMeta: {
        type: mongoose_1.default.Schema.Types.Mixed,
    },
    exportedAt: {
        type: Date,
    },
    status: {
        type: String,
        enum: ['uploaded', 'queued', 'processing', 'ocr_completed', 'llm_extracted', 'validation_failed', 'pending_review', 'corrected', 'approved', 'exported', 'failed'],
        default: 'uploaded',
        required: true,
    },
    error: {
        type: String,
        trim: true,
    },
    processingMeta: {
        type: mongoose_1.default.Schema.Types.Mixed,
    },
    createdAttendanceIds: {
        type: [String],
        default: [],
    },
    pendingReviewIds: {
        type: [String],
        default: [],
    },
}, { timestamps: true });
attendantExtractionSchema.plugin(toJSON_1.toJSON);
attendantExtractionSchema.plugin(paginate_1.paginate);
const AttendantExtraction = mongoose_1.default.model('AttendantExtraction', attendantExtractionSchema);
exports.default = AttendantExtraction;
//# sourceMappingURL=attendant-extraction.model.js.map