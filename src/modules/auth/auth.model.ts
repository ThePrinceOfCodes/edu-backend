import mongoose from 'mongoose';

import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { toJSON } from '../toJSON/index';
import { IAuthDoc, IAuthModel } from './auth.interfaces';

const authSchema = new mongoose.Schema<IAuthDoc, IAuthModel>(
    {
        _id: {
            type: String,
            default: uuidv4,
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
    },
    {
        timestamps: true,
    }
);

// add plugin that converts mongoose to json
authSchema.plugin(toJSON);

authSchema.static("isEmailTaken", async function (email: string, excludeAuthId: string) {
    const auth = await this.findOne({ email, _id: { $ne: excludeAuthId } });
    return !!auth;
});

authSchema.method('isPasswordMatch', async function (password: string): Promise<boolean> {
    const user = this
    return bcrypt.compare(password, user.password)
})

authSchema.pre('save', async function (next) {
    const auth = this;
    if (auth.isModified('password') && auth.password) {
        auth.password = await bcrypt.hash(auth.password, 8);
    }
    next();
});

const Auth = mongoose.model<IAuthDoc, IAuthModel>('Auth', authSchema);

export default Auth;
