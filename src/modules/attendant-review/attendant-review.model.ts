import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { paginate } from '../paginate';
import { toJSON } from '../toJSON';
import { IAttendantReviewDoc, IAttendantReviewModel } from './attendant-review.interfaces';

const attendantReviewSchema = new mongoose.Schema<IAttendantReviewDoc, IAttendantReviewModel>(
  {
    _id: {
      type: String,
      default: uuidv4,
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
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    parsedAttempt: {
      type: mongoose.Schema.Types.Mixed,
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
  },
  { timestamps: true }
);

attendantReviewSchema.plugin(toJSON);
attendantReviewSchema.plugin(paginate);

const AttendantReview = mongoose.model<IAttendantReviewDoc, IAttendantReviewModel>('AttendantReview', attendantReviewSchema);

export default AttendantReview;
