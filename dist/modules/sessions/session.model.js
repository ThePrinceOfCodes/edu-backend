"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const uuid_1 = require("uuid");
const index_1 = require("../toJSON/index");
const index_2 = require("../paginate/index");
const sessionSchema = new mongoose_1.default.Schema({
    _id: {
        type: String,
        default: uuid_1.v4,
    },
    uuid: {
        type: String,
        required: true,
        unique: true, // Client-side UUID should be unique
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
    organizationId: {
        type: String,
        ref: 'Organization',
        required: true,
    },
    startTime: {
        type: Number,
        required: true,
    },
    endTime: {
        type: Number,
    },
    isActive: {
        type: Boolean,
        default: false,
    },
    idleSeconds: {
        type: Number,
        default: 0,
    },
    deductedSeconds: {
        type: Number,
        default: 0,
    },
    keyboardEvents: {
        type: Number,
        default: 0,
    },
    mouseEvents: {
        type: Number,
        default: 0,
    },
    appUsage: [{
            appName: { type: String, required: true },
            timestamp: { type: Number, required: true },
            url: { type: String, default: null },
            windowTitle: { type: String, default: null }
        }]
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});
sessionSchema.virtual('project', {
    ref: 'Project',
    localField: 'projectId',
    foreignField: '_id',
    justOne: true
});
sessionSchema.plugin(index_1.toJSON);
sessionSchema.plugin(index_2.paginate);
const Session = mongoose_1.default.model('Session', sessionSchema);
exports.default = Session;
//# sourceMappingURL=session.model.js.map