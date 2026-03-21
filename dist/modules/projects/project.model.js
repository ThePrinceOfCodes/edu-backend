"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const uuid_1 = require("uuid");
const index_1 = require("../toJSON/index");
const index_2 = require("../paginate/index");
const project_interfaces_1 = require("./project.interfaces");
const projectSchema = new mongoose_1.default.Schema({
    _id: {
        type: String,
        default: uuid_1.v4,
    },
    name: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        trim: true,
    },
    organizationId: {
        type: String,
        ref: 'Organization',
        required: true,
    },
    status: {
        type: String,
        enum: Object.values(project_interfaces_1.ProjectStatus),
        default: project_interfaces_1.ProjectStatus.ACTIVE,
    },
    projectType: {
        type: String,
        enum: ["trackup", "analytics"],
        default: "trackup",
    },
    hubstaffProjectId: {
        type: String,
        default: null,
    },
    screenshotsEnabled: {
        type: Boolean,
        default: true,
    },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});
projectSchema.virtual('organization', {
    ref: 'Organization',
    localField: 'organizationId',
    foreignField: '_id',
    justOne: true
});
projectSchema.plugin(index_1.toJSON);
projectSchema.plugin(index_2.paginate);
const Project = mongoose_1.default.model('Project', projectSchema);
exports.default = Project;
//# sourceMappingURL=project.model.js.map