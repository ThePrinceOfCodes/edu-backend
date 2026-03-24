import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { toJSON } from '../toJSON';
import { paginate } from '../paginate';
import { ISchoolTypeDoc, ISchoolTypeModel } from './schoolType.interfaces';

const schoolTypeSchema = new mongoose.Schema<ISchoolTypeDoc, ISchoolTypeModel>(
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
  },
  {
    timestamps: true,
  }
);

schoolTypeSchema.plugin(toJSON);
schoolTypeSchema.plugin(paginate);

const SchoolType = mongoose.model<ISchoolTypeDoc, ISchoolTypeModel>('SchoolType', schoolTypeSchema);

export default SchoolType;
