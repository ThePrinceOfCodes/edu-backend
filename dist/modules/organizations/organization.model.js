"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const uuid_1 = require("uuid");
const index_1 = require("../toJSON/index");
const index_2 = require("../paginate/index");
const config_1 = __importDefault(require("@src/config/config"));
const organizationSchema = new mongoose_1.default.Schema({
    _id: {
        type: String,
        default: uuid_1.v4,
    },
    name: {
        type: String,
        required: true,
        trim: true,
    },
    domain: {
        type: String,
        required: false,
        trim: true,
        unique: config_1.default.redisBaseKey.includes("PROD") ? true : false,
        lowercase: true,
    },
    status: {
        type: String,
        enum: ['active', 'disabled'],
        default: 'active',
    },
    onboarding: {
        currentStep: {
            type: String,
            enum: ['OWNER_INVITED', 'OWNER_VERIFIED', 'PROJECT_CREATED', 'STAFF_INVITED', 'DESKTOP_CONNECTED'],
        },
        completedSteps: [{
                type: String,
                enum: ['OWNER_INVITED', 'OWNER_VERIFIED', 'PROJECT_CREATED', 'STAFF_INVITED', 'DESKTOP_CONNECTED'],
            }],
        completedAt: {
            type: Date,
        },
    },
    enableInsights: {
        type: Boolean,
        default: false,
    },
}, {
    timestamps: true,
});
organizationSchema.plugin(index_1.toJSON);
organizationSchema.plugin(index_2.paginate);
organizationSchema.static("isDomainTaken", async function (domain) {
    const organization = await this.findOne({ domain });
    return !!organization;
});
const Organization = mongoose_1.default.model('Organization', organizationSchema);
exports.default = Organization;
//# sourceMappingURL=organization.model.js.map