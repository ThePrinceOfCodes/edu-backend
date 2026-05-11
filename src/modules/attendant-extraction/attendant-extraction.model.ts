import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { paginate } from '../paginate';
import { toJSON } from '../toJSON';
import { IAttendantExtractionModel } from './attendant-extraction.interfaces';

const attendantExtractionSchema = new mongoose.Schema<any, IAttendantExtractionModel>(
  {
    _id: {
      type: String,
      default: uuidv4,
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
      type: mongoose.Schema.Types.Mixed,
    },
    rawText: {
      type: String,
    },
    parsedJson: {
      type: mongoose.Schema.Types.Mixed,
    },
    documentAiRawOutput: {
      type: mongoose.Schema.Types.Mixed,
    },
    documentAiText: {
      type: String,
    },
    documentAiLayoutSummary: {
      type: mongoose.Schema.Types.Mixed,
    },
    llmRawResponse: {
      type: String,
    },
    llmExtractedOutput: {
      type: mongoose.Schema.Types.Mixed,
    },
    humanCorrectedOutput: {
      type: mongoose.Schema.Types.Mixed,
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
      type: mongoose.Schema.Types.Mixed,
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
      type: mongoose.Schema.Types.Mixed,
    },
    createdAttendanceIds: {
      type: [String],
      default: [],
    },
    pendingReviewIds: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

attendantExtractionSchema.plugin(toJSON);
attendantExtractionSchema.plugin(paginate);

const AttendantExtraction = mongoose.model<any, IAttendantExtractionModel>(
  'AttendantExtraction',
  attendantExtractionSchema
);

export default AttendantExtraction;
