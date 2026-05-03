import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { toJSON } from '../toJSON';
import { paginate } from '../paginate';
import { ISchoolDoc, ISchoolModel } from './school.interfaces';

const schoolSchema = new mongoose.Schema<ISchoolDoc, ISchoolModel>(
  {
    _id: {
      type: String,
      default: uuidv4,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    schoolBoard: {
      type: String,
      ref: 'SchoolBoard',
      default: null,
    },
    schoolTypes: {
      type: [String],
      ref: 'SchoolType',
      default: [],
    },
    classes: {
      type: [String],
      ref: 'Class',
      default: [],
    },
    adminUser: {
      type: String,
      ref: 'User',
      default: null,
    },
    adminUsers: {
      type: [String],
      ref: 'User',
      default: [],
    },
    address: {
      type: String,
      trim: true,
      default: null,
    },
    schoolCode: {
      type: String,
      trim: true,
      default: null,
    },
    state: {
      type: String,
      trim: true,
      default: null,
    },
    localGovernment: {
      type: String,
      trim: true,
      default: null,
    },
    district: {
      type: String,
      trim: true,
      default: null,
    },
    ward: {
      type: String,
      trim: true,
      default: null,
    },
    schoolLocation: {
      type: String,
      trim: true,
      default: null,
    },
    categoryOfSchool: {
      type: String,
      trim: true,
      default: null,
    },
    accessRoadCondition: {
      type: String,
      trim: true,
      default: null,
    },
    typeOfSchool: {
      type: String,
      trim: true,
      default: null,
    },
    shiftSystem: {
      type: String,
      trim: true,
      default: null,
    },
    facilitiesAvailable: {
      type: String,
      trim: true,
      default: null,
    },
    headTeacherName: {
      type: String,
      trim: true,
      default: null,
    },
    headTeacherPhoneNumber: {
      type: String,
      trim: true,
      default: null,
    },
    assistantHeadTeacherName: {
      type: String,
      trim: true,
      default: null,
    },
    assistantHeadTeacherPhoneNumber: {
      type: String,
      trim: true,
      default: null,
    },
    longitude: {
      type: Number,
      default: null,
    },
    latitude: {
      type: Number,
      default: null,
    },
    numberOfClasses: {
      type: Number,
      default: null,
    },
    numberOfClassroomsAvailable: {
      type: Number,
      default: null,
    },
    numberOfAcademicStaff: {
      type: Number,
      default: null,
    },
    numberOfNonAcademicStaff: {
      type: Number,
      default: null,
    },
    totalEnrolledStudents: {
      type: Number,
      default: null,
    },
    gallery: {
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

schoolSchema.index({ schoolBoard: 1, name: 1 }, { unique: true });
schoolSchema.plugin(toJSON);
schoolSchema.plugin(paginate);

const School = mongoose.model<ISchoolDoc, ISchoolModel>('School', schoolSchema);

export default School;
