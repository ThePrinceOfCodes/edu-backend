"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const uuid_1 = require("uuid");
const toJSON_1 = require("../toJSON");
const paginate_1 = require("../paginate");
const studentEnrollmentSchema = new mongoose_1.default.Schema({
    _id: {
        type: String,
        default: uuid_1.v4,
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
}, {
    timestamps: true,
});
studentEnrollmentSchema.index({ student: 1, academicSession: 1 }, { unique: true });
studentEnrollmentSchema.index({ student: 1, isCurrent: 1 });
studentEnrollmentSchema.index({ school: 1, classId: 1, academicSession: 1 });
studentEnrollmentSchema.plugin(toJSON_1.toJSON);
studentEnrollmentSchema.plugin(paginate_1.paginate);
const StudentEnrollment = mongoose_1.default.model('StudentEnrollment', studentEnrollmentSchema);
exports.default = StudentEnrollment;
//# sourceMappingURL=studentEnrollment.model.js.map