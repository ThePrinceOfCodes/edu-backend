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
exports.removeInvitation = exports.resendInvitation = exports.updateInvitation = exports.getInvitations = exports.updateMember = exports.getMember = exports.getMembers = exports.rejectInvitation = exports.acceptInvitation = exports.inviteOrganizationMember = exports.getOrganizationUsers = exports.resendOrganizationOnboarding = exports.enableOrganization = exports.disableOrganization = exports.updateInsights = exports.updateOrganization = exports.getOrganization = exports.getOrganizations = exports.createInternalOrganization = exports.getMyOrganizations = exports.inviteMembers = exports.inviteMember = exports.createOrganization = void 0;
const http_status_1 = __importDefault(require("http-status"));
const index_1 = require("../utils/index");
const organizationService = __importStar(require("./organization.service"));
const index_2 = require("../errors/index");
const auth_1 = require("../auth");
const rbac_1 = require("../rbac");
const organization_model_1 = __importDefault(require("./organization.model"));
exports.createOrganization = (0, index_1.catchAsync)(async (req, res) => {
    if (!req.account)
        throw new index_2.ApiError(http_status_1.default.FORBIDDEN, 'Access denied');
    const organization = await organizationService.createOrganization(Object.assign({}, req.body), req.account.id);
    res.status(http_status_1.default.CREATED).send(organization);
});
exports.inviteMember = (0, index_1.catchAsync)(async (req, res) => {
    if (!req.account)
        throw new index_2.ApiError(http_status_1.default.FORBIDDEN, 'Access denied');
    const { organizationId } = req.params;
    const member = await organizationService.inviteMember(organizationId, req.body.userId, req.account.id);
    res.status(http_status_1.default.CREATED).send(member);
});
exports.inviteMembers = (0, index_1.catchAsync)(async (req, res) => {
    if (!req.account)
        throw new index_2.ApiError(http_status_1.default.FORBIDDEN, 'Access denied');
    const { organizationId } = req.params;
    const result = await organizationService.inviteUsersToOrganization(organizationId, req.body.members, req.account.id);
    res.status(http_status_1.default.OK).send(result);
});
exports.getMyOrganizations = (0, index_1.catchAsync)(async (req, res) => {
    if (!req.account)
        throw new index_2.ApiError(http_status_1.default.FORBIDDEN, 'Access denied');
    const organizations = await organizationService.getUserOrganizations(req.account.id);
    res.send(organizations);
});
exports.createInternalOrganization = (0, index_1.catchAsync)(async (req, res) => {
    if (!req.account)
        throw new index_2.ApiError(http_status_1.default.FORBIDDEN, 'Access denied');
    const organization = await organizationService.createInternalOrganization(req.body, req.account.id);
    res.status(http_status_1.default.CREATED).send(organization);
});
exports.getOrganizations = (0, index_1.catchAsync)(async (req, res) => {
    const filter = Object.assign({}, req.query);
    const options = {
        limit: req.query['limit'] || 10,
        page: req.query['page'] || 1,
        sortBy: req.query['sortBy'] || 'createdAt:desc',
    };
    // Clean up filter object to remove pagination options
    delete filter['limit'];
    delete filter['page'];
    delete filter['sortBy'];
    if (req.query['search']) {
        filter['search'] = req.query['search'];
    }
    else {
        delete filter['search'];
    }
    const result = await organizationService.getOrganizations(filter, options);
    res.send(result);
});
exports.getOrganization = (0, index_1.catchAsync)(async (req, res) => {
    const organization = await organizationService.getOrganizationById(req.params['organizationId']);
    if (!organization) {
        throw new index_2.ApiError(http_status_1.default.NOT_FOUND, 'Organization not found');
    }
    res.send(organization);
});
exports.updateOrganization = (0, index_1.catchAsync)(async (req, res) => {
    if (!req.account)
        throw new index_2.ApiError(http_status_1.default.FORBIDDEN, 'Access denied');
    const organization = await organizationService.updateOrganizationById(req.params['organizationId'], req.body, req.account.id);
    res.send(organization);
});
exports.updateInsights = (0, index_1.catchAsync)(async (req, res) => {
    if (!req.account)
        throw new index_2.ApiError(http_status_1.default.FORBIDDEN, 'Access denied');
    const { organizationId } = req.params;
    const { enableInsights } = req.body;
    const organization = await organizationService.updateOrganizationById(organizationId, { enableInsights }, req.account.id);
    res.send(organization);
});
exports.disableOrganization = (0, index_1.catchAsync)(async (req, res) => {
    if (!req.account)
        throw new index_2.ApiError(http_status_1.default.FORBIDDEN, 'Access denied');
    await organizationService.disableOrganizationById(req.params['organizationId'], req.account.id);
    res.status(http_status_1.default.NO_CONTENT).send();
});
exports.enableOrganization = (0, index_1.catchAsync)(async (req, res) => {
    if (!req.account)
        throw new index_2.ApiError(http_status_1.default.FORBIDDEN, 'Access denied');
    await organizationService.enableOrganizationById(req.params['organizationId'], req.account.id);
    res.status(http_status_1.default.OK).send({ success: true, message: 'Organization enabled' });
});
exports.resendOrganizationOnboarding = (0, index_1.catchAsync)(async (req, res) => {
    await organizationService.resendOrganizationOnboarding(req.params['organizationId']);
    res.status(http_status_1.default.OK).send({ success: true, message: 'Onboarding email sent' });
});
exports.getOrganizationUsers = (0, index_1.catchAsync)(async (req, res) => {
    const options = (0, index_1.pick)(req.query, ['limit', 'page', 'sortBy']);
    const filter = Object.assign(Object.assign(Object.assign(Object.assign({ organizationId: req.params['organizationId'] }, (req.query['role'] ? { role: req.query['role'] } : {})), (req.query['status'] ? { status: req.query['status'] } : {})), (req.query['search'] ? { search: req.query['search'] } : {})), (req.query['email'] ? { email: req.query['email'] } : {}));
    const users = await organizationService.getOrganizationMembers(filter, options);
    res.send(users);
});
exports.inviteOrganizationMember = (0, index_1.catchAsync)(async (req, res) => {
    if (!req.account)
        throw new index_2.ApiError(http_status_1.default.FORBIDDEN, 'Access denied');
    const { organizationId } = req.params;
    const { payload } = req.body;
    const membersPayload = Array.isArray(payload) ? payload : [payload];
    const members = await organizationService.inviteUsersToOrganization(organizationId, membersPayload, req.account.id);
    res.status(http_status_1.default.CREATED).send(members);
});
exports.acceptInvitation = (0, index_1.catchAsync)(async (req, res) => {
    if (!req.account)
        throw new index_2.ApiError(http_status_1.default.FORBIDDEN, 'Access denied');
    const { organizationId } = req.params;
    const { user } = await organizationService.acceptOrganizationInvitation(req.account.id, organizationId);
    const tokens = await auth_1.authService.generateAuthTokens(user, organizationId);
    const organization = await organization_model_1.default.findById(organizationId);
    let permissions = [];
    if (user.accountType === 'internal') {
        const perms = await rbac_1.rbacService.getUserEffectivePermissions(user.id);
        permissions = perms.map((p) => p.permission);
    }
    res.send({ account: user, credentials: tokens, organization, permissions });
});
exports.rejectInvitation = (0, index_1.catchAsync)(async (req, res) => {
    if (!req.account)
        throw new index_2.ApiError(http_status_1.default.FORBIDDEN, 'Access denied');
    const { organizationId } = req.params;
    const result = await organizationService.rejectOrganizationInvitation(req.account.id, organizationId);
    res.status(http_status_1.default.OK).send(result);
});
exports.getMembers = (0, index_1.catchAsync)(async (req, res) => {
    const { organizationId } = req.params;
    const filter = Object.assign(Object.assign(Object.assign(Object.assign({ organizationId }, (req.query['role'] ? { role: req.query['role'] } : {})), (req.query['status'] ? { status: req.query['status'] } : {})), (req.query['search'] ? { search: req.query['search'] } : {})), (req.query['email'] ? { email: req.query['email'] } : {}));
    const options = {
        limit: req.query['limit'] ? parseInt(req.query['limit'], 10) : 10,
        page: req.query['page'] ? parseInt(req.query['page'], 10) : 1,
        sortBy: req.query['sortBy'] || 'createdAt:desc',
    };
    const result = await organizationService.getOrganizationMembers(filter, options);
    res.send(result);
});
exports.getMember = (0, index_1.catchAsync)(async (req, res) => {
    const { organizationId, memberId } = req.params;
    const result = await organizationService.getOrganizationMemberById(organizationId, memberId);
    if (!result) {
        throw new index_2.ApiError(http_status_1.default.NOT_FOUND, 'Organization member not found');
    }
    res.send(result);
});
exports.updateMember = (0, index_1.catchAsync)(async (req, res) => {
    if (!req.account)
        throw new index_2.ApiError(http_status_1.default.FORBIDDEN, 'Access denied');
    const { organizationId, memberId } = req.params;
    const result = await organizationService.updateOrganizationMemberById(organizationId, memberId, req.account.id, req.body);
    if (!result) {
        throw new index_2.ApiError(http_status_1.default.NOT_FOUND, 'Organization member not found');
    }
    res.send(result);
});
exports.getInvitations = (0, index_1.catchAsync)(async (req, res) => {
    const { organizationId } = req.params;
    const filter = { organizationId, status: 'pending' };
    const options = {
        limit: req.query['limit'] ? parseInt(req.query['limit'], 10) : 10,
        page: req.query['page'] ? parseInt(req.query['page'], 10) : 1,
        sortBy: req.query['sortBy'] || 'createdAt:desc',
        populate: 'organization',
    };
    const result = await organizationService.getOrganizationInvitations(filter, options);
    res.send(result);
});
exports.updateInvitation = (0, index_1.catchAsync)(async (req, res) => {
    if (!req.account)
        throw new index_2.ApiError(http_status_1.default.FORBIDDEN, 'Access denied');
    const { organizationId, invitationToken } = req.params;
    const result = await organizationService.updateOrganizationInvitationByToken(organizationId, invitationToken, req.account.id, req.body);
    if (!result) {
        throw new index_2.ApiError(http_status_1.default.NOT_FOUND, 'Invitation not found');
    }
    res.send(result);
});
exports.resendInvitation = (0, index_1.catchAsync)(async (req, res) => {
    if (!req.account)
        throw new index_2.ApiError(http_status_1.default.FORBIDDEN, 'Access denied');
    const { organizationId, invitationToken } = req.params;
    const result = await organizationService.resendOrganizationInvitationByToken(organizationId, invitationToken, req.account.id);
    if (!result) {
        throw new index_2.ApiError(http_status_1.default.NOT_FOUND, 'Invitation not found');
    }
    res.send({ success: true, message: 'Invitation resent' });
});
exports.removeInvitation = (0, index_1.catchAsync)(async (req, res) => {
    if (!req.account)
        throw new index_2.ApiError(http_status_1.default.FORBIDDEN, 'Access denied');
    const { organizationId, invitationToken } = req.params;
    const result = await organizationService.removeOrganizationInvitationByToken(organizationId, invitationToken, req.account.id);
    if (!result) {
        throw new index_2.ApiError(http_status_1.default.NOT_FOUND, 'Invitation not found');
    }
    res.send({ success: true, message: 'Invitation removed' });
});
//# sourceMappingURL=organization.controller.js.map