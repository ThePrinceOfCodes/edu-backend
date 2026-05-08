"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const uuid_1 = require("uuid");
const toJSON_1 = require("../toJSON");
const paginate_1 = require("../paginate");
const classSchema = new mongoose_1.default.Schema({
    _id: {
        type: String,
        default: uuid_1.v4,
    },
    name: {
        type: String,
        required: true,
        trim: true,
    },
    code: {
        type: String,
        required: true,
        trim: true,
        uppercase: true,
    },
    schoolTypeId: {
        type: String,
        ref: 'SchoolType',
        required: true,
    },
}, {
    timestamps: true,
});
classSchema.index({ code: 1, schoolTypeId: 1 }, { unique: true });
classSchema.plugin(toJSON_1.toJSON);
classSchema.plugin(paginate_1.paginate);
const ClassModel = mongoose_1.default.model('Class', classSchema);
exports.default = ClassModel;
//# sourceMappingURL=class.model.js.map