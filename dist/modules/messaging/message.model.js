"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const uuid_1 = require("uuid");
const toJSON_1 = require("../toJSON");
const paginate_1 = require("../paginate");
const messageSchema = new mongoose_1.default.Schema({
    _id: {
        type: String,
        default: uuid_1.v4,
    },
    thread: {
        type: String,
        ref: 'MessageThread',
        required: true,
    },
    sender: {
        type: String,
        ref: 'User',
        required: true,
    },
    content: {
        type: String,
        trim: true,
        required: true,
    },
    attachments: {
        type: [
            {
                name: { type: String, required: true },
                url: { type: String, required: true },
                type: { type: String, default: null },
                size: { type: Number, default: null },
            },
        ],
        default: [],
    },
}, {
    timestamps: true,
});
messageSchema.plugin(toJSON_1.toJSON);
messageSchema.plugin(paginate_1.paginate);
const MessageModel = mongoose_1.default.model('Message', messageSchema);
exports.default = MessageModel;
//# sourceMappingURL=message.model.js.map