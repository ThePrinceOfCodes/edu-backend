"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const uuid_1 = require("uuid");
const index_1 = require("../toJSON/index");
const authSchema = new mongoose_1.default.Schema({
    _id: {
        type: String,
        default: uuid_1.v4,
    },
    user: {
        type: String,
        ref: 'User',
        required: true,
    },
    provider: {
        type: String,
        enum: ['email', 'google'],
        default: 'email',
        required: true,
    },
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
    },
    password: {
        type: String,
        trim: true,
        minlength: 8,
        private: true, // Used by toJSON plugin
    },
    oauthId: {
        type: String,
        trim: true,
    },
}, {
    timestamps: true,
});
// add plugin that converts mongoose to json
authSchema.plugin(index_1.toJSON);
authSchema.static("isEmailTaken", async function (email, excludeAuthId) {
    const auth = await this.findOne({ email, _id: { $ne: excludeAuthId } });
    return !!auth;
});
authSchema.method('isPasswordMatch', async function (password) {
    const user = this;
    return bcryptjs_1.default.compare(password, user.password);
});
authSchema.pre('save', async function (next) {
    const auth = this;
    if (auth.isModified('password') && auth.password) {
        auth.password = await bcryptjs_1.default.hash(auth.password, 8);
    }
    next();
});
const Auth = mongoose_1.default.model('Auth', authSchema);
exports.default = Auth;
//# sourceMappingURL=auth.model.js.map