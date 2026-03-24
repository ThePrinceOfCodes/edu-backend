"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const uuid_1 = require("uuid");
const toJSON_1 = require("../toJSON");
const paginate_1 = require("../paginate");
const schoolSchema = new mongoose_1.default.Schema({
    _id: {
        type: String,
        default: uuid_1.v4,
    },
    name: {
        type: String,
        required: true,
        trim: true,
    },
    schoolBoard: {
        type: String,
        ref: 'SchoolBoard',
        default: null,
    },
    adminUser: {
        type: String,
        ref: 'User',
        default: null,
    },
    address: {
        type: String,
        trim: true,
        default: null,
    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active',
    },
}, {
    timestamps: true,
});
schoolSchema.index({ schoolBoard: 1, name: 1 }, { unique: true });
schoolSchema.plugin(toJSON_1.toJSON);
schoolSchema.plugin(paginate_1.paginate);
const School = mongoose_1.default.model('School', schoolSchema);
exports.default = School;
//# sourceMappingURL=school.model.js.map