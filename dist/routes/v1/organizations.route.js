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
const express_1 = __importDefault(require("express"));
// Hubstaff Scoped Routes
const hubstaff_route_1 = __importDefault(require("./hubstaff.route"));
const validate_middleware_1 = __importDefault(require("../../modules/validate/validate.middleware"));
const organizationValidation = __importStar(require("../../modules/organizations/organization.validation"));
const index_1 = require("../../modules/organizations/index");
const index_2 = require("../../modules/auth/index");
// Organization Scoped Routes
const projects_route_1 = __importDefault(require("./projects.route"));
const paid_time_offs_route_1 = __importDefault(require("./paid_time_offs.route"));
const index_3 = require("../../modules/auth/index");
const pto_policies_route_1 = __importDefault(require("./pto_policies.route"));
const holiday_route_1 = __importDefault(require("./holiday.route"));
const access_middleware_1 = require("../../modules/access/access.middleware");
const activity_logs_1 = require("../../modules/activity_logs");
const dashboard_route_1 = __importDefault(require("../../modules/dashboard/dashboard.route"));
const router = express_1.default.Router();
router.post('/', index_2.authenticate, (0, validate_middleware_1.default)(organizationValidation.createOrganization), index_1.organizationController.createOrganization);
router.get('/me', index_2.authenticate, index_1.organizationController.getMyOrganizations);
router.post('/:organizationId/invite', index_2.authenticate, (0, validate_middleware_1.default)(organizationValidation.inviteMember), index_1.organizationController.inviteMember);
router.post('/:organizationId/bulk-invite', index_2.authenticate, (0, validate_middleware_1.default)(organizationValidation.inviteMembers), index_1.organizationController.inviteMembers);
router.post('/:organizationId/accept-invitation', index_2.authenticate, index_1.organizationController.acceptInvitation);
router.post('/:organizationId/reject-invitation', index_2.authenticate, index_1.organizationController.rejectInvitation);
router.get('/:organizationId/members', index_2.authenticate, index_3.validateOrganizationAccess, (0, validate_middleware_1.default)(organizationValidation.getMembers), index_1.organizationController.getMembers);
router.get('/:organizationId/members/:memberId', index_2.authenticate, index_3.validateOrganizationAccess, (0, validate_middleware_1.default)(organizationValidation.getMember), index_1.organizationController.getMember);
router.patch('/:organizationId/members/:memberId', index_2.authenticate, index_3.validateOrganizationAccess, (0, validate_middleware_1.default)(organizationValidation.updateMember), index_1.organizationController.updateMember);
router.get('/:organizationId/invitations', index_2.authenticate, index_3.validateOrganizationAccess, (0, validate_middleware_1.default)(organizationValidation.getInvitations), index_1.organizationController.getInvitations);
router.patch('/:organizationId/invitations/:invitationToken', index_2.authenticate, index_3.validateOrganizationAccess, (0, validate_middleware_1.default)(organizationValidation.updateInvitation), index_1.organizationController.updateInvitation);
router.post('/:organizationId/invitations/:invitationToken/resend', index_2.authenticate, index_3.validateOrganizationAccess, (0, validate_middleware_1.default)(organizationValidation.invitationAction), index_1.organizationController.resendInvitation);
router.delete('/:organizationId/invitations/:invitationToken', index_2.authenticate, index_3.validateOrganizationAccess, (0, validate_middleware_1.default)(organizationValidation.invitationAction), index_1.organizationController.removeInvitation);
router.patch('/:organizationId/insights', index_2.authenticate, index_3.validateOrganizationAccess, (0, validate_middleware_1.default)(organizationValidation.updateInsights), index_1.organizationController.updateInsights);
router.get('/:organizationId/activity-logs', index_2.authenticate, index_3.validateOrganizationAccess, (0, access_middleware_1.requirePermission)('view_audit_trail'), (0, validate_middleware_1.default)(activity_logs_1.activityLogValidation.getOrganizationActivityLogs), activity_logs_1.activityLogController.getOrganizationActivityLogs);
router.use('/:organizationId/projects', index_2.authenticate, index_3.validateOrganizationAccess, projects_route_1.default);
router.use('/:organizationId/paid-time-offs', index_2.authenticate, index_3.validateOrganizationAccess, paid_time_offs_route_1.default);
router.use('/:organizationId/pto-policies', index_2.authenticate, index_3.validateOrganizationAccess, pto_policies_route_1.default);
router.use('/:organizationId/holidays', index_2.authenticate, index_3.validateOrganizationAccess, holiday_route_1.default);
router.use('/:organizationId/dashboard', index_2.authenticate, index_3.validateOrganizationAccess, dashboard_route_1.default);
router.use('/:organizationId/hubstaff', index_2.authenticate, index_3.validateOrganizationAccess, hubstaff_route_1.default);
exports.default = router;
//# sourceMappingURL=organizations.route.js.map