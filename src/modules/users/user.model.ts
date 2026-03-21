import mongoose from 'mongoose';

import { v4 as uuidv4 } from 'uuid';
import { toJSON } from '../toJSON/index';
import { paginate } from '../paginate/index';
import { IUserDoc, IUserModel } from './user.interfaces';
import {
    DEFAULT_CLIENT_USER_ROLE,
    DEFAULT_INTERNAL_USER_ROLE,
    INTERNAL_USER_ROLES,
    USER_ROLES,
    getPermissionsForRole,
} from './user.constants';

const userSchema = new mongoose.Schema<IUserDoc, IUserModel>(
    {
        _id: {
            type: String,
            default: uuidv4,
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
            enum: USER_ROLES,
            default: DEFAULT_INTERNAL_USER_ROLE,
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
    },
    {
        timestamps: true,
    }
);

userSchema.pre('validate', function (next) {
    const user = this;

    if (user.accountType === 'internal') {
        if (!user.role || !INTERNAL_USER_ROLES.includes(user.role as any)) {
            user.role = DEFAULT_INTERNAL_USER_ROLE;
        }

        user.permissions = getPermissionsForRole(user.role);
        return next();
    }

    if (!user.role || INTERNAL_USER_ROLES.includes(user.role as any)) {
        user.role = DEFAULT_CLIENT_USER_ROLE;
    }

    user.permissions = getPermissionsForRole(user.role);
    next();
});

// add plugin that converts mongoose to json
userSchema.plugin(toJSON);
userSchema.plugin(paginate);

const User = mongoose.model<IUserDoc, IUserModel>('User', userSchema);

export default User;
