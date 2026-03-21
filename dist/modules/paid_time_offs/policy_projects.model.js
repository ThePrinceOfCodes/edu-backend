"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const uuid_1 = require("uuid");
const paginate_1 = require("../paginate");
const toJSON_1 = require("../toJSON");
const PolicyProjectSchema = new mongoose_1.default.Schema({
    _id: {
        type: String,
        default: uuid_1.v4,
    },
    policyId: {
        type: String,
        ref: "PTOPolicy",
        required: true,
    },
    organizationId: {
        type: String,
        ref: "Organization",
        required: true,
    },
    projectId: {
        type: String,
        ref: "Project",
        required: true,
    },
}, {
    timestamps: true,
});
PolicyProjectSchema.plugin(paginate_1.paginate);
PolicyProjectSchema.plugin(toJSON_1.toJSON);
const PolicyProject = mongoose_1.default.model("PolicyProject", PolicyProjectSchema);
exports.default = PolicyProject;
//# sourceMappingURL=policy_projects.model.js.map