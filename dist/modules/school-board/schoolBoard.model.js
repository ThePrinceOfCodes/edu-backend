"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const uuid_1 = require("uuid");
const toJSON_1 = require("../toJSON");
const paginate_1 = require("../paginate");
const schoolBoardSchema = new mongoose_1.default.Schema({
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
    description: {
        type: String,
        trim: true,
        default: null,
    },
    code: {
        type: String,
        trim: true,
        uppercase: true,
        unique: true,
        sparse: true,
        default: null,
    },
    superAdminUser: {
        type: String,
        ref: 'User',
        required: true,
    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active',
    },
}, {
    timestamps: true,
});
schoolBoardSchema.plugin(toJSON_1.toJSON);
schoolBoardSchema.plugin(paginate_1.paginate);
const SchoolBoard = mongoose_1.default.model('SchoolBoard', schoolBoardSchema);
exports.default = SchoolBoard;
//# sourceMappingURL=schoolBoard.model.js.map