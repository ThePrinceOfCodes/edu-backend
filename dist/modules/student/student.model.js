"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const uuid_1 = require("uuid");
const toJSON_1 = require("../toJSON");
const paginate_1 = require("../paginate");
const studentSchema = new mongoose_1.default.Schema({
    _id: {
        type: String,
        default: uuid_1.v4,
    },
    firstName: {
        type: String,
        required: true,
        trim: true,
    },
    middleName: {
        type: String,
        trim: true,
        default: null,
    },
    lastName: {
        type: String,
        required: true,
        trim: true,
    },
    regNumber: {
        type: String,
        required: true,
        trim: true,
        uppercase: true,
        unique: true,
    },
    stateOfOrigin: {
        type: String,
        required: true,
        trim: true,
    },
    localGovernment: {
        type: String,
        required: true,
        trim: true,
    },
    gender: {
        type: String,
        enum: ['male', 'female'],
        required: true,
    },
    dateOfBirth: {
        type: Date,
        required: true,
    },
    guardianIds: {
        type: [String],
        ref: 'User',
        default: [],
    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active',
    },
}, {
    timestamps: true,
});
studentSchema.plugin(toJSON_1.toJSON);
studentSchema.plugin(paginate_1.paginate);
studentSchema.index({ guardianIds: 1 });
const Student = mongoose_1.default.model('Student', studentSchema);
exports.default = Student;
//# sourceMappingURL=student.model.js.map