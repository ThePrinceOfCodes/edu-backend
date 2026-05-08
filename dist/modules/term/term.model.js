"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const uuid_1 = require("uuid");
const toJSON_1 = require("../toJSON");
const paginate_1 = require("../paginate");
const termSchema = new mongoose_1.default.Schema({
    _id: {
        type: String,
        default: uuid_1.v4,
    },
    name: {
        type: String,
        required: true,
        trim: true,
    },
    termName: {
        type: String,
        required: true,
        trim: true,
    },
    academicSession: {
        type: String,
        required: true,
        trim: true,
    },
    schoolBoard: {
        type: String,
        ref: 'SchoolBoard',
        required: true,
    },
    school: {
        type: String,
        ref: 'School',
        default: null,
    },
    startDate: {
        type: Date,
        required: true,
    },
    endDate: {
        type: Date,
        required: true,
    },
    isActive: {
        type: Boolean,
        default: false,
    },
}, {
    timestamps: true,
});
termSchema.index({ schoolBoard: 1, school: 1, termName: 1, academicSession: 1 }, { unique: true });
termSchema.index({ schoolBoard: 1, school: 1, isActive: 1 });
termSchema.plugin(toJSON_1.toJSON);
termSchema.plugin(paginate_1.paginate);
const Term = mongoose_1.default.model('Term', termSchema);
exports.default = Term;
//# sourceMappingURL=term.model.js.map