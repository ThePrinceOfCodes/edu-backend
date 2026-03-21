"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const uuid_1 = require("uuid");
const index_1 = require("../toJSON/index");
const index_2 = require("../paginate/index");
const activity_log_interfaces_1 = require("./activity_log.interfaces");
const activityLogSchema = new mongoose_1.default.Schema({
    _id: {
        type: String,
        default: uuid_1.v4,
    },
    type: {
        type: String,
        enum: Object.values(activity_log_interfaces_1.ActivityLogType),
        required: true,
    },
    action: {
        type: String,
        enum: Object.values(activity_log_interfaces_1.ActivityLogAction),
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    organizationId: {
        type: String,
        ref: 'Organization',
        required: false, // System logs might not have an org
    },
    projectId: {
        type: String,
        ref: 'Project',
        required: false,
    },
    actorId: {
        type: String,
        ref: 'User',
        required: true,
    },
    targetId: {
        type: String,
        required: false,
    },
    targetType: {
        type: String,
        enum: Object.values(activity_log_interfaces_1.ActivityTargetType),
        required: false,
    },
    targetSnapshot: {
        type: mongoose_1.default.Schema.Types.Mixed,
        default: undefined,
    },
    metadata: {
        type: mongoose_1.default.Schema.Types.Mixed,
        default: {},
    },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});
activityLogSchema.virtual('actor', {
    ref: 'User',
    localField: 'actorId',
    foreignField: '_id',
    justOne: true
});
activityLogSchema.index({ organizationId: 1, createdAt: -1 });
activityLogSchema.index({ projectId: 1, createdAt: -1 });
activityLogSchema.index({ actorId: 1, createdAt: -1 });
activityLogSchema.index({ targetType: 1, targetId: 1, createdAt: -1 });
activityLogSchema.index({ organizationId: 1, actorId: 1, createdAt: -1 });
activityLogSchema.index({ type: 1, action: 1, createdAt: -1 });
activityLogSchema.plugin(index_1.toJSON);
activityLogSchema.plugin(index_2.paginate);
const ActivityLog = mongoose_1.default.model('ActivityLog', activityLogSchema);
exports.default = ActivityLog;
//# sourceMappingURL=activity_log.model.js.map