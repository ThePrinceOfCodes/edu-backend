import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { toJSON } from '../toJSON';
import { paginate } from '../paginate';
import { ISchoolBoardDoc, ISchoolBoardModel } from './schoolBoard.interfaces';

const schoolBoardSchema = new mongoose.Schema<ISchoolBoardDoc, ISchoolBoardModel>(
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
    description: {
      type: String,
      trim: true,
      default: null,
    },
    code: {
      type: String,
      trim: true,
      uppercase: true,
      unique: true,
      sparse: true,
      default: null,
    },
    superAdminUser: {
      type: String,
      ref: 'User',
      required: true,
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

schoolBoardSchema.plugin(toJSON);
schoolBoardSchema.plugin(paginate);

const SchoolBoard = mongoose.model<ISchoolBoardDoc, ISchoolBoardModel>('SchoolBoard', schoolBoardSchema);

export default SchoolBoard;
