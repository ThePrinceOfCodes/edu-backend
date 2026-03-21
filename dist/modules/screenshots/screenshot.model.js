"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const uuid_1 = require("uuid");
const index_1 = require("../toJSON/index");
const screenshotSchema = new mongoose_1.default.Schema({
    _id: {
        type: String,
        default: uuid_1.v4,
    },
    sessionUuid: {
        type: String,
        required: true,
        index: true
    },
    projectId: {
        type: String,
        required: true,
        index: true
    },
    timestamp: {
        type: Number,
        required: true,
        index: true
    },
    userId: {
        type: String,
        required: true,
        index: true
    },
    url: {
        type: String,
        required: true,
    },
    s3Key: {
        type: String,
        required: true,
    },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});
screenshotSchema.virtual('user', {
    ref: 'User',
    localField: 'userId',
    foreignField: '_id',
    justOne: true
});
screenshotSchema.virtual('project', {
    ref: 'Project',
    localField: 'projectId',
    foreignField: '_id',
    justOne: true
});
screenshotSchema.plugin(index_1.toJSON);
const Screenshot = mongoose_1.default.model('Screenshot', screenshotSchema);
exports.default = Screenshot;
//# sourceMappingURL=screenshot.model.js.map