import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { toJSON } from '../toJSON';
import { paginate } from '../paginate';
import { ITermDoc, ITermModel } from './term.interfaces';

const termSchema = new mongoose.Schema<ITermDoc, ITermModel>(
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
    termName: {
      type: String,
      required: true,
      trim: true,
    },
    academicSessionId: {
      type: String,
      ref: 'AcademicSession',
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
      default: null,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
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

termSchema.index({ schoolBoard: 1, school: 1, termName: 1, academicSessionId: 1 }, { unique: true });
termSchema.index({ schoolBoard: 1, school: 1, isActive: 1 });
termSchema.plugin(toJSON);
termSchema.plugin(paginate);

const Term = mongoose.model<ITermDoc, ITermModel>('Term', termSchema);

export default Term;
