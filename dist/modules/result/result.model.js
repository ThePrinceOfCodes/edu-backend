"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const uuid_1 = require("uuid");
const toJSON_1 = require("../toJSON");
const paginate_1 = require("../paginate");
const resultSchema = new mongoose_1.default.Schema({
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
        required: true,
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
    termId: {
        type: String,
        ref: 'Term',
        required: true,
    },
    academicSessionId: {
        type: String,
        ref: 'AcademicSession',
        required: true,
    },
    subject: {
        type: String,
        required: true,
        trim: true,
    },
    testScore: {
        type: Number,
        required: true,
        min: 0,
        max: 100,
    },
    examScore: {
        type: Number,
        required: true,
        min: 0,
        max: 100,
    },
    totalScore: {
        type: Number,
        required: true,
        min: 0,
        max: 200,
    },
    remark: {
        type: String,
        trim: true,
        default: null,
    },
    assessmentDate: {
        type: Date,
        default: Date.now,
    },
    recordedBy: {
        type: String,
        ref: 'User',
        required: true,
    },
}, {
    timestamps: true,
});
resultSchema.index({ schoolBoard: 1, school: 1, classId: 1, termId: 1, academicSessionId: 1, subject: 1 });
resultSchema.index({ student: 1, classId: 1, termId: 1, academicSessionId: 1 });
resultSchema.index({ school: 1, createdAt: -1 });
resultSchema.plugin(toJSON_1.toJSON);
resultSchema.plugin(paginate_1.paginate);
const Result = mongoose_1.default.model('Result', resultSchema);
exports.default = Result;
//# sourceMappingURL=result.model.js.map