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
const projectValidation = __importStar(require("../../modules/projects/project.validation"));
const index_1 = require("../../modules/projects/index");
const index_2 = require("../../modules/auth/index");
const access_1 = require("../../modules/access");
const router = express_1.default.Router({ mergeParams: true });
const { requirePermission } = access_1.accessMiddleware;
const { PERMISSIONS } = access_1.accessConstants;
router.use(index_2.authenticate);
router.post('/', requirePermission(PERMISSIONS.MANAGE_PROJECTS), (0, validate_middleware_1.default)(projectValidation.createProject), index_1.projectController.createProject);
router.get('/', requirePermission(PERMISSIONS.VIEW_PROJECTS), index_1.projectController.getUserProjects);
router.get('/:projectId', requirePermission(PERMISSIONS.VIEW_PROJECTS), (0, validate_middleware_1.default)(projectValidation.getProject), index_1.projectController.getProject);
router.get('/:projectId/stats', requirePermission(PERMISSIONS.VIEW_PROJECTS), (0, validate_middleware_1.default)(projectValidation.getProjectStats), index_1.projectController.getProjectStats);
router.patch('/:projectId', requirePermission(PERMISSIONS.MANAGE_PROJECTS), (0, validate_middleware_1.default)(projectValidation.updateProject), index_1.projectController.updateProject);
router.post('/:projectId/invite', requirePermission(PERMISSIONS.MANAGE_PROJECTS), (0, validate_middleware_1.default)(projectValidation.inviteUser), index_1.projectController.inviteUser);
router.get('/:projectId/invitations', requirePermission(PERMISSIONS.MANAGE_PROJECTS), (0, validate_middleware_1.default)(projectValidation.getProjectInvitations), index_1.projectController.getProjectInvitations);
router.get('/:projectId/members/:userId/profile', requirePermission(PERMISSIONS.VIEW_PROJECTS), (0, validate_middleware_1.default)(projectValidation.getProjectMemberProfile), index_1.projectController.getProjectMemberProfile);
router.patch('/:projectId/members/:userId/profile', requirePermission(PERMISSIONS.MANAGE_PROJECTS), (0, validate_middleware_1.default)(projectValidation.updateProjectMemberProfile), index_1.projectController.updateProjectMemberProfile);
router.post('/:projectId/members', requirePermission(PERMISSIONS.MANAGE_PROJECTS), (0, validate_middleware_1.default)(projectValidation.assignProjectMember), index_1.projectController.assignProjectMember);
router.delete('/:projectId/members/:userId', requirePermission(PERMISSIONS.MANAGE_PROJECTS), (0, validate_middleware_1.default)(projectValidation.unassignProjectMember), index_1.projectController.unassignProjectMember);
router.route('/:projectId/members').get(requirePermission(PERMISSIONS.VIEW_PROJECTS), (0, validate_middleware_1.default)(projectValidation.getProjectMembers), index_1.projectController.getProjectMembers);
exports.default = router;
//# sourceMappingURL=projects.route.js.map