"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const uuid_1 = require("uuid");
const index_1 = require("../toJSON/index");
const index_2 = require("../paginate/index");
const ptoPolicySchema = new mongoose_1.default.Schema({
    _id: {
        type: String,
        default: uuid_1.v4,
    },
    organizationId: {
        type: String,
        ref: 'Organization',
        required: true,
        index: true
    },
    name: {
        type: String,
        required: true,
        index: true,
    },
    description: {
        type: String,
        required: true,
    },
    effectiveDate: {
        type: Date,
        required: true,
    },
    maxDaysPerYear: {
        type: Number,
        required: true,
    },
    enabled: {
        type: Boolean,
        default: true,
    },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});
ptoPolicySchema.plugin(index_1.toJSON);
ptoPolicySchema.plugin(index_2.paginate);
const PTOPolicy = mongoose_1.default.model('PTOPolicy', ptoPolicySchema);
exports.default = PTOPolicy;
//# sourceMappingURL=pto_policies.model.js.map