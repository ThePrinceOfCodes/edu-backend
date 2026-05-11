import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { toJSON } from '../toJSON';
import { paginate } from '../paginate';
import { IStudentEnrollmentDoc, IStudentEnrollmentModel } from './studentEnrollment.interfaces';

const studentEnrollmentSchema = new mongoose.Schema<IStudentEnrollmentDoc, IStudentEnrollmentModel>(
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
    schoolBoard: {
      type: String,
      ref: 'SchoolBoard',
      default: null,
    },
    school: {
      type: String,
      ref: 'School',
      required: true,
    },
    classId: {
      type: String,
      ref: 'Class',
      required: true,
    },
    academicSession: {
      type: String,
      required: true,
      trim: true,
    },
    academicSessionId: {
      type: String,
      ref: 'AcademicSession',
      default: null,
    },
    isCurrent: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

studentEnrollmentSchema.index({ student: 1, academicSession: 1 }, { unique: true });
studentEnrollmentSchema.index({ student: 1, isCurrent: 1 });
studentEnrollmentSchema.index({ school: 1, classId: 1, academicSession: 1 });
studentEnrollmentSchema.plugin(toJSON);
studentEnrollmentSchema.plugin(paginate);

const StudentEnrollment = mongoose.model<IStudentEnrollmentDoc, IStudentEnrollmentModel>(
  'StudentEnrollment',
  studentEnrollmentSchema
);

export default StudentEnrollment;