import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { paginate } from '../paginate';
import { toJSON } from '../toJSON';
import { IAttendantExtractionDoc, IAttendantExtractionModel } from './attendant-extraction.interfaces';

const attendantExtractionSchema = new mongoose.Schema<IAttendantExtractionDoc, IAttendantExtractionModel>(
  {
    _id: {
      type: String,
      default: uuidv4,
    },
    imagePath: {
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
      required: true,
      ref: 'Term',
    },
    academicSessionId: {
      type: String,
      required: true,
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
    status: {
      type: String,
      enum: ['uploaded', 'queued', 'processing', 'parsed', 'attendance_created', 'needs_review', 'failed'],
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

const AttendantExtraction = mongoose.model<IAttendantExtractionDoc, IAttendantExtractionModel>(
  'AttendantExtraction',
  attendantExtractionSchema
);

export default AttendantExtraction;
