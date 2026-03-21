
import { Model, Document } from 'mongoose';
import { UserRole } from './user.constants';

export interface IUser {
    name: string;
    email: string;
    accountType?: 'client' | 'internal';
    role?: UserRole;
    schoolBoardId?: string | null;
    schoolId?: string | null;
    permissions?: string[];
    isVerified?: boolean;
    status?: 'active' | 'disabled';
    avatar?: string | null;
    avatarKey?: string | null;
    twoFactorEnabled?: boolean;
    phoneNumber?: string;
}


export interface IUserDoc extends IUser, Document { }

export interface IUserModel extends Model<IUserDoc> {
    paginate(filter: any, options: any): Promise<any>;
}
