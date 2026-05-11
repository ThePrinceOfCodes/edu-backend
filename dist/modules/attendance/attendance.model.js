"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const uuid_1 = require("uuid");
const toJSON_1 = require("../toJSON");
const paginate_1 = require("../paginate");
const attendanceSchema = new mongoose_1.default.Schema({
    _id: {
        type: String,
        default: uuid_1.v4,
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
}, {
    timestamps: true,
});
attendanceSchema.index({ schoolId: 1, date: 1 });
attendanceSchema.index({ student: 1, date: 1 }, { unique: true });
attendanceSchema.plugin(toJSON_1.toJSON);
attendanceSchema.plugin(paginate_1.paginate);
const Attendance = mongoose_1.default.model('Attendance', attendanceSchema);
exports.default = Attendance;
//# sourceMappingURL=attendance.model.js.map