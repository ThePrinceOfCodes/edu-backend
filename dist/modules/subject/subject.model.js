"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const uuid_1 = require("uuid");
const toJSON_1 = require("../toJSON");
const paginate_1 = require("../paginate");
const subjectSchema = new mongoose_1.default.Schema({
    _id: {
        type: String,
        default: uuid_1.v4,
    },
    name: {
        type: String,
        required: true,
        trim: true,
        unique: true,
    },
    code: {
        type: String,
        required: true,
        trim: true,
        uppercase: true,
        unique: true,
    },
}, {
    timestamps: true,
});
subjectSchema.plugin(toJSON_1.toJSON);
subjectSchema.plugin(paginate_1.paginate);
const Subject = mongoose_1.default.model('Subject', subjectSchema);
exports.default = Subject;
//# sourceMappingURL=subject.model.js.map