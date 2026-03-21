"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const index_1 = require("../../modules/auth/index");
const access_middleware_1 = require("../../modules/access/access.middleware");
const validate_middleware_1 = __importDefault(require("../../modules/validate/validate.middleware"));
const index_2 = require("../../modules/activity_logs/index");
const router = express_1.default.Router();
router.use(index_1.authenticate);
router.get('/', (0, access_middleware_1.requirePermission)('view_audit_trail'), (0, validate_middleware_1.default)(index_2.activityLogValidation.getActivityLogs), index_2.activityLogController.getActivityLogs);
router.get('/latest', (0, access_middleware_1.requirePermission)('view_audit_trail'), index_2.activityLogController.getLatestActivityLogs);
exports.default = router;
//# sourceMappingURL=activity-logs.internal.route.js.map