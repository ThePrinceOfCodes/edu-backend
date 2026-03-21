"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const uuid_1 = require("uuid");
const index_1 = require("../toJSON/index");
const index_2 = require("../paginate/index");
const project_invitation_interfaces_1 = require("./project_invitation.interfaces");
const project_interfaces_1 = require("./project.interfaces");
const projectInvitationSchema = new mongoose_1.default.Schema({
    _id: {
        type: String,
        default: uuid_1.v4,
    },
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
    },
    projectId: {
        type: String,
        ref: 'Project',
        required: true,
    },
    organizationId: {
        type: String,
        ref: 'Organization',
        required: true,
    },
    token: {
        type: String,
        required: true,
        unique: true,
    },
    status: {
        type: String,
        enum: Object.values(project_invitation_interfaces_1.ProjectInvitationStatus),
        default: project_invitation_interfaces_1.ProjectInvitationStatus.PENDING,
    },
    expiresAt: {
        type: Date,
        required: true,
    },
    role: {
        type: String,
        enum: Object.values(project_interfaces_1.ProjectMemberRole),
        default: project_interfaces_1.ProjectMemberRole.MEMBER
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});
projectInvitationSchema.virtual('project', {
    ref: 'Project',
    localField: 'projectId',
    foreignField: '_id',
    justOne: true
});
projectInvitationSchema.virtual('organization', {
    ref: 'Organization',
    localField: 'organizationId',
    foreignField: '_id',
    justOne: true
});
projectInvitationSchema.plugin(index_1.toJSON);
projectInvitationSchema.plugin(index_2.paginate);
const ProjectInvitation = mongoose_1.default.model('ProjectInvitation', projectInvitationSchema);
exports.default = ProjectInvitation;
//# sourceMappingURL=project_invitation.model.js.map