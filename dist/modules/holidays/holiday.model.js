"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const uuid_1 = require("uuid");
const index_1 = require("../toJSON/index");
const index_2 = require("../paginate/index");
const holidaySchema = new mongoose_1.default.Schema({
    _id: {
        type: String,
        default: uuid_1.v4,
    },
    organizationId: {
        type: String,
        ref: 'Organization',
        required: true,
    },
    name: {
        type: String,
        required: true,
        trim: true,
    },
    date: {
        type: Date,
        required: true,
    },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});
holidaySchema.index({ organizationId: 1, date: 1 }, { unique: true });
holidaySchema.plugin(index_1.toJSON);
holidaySchema.plugin(index_2.paginate);
const Holiday = mongoose_1.default.model('Holiday', holidaySchema);
exports.default = Holiday;
//# sourceMappingURL=holiday.model.js.map