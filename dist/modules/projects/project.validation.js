"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProjectMembersInternal = exports.addProjectMemberInternal = exports.getProjectInvitations = exports.unassignProjectMember = exports.assignProjectMember = exports.updateProjectMemberProfile = exports.getProjectMemberProfile = exports.getProjectMembers = exports.inviteUser = exports.updateProject = exports.getProjectStats = exports.getProject = exports.getInternalProject = exports.getInternalProjects = exports.createInternalProject = exports.createProject = void 0;
const joi_1 = __importDefault(require("joi"));
const project_interfaces_1 = require("./project.interfaces");
exports.createProject = {
    body: joi_1.default.object().keys({
        name: joi_1.default.string().required(),
        hubstaffProjectId: joi_1.default.string().optional().allow(null, ""),
        description: joi_1.default.string().optional().allow(null, ""),
        screenshotsEnabled: joi_1.default.boolean(),
        projectType: joi_1.default.string().optional().allow(null, "trackup", "analytics"),
    }),
};
exports.createInternalProject = {
    body: joi_1.default.object().keys({
        name: joi_1.default.string().required(),
        description: joi_1.default.string().optional().allow(null, ""),
        screenshotsEnabled: joi_1.default.boolean(),
        organizationId: joi_1.default.string().uuid().required(),
        // Add other config fields if necessary
    }),
};
exports.getInternalProjects = {
    query: joi_1.default.object().keys({
        organizationId: joi_1.default.string().uuid(),
        search: joi_1.default.string().allow(''),
        status: joi_1.default.string(),
        sortBy: joi_1.default.string(),
        limit: joi_1.default.number().integer(),
        page: joi_1.default.number().integer(),
    }),
};
exports.getInternalProject = {
    params: joi_1.default.object().keys({
        projectId: joi_1.default.string().uuid().required(),
    }),
};
exports.getProject = {
    params: joi_1.default.object().keys({
        projectId: joi_1.default.string().uuid().required(),
    }),
};
exports.getProjectStats = {
    params: joi_1.default.object().keys({
        organizationId: joi_1.default.string().uuid().required(),
        projectId: joi_1.default.string().uuid().required(),
    }),
};
exports.updateProject = {
    params: joi_1.default.object().keys({
        projectId: joi_1.default.string().uuid().required(),
    }),
    body: joi_1.default.object().keys({
        name: joi_1.default.string(),
        description: joi_1.default.string().allow(null, ""),
        screenshotsEnabled: joi_1.default.boolean(),
        status: joi_1.default.string(),
    }).min(1),
};
exports.inviteUser = {
    params: joi_1.default.object().keys({
        projectId: joi_1.default.string().uuid().required(),
    }),
    body: joi_1.default.object().keys({
        members: joi_1.default.array().items({
            email: joi_1.default.string().email().required(),
            role: joi_1.default.string().required().valid(project_interfaces_1.ProjectMemberRole.MANAGER, project_interfaces_1.ProjectMemberRole.MEMBER),
        }).required(),
    }),
};
exports.getProjectMembers = {
    params: joi_1.default.object().keys({
        projectId: joi_1.default.string().uuid().required(),
    }),
    query: joi_1.default.object().keys({
        role: joi_1.default.string(),
        status: joi_1.default.string(),
        sortBy: joi_1.default.string(),
        limit: joi_1.default.number().integer(),
        page: joi_1.default.number().integer(),
        search: joi_1.default.string().allow(''),
    }),
};
exports.getProjectMemberProfile = {
    params: joi_1.default.object().keys({
        organizationId: joi_1.default.string().uuid().required(),
        projectId: joi_1.default.string().uuid().required(),
        userId: joi_1.default.string().uuid().required(),
    }),
    query: joi_1.default.object().keys({
        startDate: joi_1.default.string().isoDate(),
        endDate: joi_1.default.string().isoDate(),
    }),
};
exports.updateProjectMemberProfile = {
    params: joi_1.default.object().keys({
        organizationId: joi_1.default.string().uuid().required(),
        projectId: joi_1.default.string().uuid().required(),
        userId: joi_1.default.string().uuid().required(),
    }),
    body: joi_1.default.object().keys({
        role: joi_1.default.string().valid(...Object.values(project_interfaces_1.ProjectMemberRole)),
        hourlyRate: joi_1.default.number().min(0),
        weeklyLimitHours: joi_1.default.number().min(0).allow(null),
        dailyLimitHours: joi_1.default.number().min(0).allow(null),
        requiredBreaks: joi_1.default.boolean(),
        expectedWeeklyHours: joi_1.default.number().min(0).allow(null),
        expectedWorkDays: joi_1.default.array().items(joi_1.default.string().valid(...Object.values(project_interfaces_1.WorkDay))),
        notes: joi_1.default.string().allow('', null),
        startDate: joi_1.default.date().iso().allow(null),
        birthday: joi_1.default.date().iso().allow(null),
    }).min(1),
};
exports.assignProjectMember = {
    params: joi_1.default.object().keys({
        organizationId: joi_1.default.string().uuid().required(),
        projectId: joi_1.default.string().uuid().required(),
    }),
    body: joi_1.default.object().keys({
        userId: joi_1.default.string().uuid().required(),
        role: joi_1.default.string().valid(project_interfaces_1.ProjectMemberRole.MANAGER, project_interfaces_1.ProjectMemberRole.MEMBER, project_interfaces_1.ProjectMemberRole.VIEWER),
    }),
};
exports.unassignProjectMember = {
    params: joi_1.default.object().keys({
        organizationId: joi_1.default.string().uuid().required(),
        projectId: joi_1.default.string().uuid().required(),
        userId: joi_1.default.string().uuid().required(),
    }),
};
exports.getProjectInvitations = {
    params: joi_1.default.object().keys({
        projectId: joi_1.default.string().uuid().required(),
    }),
    query: joi_1.default.object().keys({
        limit: joi_1.default.number().integer(),
        page: joi_1.default.number().integer(),
    }),
};
exports.addProjectMemberInternal = {
    params: joi_1.default.object().keys({
        projectId: joi_1.default.string().uuid().required(),
    }),
    body: joi_1.default.object().keys({
        userId: joi_1.default.string().uuid().required(),
        organizationId: joi_1.default.string().uuid().required(),
        role: joi_1.default.string().valid(project_interfaces_1.ProjectMemberRole.MANAGER, project_interfaces_1.ProjectMemberRole.MEMBER).default(project_interfaces_1.ProjectMemberRole.MEMBER),
    }),
};
exports.getProjectMembersInternal = {
    params: joi_1.default.object().keys({
        projectId: joi_1.default.string().uuid().required(),
    }),
    query: joi_1.default.object().keys({
        role: joi_1.default.string(),
        status: joi_1.default.string(),
        sortBy: joi_1.default.string(),
        limit: joi_1.default.number().integer(),
        page: joi_1.default.number().integer(),
        search: joi_1.default.string().allow(''),
    }),
};
//# sourceMappingURL=project.validation.js.map