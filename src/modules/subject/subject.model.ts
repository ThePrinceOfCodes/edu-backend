import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { toJSON } from '../toJSON';
import { paginate } from '../paginate';
import { ISubjectDoc, ISubjectModel } from './subject.interfaces';

const subjectSchema = new mongoose.Schema<ISubjectDoc, ISubjectModel>(
  {
    _id: {
      type: String,
      default: uuidv4,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    code: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      unique: true,
    },
  },
  {
    timestamps: true,
  }
);

subjectSchema.plugin(toJSON);
subjectSchema.plugin(paginate);

const Subject = mongoose.model<ISubjectDoc, ISubjectModel>('Subject', subjectSchema);

export default Subject;
