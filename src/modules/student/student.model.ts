import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { toJSON } from '../toJSON';
import { paginate } from '../paginate';
import { IStudentDoc, IStudentModel } from './student.interfaces';

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
    guardianIds: {
      type: [String],
      ref: 'User',
      default: [],
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
  },
  {
    timestamps: true,
  }
);

studentSchema.plugin(toJSON);
studentSchema.plugin(paginate);
studentSchema.index({ guardianIds: 1 });

const Student = mongoose.model<IStudentDoc, IStudentModel>('Student', studentSchema);

export default Student;
