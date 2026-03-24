import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { toJSON } from '../toJSON';
import { paginate } from '../paginate';
import { IAcademicSessionDoc, IAcademicSessionModel } from './academicSession.interfaces';

const academicSessionSchema = new mongoose.Schema<IAcademicSessionDoc, IAcademicSessionModel>(
  {
    _id: {
      type: String,
      default: uuidv4,
    },
    name: {
      type: String,
      trim: true,
      default: null,
    },
    startYear: {
      type: Number,
      required: true,
      min: 1900,
    },
    endYear: {
      type: Number,
      required: true,
      min: 1900,
    },
    schoolBoard: {
      type: String,
      ref: 'SchoolBoard',
      required: true,
    },
    isActive: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

academicSessionSchema.index({ schoolBoard: 1, startYear: 1, endYear: 1 }, { unique: true });
academicSessionSchema.plugin(toJSON);
academicSessionSchema.plugin(paginate);

const AcademicSession = mongoose.model<IAcademicSessionDoc, IAcademicSessionModel>('AcademicSession', academicSessionSchema);

export default AcademicSession;
