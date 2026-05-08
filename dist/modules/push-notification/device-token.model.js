"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const uuid_1 = require("uuid");
const toJSON_1 = require("../toJSON");
const deviceTokenSchema = new mongoose_1.default.Schema({
    _id: {
        type: String,
        default: uuid_1.v4,
    },
    userId: {
        type: String,
        ref: 'User',
        required: true,
        index: true,
    },
    token: {
        type: String,
        required: true,
        trim: true,
        unique: true,
        index: true,
    },
    platform: {
        type: String,
        trim: true,
        default: null,
    },
    deviceId: {
        type: String,
        trim: true,
        default: null,
    },
    isActive: {
        type: Boolean,
        default: true,
        index: true,
    },
    lastSeenAt: {
        type: Date,
        default: Date.now,
    },
}, {
    timestamps: true,
});
deviceTokenSchema.plugin(toJSON_1.toJSON);
const DeviceToken = mongoose_1.default.model('DeviceToken', deviceTokenSchema);
exports.default = DeviceToken;
//# sourceMappingURL=device-token.model.js.map