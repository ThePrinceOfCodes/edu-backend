"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const uuid_1 = require("uuid");
const index_1 = require("../toJSON/index");
const project_interfaces_1 = require("./project.interfaces");
const projectMemberSchema = new mongoose_1.default.Schema({
    _id: {
        type: String,
        default: uuid_1.v4,
    },
    projectId: {
        type: String,
        ref: 'Project',
        required: true,
    },
    userId: {
        type: String,
        ref: 'User',
        required: true,
    },
    role: {
        type: String,
        enum: Object.values(project_interfaces_1.ProjectMemberRole),
        default: project_interfaces_1.ProjectMemberRole.MEMBER
    },
    status: {
        type: String,
        enum: Object.values(project_interfaces_1.ProjectMemberStatus),
        default: project_interfaces_1.ProjectMemberStatus.ACTIVE
    },
    hourlyRate: {
        type: Number,
        min: 0
    },
    weeklyLimitHours: {
        type: Number,
        min: 0,
        default: null,
    },
    dailyLimitHours: {
        type: Number,
        min: 0,
        default: null,
    },
    requiredBreaks: {
        type: Boolean,
        default: false,
    },
    expectedWeeklyHours: {
        type: Number,
        min: 0,
        default: null,
    },
    expectedWorkDays: {
        type: [String],
        enum: Object.values(project_interfaces_1.WorkDay),
        default: [project_interfaces_1.WorkDay.MON, project_interfaces_1.WorkDay.TUE, project_interfaces_1.WorkDay.WED, project_interfaces_1.WorkDay.THU, project_interfaces_1.WorkDay.FRI],
    },
    notes: {
        type: String,
        trim: true,
        default: null,
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});
projectMemberSchema.virtual('project', {
    ref: 'Project',
    localField: 'projectId',
    foreignField: '_id',
    justOne: true
});
projectMemberSchema.virtual('user', {
    ref: 'User',
    localField: 'userId',
    foreignField: '_id',
    justOne: true
});
projectMemberSchema.plugin(index_1.toJSON);
const ProjectMember = mongoose_1.default.model('ProjectMember', projectMemberSchema);
exports.default = ProjectMember;
//# sourceMappingURL=project_member.model.js.map