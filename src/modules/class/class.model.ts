import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { toJSON } from '../toJSON';
import { paginate } from '../paginate';
import { IClassDoc, IClassModel } from './class.interfaces';

const classSchema = new mongoose.Schema<IClassDoc, IClassModel>(
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
    code: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    schoolTypeId: {
      type: String,
      ref: 'SchoolType',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

classSchema.index({ code: 1, schoolTypeId: 1 }, { unique: true });
classSchema.plugin(toJSON);
classSchema.plugin(paginate);

const ClassModel = mongoose.model<IClassDoc, IClassModel>('Class', classSchema);

export default ClassModel;
