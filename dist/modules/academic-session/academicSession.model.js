"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const uuid_1 = require("uuid");
const toJSON_1 = require("../toJSON");
const paginate_1 = require("../paginate");
const academicSessionSchema = new mongoose_1.default.Schema({
    _id: {
        type: String,
        default: uuid_1.v4,
    },
    name: {
        type: String,
        trim: true,
        default: null,
    },
    startYear: {
        type: Number,
        required: true,
        min: 1900,
    },
    endYear: {
        type: Number,
        required: true,
        min: 1900,
    },
    schoolBoard: {
        type: String,
        ref: 'SchoolBoard',
        required: true,
    },
    isActive: {
        type: Boolean,
        default: false,
    },
}, {
    timestamps: true,
});
academicSessionSchema.index({ schoolBoard: 1, startYear: 1, endYear: 1 }, { unique: true });
academicSessionSchema.plugin(toJSON_1.toJSON);
academicSessionSchema.plugin(paginate_1.paginate);
const AcademicSession = mongoose_1.default.model('AcademicSession', academicSessionSchema);
exports.default = AcademicSession;
//# sourceMappingURL=academicSession.model.js.map