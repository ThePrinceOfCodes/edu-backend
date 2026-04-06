"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const uuid_1 = require("uuid");
const toJSON_1 = require("../toJSON");
const paginate_1 = require("../paginate");
const messagingThreadSchema = new mongoose_1.default.Schema({
    _id: {
        type: String,
        default: uuid_1.v4,
    },
    title: {
        type: String,
        trim: true,
        default: null,
    },
    schoolBoard: {
        type: String,
        ref: 'SchoolBoard',
        default: null,
    },
    createdBy: {
        type: String,
        ref: 'User',
        required: true,
    },
    participants: {
        type: [String],
        ref: 'User',
        default: [],
    },
    isBroadcast: {
        type: Boolean,
        default: false,
    },
}, {
    timestamps: true,
});
messagingThreadSchema.plugin(toJSON_1.toJSON);
messagingThreadSchema.plugin(paginate_1.paginate);
const MessageThread = mongoose_1.default.model('MessageThread', messagingThreadSchema);
exports.default = MessageThread;
//# sourceMappingURL=messagingThread.model.js.map