import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { toJSON } from '../toJSON';
import { paginate } from '../paginate';
import { IStudentDoc, IStudentModel } from './student.interfaces';

const studentHistorySchema = new mongoose.Schema(
  {
    fromSchool: {
      type: String,
      ref: 'School',
      default: null,
    },
    toSchool: {
      type: String,
      ref: 'School',
      default: null,
    },
    fromClassId: {
      type: String,
      ref: 'Class',
      default: null,
    },
    toClassId: {
      type: String,
      ref: 'Class',
      required: true,
    },
    action: {
      type: String,
      enum: ['created', 'promoted', 'transferred'],
      required: true,
    },
    changedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const studentSchema = new mongoose.Schema<IStudentDoc, IStudentModel>(
  {
    _id: {
      type: String,
      default: uuidv4,
    },
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    middleName: {
      type: String,
      trim: true,
      default: null,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    regNumber: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      unique: true,
    },
    stateOfOrigin: {
      type: String,
      required: true,
      trim: true,
    },
    localGovernment: {
      type: String,
      required: true,
      trim: true,
    },
    gender: {
      type: String,
      enum: ['male', 'female'],
      required: true,
    },
    dateOfBirth: {
      type: Date,
      required: true,
    },
    schoolBoard: {
      type: String,
      ref: 'SchoolBoard',
      default: null,
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
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
    promotionHistory: {
      type: [studentHistorySchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

studentSchema.plugin(toJSON);
studentSchema.plugin(paginate);

const Student = mongoose.model<IStudentDoc, IStudentModel>('Student', studentSchema);

export default Student;
