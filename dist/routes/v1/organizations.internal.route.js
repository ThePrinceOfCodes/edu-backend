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
const validate_middleware_1 = __importDefault(require("../../modules/validate/validate.middleware"));
const organizationValidation = __importStar(require("../../modules/organizations/organization.validation"));
const index_1 = require("../../modules/organizations/index");
const index_2 = require("../../modules/auth/index");
const access_middleware_1 = require("../../modules/access/access.middleware");
const router = express_1.default.Router();
router.use(index_2.authenticate);
// Create Organization (Internal)
router.post('/', (0, access_middleware_1.requirePermission)('manage_data_platforms'), (0, validate_middleware_1.default)(organizationValidation.createOrganizationInternal), index_1.organizationController.createInternalOrganization);
// Get Organizations (Internal)
router.get('/', (0, access_middleware_1.requirePermission)('view_users'), (0, validate_middleware_1.default)(organizationValidation.getOrganizations), index_1.organizationController.getOrganizations);
// Get One Organization (Internal)
router.get('/:organizationId', (0, access_middleware_1.requirePermission)('view_users'), (0, validate_middleware_1.default)(organizationValidation.getOrganization), index_1.organizationController.getOrganization);
// Get Organization Users (Internal)
router.get('/:organizationId/users', (0, access_middleware_1.requirePermission)('view_users'), (0, validate_middleware_1.default)(organizationValidation.getOrganizationUsers), index_1.organizationController.getOrganizationUsers);
// Add Organization Staff (Internal)
router.post('/:organizationId/invite', (0, access_middleware_1.requirePermission)('manage_data_platforms'), (0, validate_middleware_1.default)(organizationValidation.addOrganizationStaffInternal), index_1.organizationController.inviteOrganizationMember);
// Update Organization (Internal)
router.patch('/:organizationId', (0, access_middleware_1.requirePermission)('manage_data_platforms'), (0, validate_middleware_1.default)(organizationValidation.updateOrganization), index_1.organizationController.updateOrganization);
// Disable Organization (Internal)
router.delete('/:organizationId', (0, access_middleware_1.requirePermission)('manage_data_platforms'), (0, validate_middleware_1.default)(organizationValidation.disableOrganization), index_1.organizationController.disableOrganization);
// Enable Organization (Internal)
router.patch('/:organizationId/enable', (0, access_middleware_1.requirePermission)('manage_data_platforms'), (0, validate_middleware_1.default)(organizationValidation.enableOrganization), index_1.organizationController.enableOrganization);
// Resend Organization Onboarding Invite (Internal)
router.post('/:organizationId/resend-invite', (0, access_middleware_1.requirePermission)('manage_data_platforms'), (0, validate_middleware_1.default)(organizationValidation.resendOrganizationOnboarding), index_1.organizationController.resendOrganizationOnboarding);
exports.default = router;
//# sourceMappingURL=organizations.internal.route.js.map