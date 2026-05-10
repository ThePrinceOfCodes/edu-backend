import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { toJSON } from '../toJSON';
import { paginate } from '../paginate';
import { IResultDoc, IResultModel } from './result.interfaces';

const resultSchema = new mongoose.Schema<IResultDoc, IResultModel>(
  {
    _id: {
      type: String,
      default: uuidv4,
    },
    student: {
      type: String,
      ref: 'Student',
      required: true,
    },
    schoolBoard: {
      type: String,
      ref: 'SchoolBoard',
      required: true,
    },
    school: {
      type: String,
      ref: 'School',
      required: true,
    },
    classId: {
      type: String,
      ref: 'Class',
      required: true,
    },
    termId: {
      type: String,
      ref: 'Term',
      required: true,
    },
    academicSessionId: {
      type: String,
      ref: 'AcademicSession',
      required: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    testScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    examScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    totalScore: {
      type: Number,
      required: true,
      min: 0,
      max: 200,
    },
    remark: {
      type: String,
      trim: true,
      default: null,
    },
    assessmentDate: {
      type: Date,
      default: Date.now,
    },
    recordedBy: {
      type: String,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

resultSchema.index({ schoolBoard: 1, school: 1, classId: 1, termId: 1, academicSessionId: 1, subject: 1 });
resultSchema.index({ student: 1, classId: 1, termId: 1, academicSessionId: 1 });
resultSchema.index({ school: 1, createdAt: -1 });
resultSchema.plugin(toJSON);
resultSchema.plugin(paginate);

const Result = mongoose.model<IResultDoc, IResultModel>('Result', resultSchema);

export default Result;
