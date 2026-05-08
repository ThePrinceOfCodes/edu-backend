"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const uuid_1 = require("uuid");
const toJSON_1 = require("../toJSON");
const paginate_1 = require("../paginate");
const schoolTypeSchema = new mongoose_1.default.Schema({
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
}, {
    timestamps: true,
});
schoolTypeSchema.plugin(toJSON_1.toJSON);
schoolTypeSchema.plugin(paginate_1.paginate);
const SchoolType = mongoose_1.default.model('SchoolType', schoolTypeSchema);
exports.default = SchoolType;
//# sourceMappingURL=schoolType.model.js.map