import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { toJSON } from '../toJSON';
import { paginate } from '../paginate';
import { IStudentDoc, IStudentModel } from './student.interfaces';

const guardianLinkSchema = new mongoose.Schema(
  {
    guardianId: {
      type: String,
      required: true,
      trim: true,
    },
    relationshipType: {
      type: String,
      enum: ['parent', 'caretaker'],
      required: true,
    },
    parentType: {
      type: String,
      enum: ['father', 'mother'],
      default: null,
    },
    isPrimary: {
      type: Boolean,
      default: false,
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
    avatar: {
      type: String,
      trim: true,
      default: null,
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
    guardianLinks: {
      type: [guardianLinkSchema],
      default: [],
    },
    primaryGuardianId: {
      type: String,
      trim: true,
      default: null,
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
studentSchema.index({ 'guardianLinks.guardianId': 1 });
studentSchema.index({ primaryGuardianId: 1 });

const Student = mongoose.model<IStudentDoc, IStudentModel>('Student', studentSchema);

export default Student;
