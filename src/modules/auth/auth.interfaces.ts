import { Model, Document } from 'mongoose';

export interface IAuth {
    user: string;
    provider: 'email' | 'google';
    email: string;
    password: string;
    oauthId?: string;
}

export interface IAuthDoc extends IAuth, Document {
    isPasswordMatch(password: string): Promise<boolean>;
}

export interface IAuthModel extends Model<IAuthDoc> {
    isEmailTaken(email: string, excludeAuthId?: string): Promise<boolean>;
}
