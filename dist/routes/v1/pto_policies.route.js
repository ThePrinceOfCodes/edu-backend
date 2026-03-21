"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const access_constants_1 = require("@src/modules/access/access.constants");
const access_middleware_1 = require("@src/modules/access/access.middleware");
const paid_time_offs_1 = require("@src/modules/paid_time_offs");
const validate_middleware_1 = __importDefault(require("@src/modules/validate/validate.middleware"));
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router({ mergeParams: true });
router
    .route("/")
    .post((0, access_middleware_1.requirePermission)(access_constants_1.PERMISSIONS.MANAGE_PTO_POLICIES), (0, validate_middleware_1.default)(paid_time_offs_1.ptoPolicyValidation.createPTOPolicy), paid_time_offs_1.ptoPolicyController.createPTOPolicy)
    .get((0, access_middleware_1.requirePermission)(access_constants_1.PERMISSIONS.VIEW_PTO_POLICIES), (0, validate_middleware_1.default)(paid_time_offs_1.ptoPolicyValidation.getPTOPolicies), paid_time_offs_1.ptoPolicyController.getPTOPolicies);
router
    .route("/:ptoPolicyId")
    .patch((0, access_middleware_1.requirePermission)(access_constants_1.PERMISSIONS.MANAGE_PTO_POLICIES), (0, validate_middleware_1.default)(paid_time_offs_1.ptoPolicyValidation.updatePTOPolicy), paid_time_offs_1.ptoPolicyController.updatePTOPolicy);
exports.default = router;
//# sourceMappingURL=pto_policies.route.js.map