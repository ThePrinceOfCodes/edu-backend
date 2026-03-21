"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const uuid_1 = require("uuid");
const hubstaffAccessTokenSchema = new mongoose_1.default.Schema({
    _id: {
        type: String,
        default: uuid_1.v4,
    },
    access_token: {
        type: String,
        required: true,
    },
    refresh_token: {
        type: String,
        required: true,
    },
    token_type: {
        type: String,
        required: true,
    },
    expires_in: {
        type: Number,
        required: true,
    },
    hubstaff_organization_id: {
        type: [Number],
        required: true,
    },
    organizationId: {
        type: String,
        ref: 'Organization',
        required: true,
    },
}, {
    timestamps: true,
});
const HubstaffAccessToken = mongoose_1.default.model('HubstaffAccessToken', hubstaffAccessTokenSchema);
exports.default = HubstaffAccessToken;
//# sourceMappingURL=hubstaff_access_token.model.js.map