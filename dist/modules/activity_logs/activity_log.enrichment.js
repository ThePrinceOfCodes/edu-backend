"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.enrichActivityLogs = void 0;
const activity_log_interfaces_1 = require("./activity_log.interfaces");
const user_model_1 = __importDefault(require("../users/user.model"));
const project_model_1 = __importDefault(require("../projects/project.model"));
const organization_model_1 = __importDefault(require("../organizations/organization.model"));
const inferTargetType = (log) => {
    if (log.targetType)
        return log.targetType;
    switch (log.action) {
        case activity_log_interfaces_1.ActivityLogAction.PROJECT_CREATED:
        case activity_log_interfaces_1.ActivityLogAction.PROJECT_UPDATED:
        case activity_log_interfaces_1.ActivityLogAction.PROJECT_ARCHIVED:
        case activity_log_interfaces_1.ActivityLogAction.PROJECT_DELETED:
            return activity_log_interfaces_1.ActivityTargetType.PROJECT;
        case activity_log_interfaces_1.ActivityLogAction.PROJECT_MEMBER_ADDED:
        case activity_log_interfaces_1.ActivityLogAction.PROJECT_MEMBER_REMOVED:
        case activity_log_interfaces_1.ActivityLogAction.PROJECT_MEMBER_UPDATED:
        case activity_log_interfaces_1.ActivityLogAction.USER_LOGIN:
        case activity_log_interfaces_1.ActivityLogAction.USER_REGISTERED:
        case activity_log_interfaces_1.ActivityLogAction.USER_PROFILE_UPDATED:
        case activity_log_interfaces_1.ActivityLogAction.USER_2FA_UPDATED:
        case activity_log_interfaces_1.ActivityLogAction.USER_PROFILE_IMAGE_UPDATED:
        case activity_log_interfaces_1.ActivityLogAction.USER_PROFILE_IMAGE_DELETED:
        case activity_log_interfaces_1.ActivityLogAction.USER_PASSWORD_CHANGED:
        case activity_log_interfaces_1.ActivityLogAction.USER_PASSWORD_RESET:
        case activity_log_interfaces_1.ActivityLogAction.USER_CREATED_INTERNAL:
        case activity_log_interfaces_1.ActivityLogAction.USER_DISABLED:
        case activity_log_interfaces_1.ActivityLogAction.USER_ENABLED:
        case activity_log_interfaces_1.ActivityLogAction.ORG_MEMBER_ADDED:
        case activity_log_interfaces_1.ActivityLogAction.ORG_MEMBER_INVITED:
        case activity_log_interfaces_1.ActivityLogAction.ORG_MEMBER_UPDATED:
        case activity_log_interfaces_1.ActivityLogAction.ORG_MEMBER_JOINED:
        case activity_log_interfaces_1.ActivityLogAction.ORG_MEMBER_REJECTED:
            return activity_log_interfaces_1.ActivityTargetType.USER;
        case activity_log_interfaces_1.ActivityLogAction.ORG_CREATED:
        case activity_log_interfaces_1.ActivityLogAction.ORG_UPDATED:
        case activity_log_interfaces_1.ActivityLogAction.ORG_ENABLED:
        case activity_log_interfaces_1.ActivityLogAction.ORG_DISABLED:
            return activity_log_interfaces_1.ActivityTargetType.ORGANIZATION;
        case activity_log_interfaces_1.ActivityLogAction.ORG_INVITATION_UPDATED:
        case activity_log_interfaces_1.ActivityLogAction.ORG_INVITATION_RESENT:
        case activity_log_interfaces_1.ActivityLogAction.ORG_INVITATION_REMOVED:
            return activity_log_interfaces_1.ActivityTargetType.INVITATION;
        default:
            return activity_log_interfaces_1.ActivityTargetType.OTHER;
    }
};
const buildHref = (type, id, organizationId) => {
    if (!organizationId)
        return undefined;
    switch (type) {
        case activity_log_interfaces_1.ActivityTargetType.USER:
            return `/dashboard/${organizationId}/teams/staff/${id}`;
        case activity_log_interfaces_1.ActivityTargetType.PROJECT:
            return `/dashboard/${organizationId}/projects/${id}`;
        case activity_log_interfaces_1.ActivityTargetType.ORGANIZATION:
            return `/dashboard/${organizationId}/settings`;
        default:
            return undefined;
    }
};
const enrichActivityLogs = async (paginated) => {
    const results = (paginated.results || []);
    if (!results.length)
        return paginated;
    const userIds = new Set();
    const projectIds = new Set();
    const organizationIds = new Set();
    results.forEach((log) => {
        if (log.organizationId)
            organizationIds.add(log.organizationId);
        if (log.projectId)
            projectIds.add(log.projectId);
        const inferredType = inferTargetType(log);
        if (log.targetId && inferredType === activity_log_interfaces_1.ActivityTargetType.USER)
            userIds.add(log.targetId);
        if (log.targetId && inferredType === activity_log_interfaces_1.ActivityTargetType.PROJECT)
            projectIds.add(log.targetId);
        if (log.targetId && inferredType === activity_log_interfaces_1.ActivityTargetType.ORGANIZATION)
            organizationIds.add(log.targetId);
    });
    const [users, projects, organizations] = await Promise.all([
        userIds.size ? user_model_1.default.find({ _id: { $in: Array.from(userIds) } }).select('_id name email').lean() : [],
        projectIds.size ? project_model_1.default.find({ _id: { $in: Array.from(projectIds) } }).select('_id name organizationId').lean() : [],
        organizationIds.size ? organization_model_1.default.find({ _id: { $in: Array.from(organizationIds) } }).select('_id name').lean() : [],
    ]);
    const userById = new Map(users.map((user) => [user._id, user]));
    const projectById = new Map(projects.map((project) => [project._id, project]));
    const organizationById = new Map(organizations.map((org) => [org._id, org]));
    paginated.results = results.map((rawLog) => {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j;
        const log = typeof (rawLog === null || rawLog === void 0 ? void 0 : rawLog.toObject) === 'function' ? rawLog.toObject() : Object.assign({}, rawLog);
        const inferredType = inferTargetType(log);
        const resolvedTargetType = log.targetType || inferredType;
        let target;
        if (log.targetId) {
            if (resolvedTargetType === activity_log_interfaces_1.ActivityTargetType.USER) {
                const user = userById.get(log.targetId);
                target = {
                    id: log.targetId,
                    type: resolvedTargetType,
                    name: ((_a = log.targetSnapshot) === null || _a === void 0 ? void 0 : _a.name) || (user === null || user === void 0 ? void 0 : user.name),
                    email: ((_b = log.targetSnapshot) === null || _b === void 0 ? void 0 : _b.email) || (user === null || user === void 0 ? void 0 : user.email),
                    href: ((_c = log.targetSnapshot) === null || _c === void 0 ? void 0 : _c.href) || buildHref(resolvedTargetType, log.targetId, log.organizationId),
                };
            }
            else if (resolvedTargetType === activity_log_interfaces_1.ActivityTargetType.PROJECT) {
                const project = projectById.get(log.targetId);
                target = {
                    id: log.targetId,
                    type: resolvedTargetType,
                    name: ((_d = log.targetSnapshot) === null || _d === void 0 ? void 0 : _d.name) || (project === null || project === void 0 ? void 0 : project.name),
                    href: ((_e = log.targetSnapshot) === null || _e === void 0 ? void 0 : _e.href) || buildHref(resolvedTargetType, log.targetId, log.organizationId || (project === null || project === void 0 ? void 0 : project.organizationId)),
                };
            }
            else if (resolvedTargetType === activity_log_interfaces_1.ActivityTargetType.ORGANIZATION) {
                const organization = organizationById.get(log.targetId);
                target = {
                    id: log.targetId,
                    type: resolvedTargetType,
                    name: ((_f = log.targetSnapshot) === null || _f === void 0 ? void 0 : _f.name) || (organization === null || organization === void 0 ? void 0 : organization.name),
                    href: ((_g = log.targetSnapshot) === null || _g === void 0 ? void 0 : _g.href) || buildHref(resolvedTargetType, log.targetId, log.targetId),
                };
            }
            else {
                target = {
                    id: log.targetId,
                    type: resolvedTargetType,
                    name: (_h = log.targetSnapshot) === null || _h === void 0 ? void 0 : _h.name,
                    href: (_j = log.targetSnapshot) === null || _j === void 0 ? void 0 : _j.href,
                };
            }
        }
        const project = log.projectId
            ? projectById.get(log.projectId)
            : undefined;
        const organization = log.organizationId
            ? organizationById.get(log.organizationId)
            : undefined;
        return Object.assign(Object.assign({}, log), { targetType: resolvedTargetType, target, project: project
                ? {
                    id: project._id,
                    name: project.name,
                    href: buildHref(activity_log_interfaces_1.ActivityTargetType.PROJECT, project._id, project.organizationId),
                }
                : undefined, organization: organization
                ? {
                    id: organization._id,
                    name: organization.name,
                    href: buildHref(activity_log_interfaces_1.ActivityTargetType.ORGANIZATION, organization._id, organization._id),
                }
                : undefined });
    });
    return paginated;
};
exports.enrichActivityLogs = enrichActivityLogs;
//# sourceMappingURL=activity_log.enrichment.js.map