"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getInternalProjectMembers = exports.addProjectMemberInternal = exports.getInternalProject = exports.getInternalProjects = exports.createInternalProject = exports.unassignProjectMember = exports.assignProjectMember = exports.updateProjectMemberProfile = exports.getProjectMemberProfile = exports.getProjectInvitations = exports.getProjectMembers = exports.inviteUser = exports.getDesktopUserProjects = exports.getUserProjects = exports.updateProject = exports.getProjectStats = exports.getProject = exports.createProject = void 0;
const http_status_1 = __importDefault(require("http-status"));
const index_1 = require("../utils/index");
const projectService = __importStar(require("./project.service"));
const index_2 = require("../errors/index");
exports.createProject = (0, index_1.catchAsync)(async (req, res) => {
    if (!req.account)
        throw new index_2.ApiError(http_status_1.default.FORBIDDEN, 'Access denied');
    const { organizationId } = req.params;
    const project = await projectService.createProject(req.body, req.account.id, organizationId);
    res.status(http_status_1.default.CREATED).send(project);
});
exports.getProject = (0, index_1.catchAsync)(async (req, res) => {
    if (!req.account)
        throw new index_2.ApiError(http_status_1.default.FORBIDDEN, 'Access denied');
    const { projectId } = req.params;
    const project = await projectService.getProject(projectId);
    if (!project) {
        throw new index_2.ApiError(http_status_1.default.NOT_FOUND, 'Project not found');
    }
    // Optionally validate if project.organizationId === req.params.organizationId
    res.send(project);
});
exports.getProjectStats = (0, index_1.catchAsync)(async (req, res) => {
    if (!req.account)
        throw new index_2.ApiError(http_status_1.default.FORBIDDEN, 'Access denied');
    const { organizationId, projectId } = req.params;
    const stats = await projectService.getProjectStats(projectId, organizationId);
    res.send(stats);
});
exports.updateProject = (0, index_1.catchAsync)(async (req, res) => {
    if (!req.account)
        throw new index_2.ApiError(http_status_1.default.FORBIDDEN, 'Access denied');
    const { projectId } = req.params;
    const project = await projectService.updateProject(projectId, req.body, req.account.id);
    res.send(project);
});
exports.getUserProjects = (0, index_1.catchAsync)(async (req, res) => {
    if (!req.account)
        throw new index_2.ApiError(http_status_1.default.FORBIDDEN, 'Access denied');
    const { organizationId } = req.params;
    const page = parseInt(req.query['page']) || 1;
    const limit = parseInt(req.query['limit']) || 10;
    const filter = {};
    if (req.query['status']) {
        filter.status = req.query['status'];
    }
    const search = req.query['search'] || '';
    const result = await projectService.getUserProjects(req.account.id, organizationId, page, limit, filter, search);
    res.send(result);
});
exports.getDesktopUserProjects = (0, index_1.catchAsync)(async (req, res) => {
    if (!req.account)
        throw new index_2.ApiError(http_status_1.default.FORBIDDEN, 'Access denied');
    const page = parseInt(req.query['page']) || 1;
    const limit = parseInt(req.query['limit']) || 10;
    const filter = {};
    if (req.query['status']) {
        filter.status = req.query['status'];
    }
    const search = req.query['search'] || '';
    const result = await projectService.getUserProjects(req.account.id, undefined, page, limit, filter, search);
    res.send(result);
});
exports.inviteUser = (0, index_1.catchAsync)(async (req, res) => {
    if (!req.account)
        throw new index_2.ApiError(http_status_1.default.FORBIDDEN, 'Access denied');
    const { projectId } = req.params;
    const { members } = req.body;
    const result = await projectService.inviteUserToProject(projectId, members, req.account.id);
    res.status(http_status_1.default.OK).send(result);
});
exports.getProjectMembers = (0, index_1.catchAsync)(async (req, res) => {
    if (!req.account)
        throw new index_2.ApiError(http_status_1.default.FORBIDDEN, 'Access denied');
    const { projectId } = req.params;
    const page = parseInt(req.query['page']) || 1;
    const limit = parseInt(req.query['limit']) || 10;
    const filter = {};
    if (req.query['role']) {
        filter.role = req.query['role'];
    }
    if (req.query['status']) {
        filter.status = req.query['status'];
    }
    const search = req.query['search'] || '';
    // Check if user has access to project? Usually needed but assumed covered by permissions middleware or project existence check inside service/middleware.
    // However, existing "getProject" does not explicitly check if user is manager, but we might rely on route permissions.
    const result = await projectService.getProjectMembers(projectId, filter, { page, limit }, search);
    res.send(result);
});
exports.getProjectInvitations = (0, index_1.catchAsync)(async (req, res) => {
    if (!req.account)
        throw new index_2.ApiError(http_status_1.default.FORBIDDEN, 'Access denied');
    const { projectId } = req.params;
    const page = parseInt(req.query['page']) || 1;
    const limit = parseInt(req.query['limit']) || 10;
    const result = await projectService.getProjectInvitations(projectId, { page, limit });
    res.send(result);
});
exports.getProjectMemberProfile = (0, index_1.catchAsync)(async (req, res) => {
    if (!req.account)
        throw new index_2.ApiError(http_status_1.default.FORBIDDEN, 'Access denied');
    const { projectId, userId, organizationId } = req.params;
    const startDate = req.query['startDate'];
    const endDate = req.query['endDate'];
    const result = await projectService.getProjectMemberProfile(projectId, userId, organizationId, startDate, endDate);
    res.send(result);
});
exports.updateProjectMemberProfile = (0, index_1.catchAsync)(async (req, res) => {
    if (!req.account)
        throw new index_2.ApiError(http_status_1.default.FORBIDDEN, 'Access denied');
    const { projectId, userId, organizationId } = req.params;
    const result = await projectService.updateProjectMemberProfile(projectId, userId, organizationId, req.account.id, req.body);
    res.send(result);
});
exports.assignProjectMember = (0, index_1.catchAsync)(async (req, res) => {
    if (!req.account)
        throw new index_2.ApiError(http_status_1.default.FORBIDDEN, 'Access denied');
    const { projectId, organizationId } = req.params;
    const { userId, role } = req.body;
    const result = await projectService.assignProjectMember(organizationId, projectId, userId, role, req.account.id);
    res.status(http_status_1.default.CREATED).send(result);
});
exports.unassignProjectMember = (0, index_1.catchAsync)(async (req, res) => {
    if (!req.account)
        throw new index_2.ApiError(http_status_1.default.FORBIDDEN, 'Access denied');
    const { projectId, organizationId, userId } = req.params;
    const result = await projectService.unassignProjectMember(organizationId, projectId, userId, req.account.id);
    res.send(result);
});
exports.createInternalProject = (0, index_1.catchAsync)(async (req, res) => {
    if (!req.account)
        throw new index_2.ApiError(http_status_1.default.FORBIDDEN, 'Access denied');
    const project = await projectService.createInternalProject(req.body, req.account.id);
    res.status(http_status_1.default.CREATED).send(project);
});
exports.getInternalProjects = (0, index_1.catchAsync)(async (req, res) => {
    const filter = Object.assign({}, req.query);
    const options = {
        limit: req.query['limit'] || 10,
        page: req.query['page'] || 1,
        sortBy: req.query['sortBy'] || 'createdAt:desc',
        populate: 'organization'
    };
    // Clean filter keys relevant to pagination
    delete filter['limit'];
    delete filter['page'];
    delete filter['sortBy'];
    // Handle search in filter if your paginate plugin supports it in the query object or via separate option
    // Assuming standard mongoose-paginate-v2 style filter
    if (filter['search']) {
        filter['$or'] = [
            { name: { $regex: filter['search'], $options: 'i' } },
            { description: { $regex: filter['search'], $options: 'i' } }
        ];
        delete filter['search'];
    }
    else {
        delete filter['search'];
    }
    const result = await projectService.getInternalProjects(filter, options);
    res.send(result);
});
exports.getInternalProject = (0, index_1.catchAsync)(async (req, res) => {
    const project = await projectService.getInternalProjectById(req.params['projectId']);
    if (!project) {
        throw new index_2.ApiError(http_status_1.default.NOT_FOUND, 'Project not found');
    }
    res.send(project);
});
exports.addProjectMemberInternal = (0, index_1.catchAsync)(async (req, res) => {
    if (!req.account)
        throw new index_2.ApiError(http_status_1.default.FORBIDDEN, 'Access denied');
    const { projectId } = req.params;
    const { userId, organizationId, role } = req.body;
    const member = await projectService.addMemberToProjectInternal(projectId, organizationId, userId, role, req.account.id);
    res.status(http_status_1.default.CREATED).send(member);
});
exports.getInternalProjectMembers = (0, index_1.catchAsync)(async (req, res) => {
    const { projectId } = req.params;
    const page = parseInt(req.query['page'], 10) || 1;
    const limit = parseInt(req.query['limit'], 10) || 10;
    const filter = {};
    if (req.query['role']) {
        filter.role = req.query['role'];
    }
    if (req.query['status']) {
        filter.status = req.query['status'];
    }
    const search = req.query['search'] || '';
    const result = await projectService.getProjectMembers(projectId, filter, { page, limit }, search);
    res.send(result);
});
//# sourceMappingURL=project.controller.js.map