import httpStatus from 'http-status';
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import config from '../../config/config';
import { User } from '../users/index';
import { ApiError } from '../errors/index';

export const authenticate = async (req: Request, _res: Response, next: NextFunction) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            throw new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate');
        }

        const decoded: any = jwt.verify(token, config.jwt.secret);
        const user = await User.findById(decoded.sub);

        if (!user) {
            throw new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate');
        }

        req.account = user.toJSON();
        req.account.permissions = user.permissions ?? [];
        (req as any).tokenPayload = decoded;
        next();
    } catch (error) {
        next(new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate'));
    }
};

export const validateOrganizationAccess = (req: Request, _res: Response, next: NextFunction) => {
    const { organizationId } = req.params;
    const { tokenPayload } = req as any;

    if (!tokenPayload || !tokenPayload.organizationId) {
        return next(new ApiError(httpStatus.FORBIDDEN, 'Organization context required. Please select an organization first.'));
    }

    if (organizationId && tokenPayload.organizationId !== organizationId) {
        return next(new ApiError(httpStatus.FORBIDDEN, 'Access denied. Token organization does not match request organization.'));
    }

    next();
};

export const authorize = (...requiredPermissions: string[]) => {
    return (req: Request, _res: Response, next: NextFunction) => {
        const account = req.account;

        if (!account) {
            return next(new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate'));
        }

        if (!requiredPermissions.length) {
            return next();
        }

        const accountPermissions = account.permissions ?? [];
        const hasWildcard = accountPermissions.includes('*');
        const hasPermission = requiredPermissions.some((permission) => accountPermissions.includes(permission));

        if (!hasWildcard && !hasPermission) {
            return next(new ApiError(httpStatus.FORBIDDEN, 'You do not have permission to perform this action'));
        }

        return next();
    };
};

export const requireInternalUser = (req: Request, _res: Response, next: NextFunction) => {
    const account = req.account;

    if (!account) {
        return next(new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate'));
    }

    if (account.accountType !== 'internal') {
        return next(new ApiError(httpStatus.FORBIDDEN, 'Only internal users can perform this action'));
    }

    return next();
};
