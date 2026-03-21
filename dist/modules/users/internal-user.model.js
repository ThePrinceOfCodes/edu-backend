"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const uuid_1 = require("uuid");
const index_1 = require("../toJSON/index");
const index_2 = require("../paginate/index");
const internal_user_interfaces_1 = require("./internal-user.interfaces");
const internalUserSchema = new mongoose_1.default.Schema({
    _id: {
        type: String,
        default: uuid_1.v4,
    },
    userId: {
        type: String,
        ref: 'User',
        required: true,
        unique: true
    },
    role: {
        type: String,
        enum: Object.values(internal_user_interfaces_1.InternalUserRole),
        required: true
    },
    permissions: {
        type: [String],
        default: []
    }
}, {
    timestamps: true,
});
internalUserSchema.plugin(index_1.toJSON);
internalUserSchema.plugin(index_2.paginate);
const InternalUser = mongoose_1.default.model('InternalUser', internalUserSchema);
exports.default = InternalUser;
//# sourceMappingURL=internal-user.model.js.map