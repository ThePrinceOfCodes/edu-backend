"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const index_1 = require("../../modules/auth/index");
const access_middleware_1 = require("../../modules/access/access.middleware");
const index_2 = require("../../modules/analytics/index");
const router = express_1.default.Router();
router.use(index_1.authenticate);
router.get('/stats', (0, access_middleware_1.requirePermission)('view_dashboard'), index_2.analyticsController.getSystemStats);
router.get('/stats/projects', (0, access_middleware_1.requirePermission)('view_dashboard'), index_2.analyticsController.getProjectStats);
router.get('/stats/organizations', (0, access_middleware_1.requirePermission)('view_dashboard'), index_2.analyticsController.getOrganizationStats);
exports.default = router;
//# sourceMappingURL=analytics.internal.route.js.map