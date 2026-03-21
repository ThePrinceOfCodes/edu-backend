"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const validate_middleware_1 = __importDefault(require("../../modules/validate/validate.middleware"));
const index_1 = require("../../modules/paid_time_offs/index");
const access_1 = require("../../modules/access");
const router = express_1.default.Router({ mergeParams: true });
const { requirePermission } = access_1.accessMiddleware;
const { PERMISSIONS } = access_1.accessConstants;
router
    .route('/')
    .post(requirePermission(PERMISSIONS.CREATE_PAID_TIME_OFF), (0, validate_middleware_1.default)(index_1.paidTimeOffValidation.createPaidTimeOff), index_1.paidTimeOffController.createPaidTimeOff)
    .get(requirePermission(PERMISSIONS.VIEW_PAID_TIME_OFFS), (0, validate_middleware_1.default)(index_1.paidTimeOffValidation.getPaidTimeOffs), index_1.paidTimeOffController.getPaidTimeOffs);
router.get("/me", requirePermission(PERMISSIONS.VIEW_PAID_TIME_OFFS), index_1.paidTimeOffController.getMyPaidTimeOffs);
router.get("/me/used-hours", requirePermission(PERMISSIONS.VIEW_PAID_TIME_OFFS), index_1.paidTimeOffController.getMyUsedHours);
router.patch('/:paidTimeOffId/review', requirePermission(PERMISSIONS.MANAGE_PAID_TIME_OFFS), (0, validate_middleware_1.default)(index_1.paidTimeOffValidation.reviewPaidTimeOff), index_1.paidTimeOffController.reviewPaidTimeOff);
exports.default = router;
//# sourceMappingURL=paid_time_offs.route.js.map