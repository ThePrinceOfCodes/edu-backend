import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { toJSON } from '../toJSON';
import { paginate } from '../paginate';
import { IAttendanceDoc, IAttendanceModel } from './attendance.interfaces';

const attendanceSchema = new mongoose.Schema<IAttendanceDoc, IAttendanceModel>(
  {
    _id: {
      type: String,
      default: uuidv4,
    },
    student: {
      type: String,
      ref: 'Student',
      required: true,
    },
    regNumber: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    schoolId: {
      type: String,
      ref: 'School',
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['present', 'absent', 'late', 'excused'],
      required: true,
    },
    source: {
      type: String,
      trim: true,
      default: 'external-api',
    },
  },
  {
    timestamps: true,
  }
);

attendanceSchema.index({ schoolId: 1, date: 1 });
attendanceSchema.index({ student: 1, date: 1 }, { unique: true });
attendanceSchema.plugin(toJSON);
attendanceSchema.plugin(paginate);

const Attendance = mongoose.model<IAttendanceDoc, IAttendanceModel>('Attendance', attendanceSchema);

export default Attendance;
