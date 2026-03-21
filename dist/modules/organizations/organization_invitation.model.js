"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const uuid_1 = require("uuid");
const index_1 = require("../toJSON/index");
const index_2 = require("../paginate/index");
const organization_invitation_interfaces_1 = require("./organization_invitation.interfaces");
const organization_interfaces_1 = require("./organization.interfaces");
const organizationInvitationSchema = new mongoose_1.default.Schema({
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
        enum: Object.values(organization_invitation_interfaces_1.OrganizationInvitationStatus),
        default: organization_invitation_interfaces_1.OrganizationInvitationStatus.PENDING,
    },
    hourlyRate: {
        type: Number,
        required: false
    },
    expiresAt: {
        type: Date,
        required: true,
    },
    role: {
        type: String,
        enum: Object.values(organization_interfaces_1.OrganizationMemberRole),
        default: organization_interfaces_1.OrganizationMemberRole.MEMBER
    },
    birthday: {
        type: Date,
        required: false
    },
    startDate: {
        type: Date,
        required: false
    },
    projects: {
        type: [{
                projectId: String,
                role: {
                    type: String,
                    enum: ['viewer', 'member', 'manager'],
                    default: 'member'
                }
            }],
        default: []
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});
organizationInvitationSchema.virtual('organization', {
    ref: 'Organization',
    localField: 'organizationId',
    foreignField: '_id',
    justOne: true
});
organizationInvitationSchema.plugin(index_1.toJSON);
organizationInvitationSchema.plugin(index_2.paginate);
const OrganizationInvitation = mongoose_1.default.model('OrganizationInvitation', organizationInvitationSchema);
exports.default = OrganizationInvitation;
//# sourceMappingURL=organization_invitation.model.js.map