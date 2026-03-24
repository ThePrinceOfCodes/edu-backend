"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const uuid_1 = require("uuid");
const toJSON_1 = require("../toJSON");
const paginate_1 = require("../paginate");
const staffSchema = new mongoose_1.default.Schema({
    _id: {
        type: String,
        default: uuid_1.v4,
    },
    user: {
        type: String,
        ref: 'User',
        required: true,
        unique: true,
    },
    schoolBoard: {
        type: String,
        ref: 'SchoolBoard',
        default: null,
    },
    school: {
        type: String,
        ref: 'School',
        default: null,
    },
    employeeId: {
        type: String,
        trim: true,
        default: null,
    },
    designation: {
        type: String,
        trim: true,
        default: null,
    },
    employmentType: {
        type: String,
        enum: ['teacher', 'staff'],
        default: 'staff',
    },
    isActive: {
        type: Boolean,
        default: true,
    },
}, {
    timestamps: true,
});
staffSchema.plugin(toJSON_1.toJSON);
staffSchema.plugin(paginate_1.paginate);
const Staff = mongoose_1.default.model('Staff', staffSchema);
exports.default = Staff;
//# sourceMappingURL=staff.model.js.map