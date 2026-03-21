import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { toJSON } from '../toJSON';
import { paginate } from '../paginate';
import { IStaffDoc, IStaffModel } from './staff.interfaces';

const staffSchema = new mongoose.Schema<IStaffDoc, IStaffModel>(
  {
    _id: {
      type: String,
      default: uuidv4,
    },
    user: {
      type: String,
      ref: 'User',
      required: true,
      unique: true,
    },
    schoolBoard: {
      type: String,
      ref: 'SchoolBoard',
      required: true,
    },
    school: {
      type: String,
      ref: 'School',
      default: null,
    },
    employeeId: {
      type: String,
      trim: true,
      default: null,
    },
    designation: {
      type: String,
      trim: true,
      default: null,
    },
    employmentType: {
      type: String,
      enum: ['teacher', 'staff'],
      default: 'staff',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

staffSchema.plugin(toJSON);
staffSchema.plugin(paginate);

const Staff = mongoose.model<IStaffDoc, IStaffModel>('Staff', staffSchema);

export default Staff;
