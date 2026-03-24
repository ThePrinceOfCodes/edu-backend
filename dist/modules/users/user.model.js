"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const uuid_1 = require("uuid");
const index_1 = require("../toJSON/index");
const index_2 = require("../paginate/index");
const user_constants_1 = require("./user.constants");
const userSchema = new mongoose_1.default.Schema({
    _id: {
        type: String,
        default: uuid_1.v4,
    },
    name: {
        type: String,
        required: true,
        trim: true,
    },
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
    },
    phoneNumber: {
        type: String,
        trim: true,
        lowercase: true,
    },
    accountType: {
        type: String,
        enum: ['client', 'internal'],
        default: 'client',
    },
    role: {
        type: String,
        enum: user_constants_1.USER_ROLES,
        default: user_constants_1.DEFAULT_INTERNAL_USER_ROLE,
    },
    schoolBoardId: {
        type: String,
        default: null,
    },
    schoolId: {
        type: String,
        default: null,
    },
    permissions: {
        type: [String],
        default: [],
    },
    isVerified: {
        type: Boolean,
        default: false,
    },
    status: {
        type: String,
        enum: ['active', 'disabled'],
        default: 'active',
    },
    avatar: {
        type: String,
        default: null,
    },
    avatarKey: {
        type: String,
        default: null,
    },
    twoFactorEnabled: {
        type: Boolean,
        default: false,
    }
}, {
    timestamps: true,
});
userSchema.pre('validate', function (next) {
    const user = this;
    if (user.accountType === 'internal') {
        if (!user.role || !user_constants_1.INTERNAL_USER_ROLES.includes(user.role)) {
            user.role = user_constants_1.DEFAULT_INTERNAL_USER_ROLE;
        }
        if (!Array.isArray(user.permissions) || user.permissions.length === 0) {
            user.permissions = (0, user_constants_1.getPermissionsForRole)(user.role);
        }
        return next();
    }
    if (!user.role || user_constants_1.INTERNAL_USER_ROLES.includes(user.role)) {
        user.role = user_constants_1.DEFAULT_CLIENT_USER_ROLE;
    }
    user.permissions = (0, user_constants_1.getPermissionsForRole)(user.role);
    next();
});
// add plugin that converts mongoose to json
userSchema.plugin(index_1.toJSON);
userSchema.plugin(index_2.paginate);
const User = mongoose_1.default.model('User', userSchema);
exports.default = User;
//# sourceMappingURL=user.model.js.map