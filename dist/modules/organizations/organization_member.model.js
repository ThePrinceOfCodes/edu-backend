"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const uuid_1 = require("uuid");
const index_1 = require("../toJSON/index");
const index_2 = require("../paginate/index");
const organization_interfaces_1 = require("./organization.interfaces");
const organizationMemberSchema = new mongoose_1.default.Schema({
    _id: {
        type: String,
        default: uuid_1.v4,
    },
    organizationId: {
        type: String,
        ref: 'Organization',
        required: true,
    },
    userId: {
        type: String,
        ref: 'User',
        required: true,
    },
    hourlyRate: {
        type: Number,
        default: 0
    },
    canSubmitTimesheet: {
        type: Boolean,
        default: false
    },
    role: {
        type: String,
        enum: Object.values(organization_interfaces_1.OrganizationMemberRole),
        default: organization_interfaces_1.OrganizationMemberRole.MEMBER
    },
    permissionOverrides: {
        add: {
            type: [String],
            default: []
        },
        remove: {
            type: [String],
            default: []
        }
    },
    status: {
        type: String,
        enum: Object.values(organization_interfaces_1.OrganizationMemberStatus),
        default: organization_interfaces_1.OrganizationMemberStatus.INVITED
    },
    birthday: {
        type: Date,
        required: false
    },
    startDate: {
        type: Date,
        required: false
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});
organizationMemberSchema.virtual('organization', {
    ref: 'Organization',
    localField: 'organizationId',
    foreignField: '_id',
    justOne: true
});
organizationMemberSchema.virtual('user', {
    ref: 'User',
    localField: 'userId',
    foreignField: '_id',
    justOne: true
});
organizationMemberSchema.plugin(index_1.toJSON);
organizationMemberSchema.plugin(index_2.paginate);
const OrganizationMember = mongoose_1.default.model('OrganizationMember', organizationMemberSchema);
exports.default = OrganizationMember;
//# sourceMappingURL=organization_member.model.js.map