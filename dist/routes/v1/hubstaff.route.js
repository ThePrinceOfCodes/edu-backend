"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const validate_middleware_1 = __importDefault(require("../../modules/validate/validate.middleware"));
const index_1 = require("../../modules/hubstaff/index");
const access_middleware_1 = require("@src/modules/access/access.middleware");
const access_constants_1 = require("@src/modules/access/access.constants");
const router = express_1.default.Router({ mergeParams: true });
router.get('/auth', (0, validate_middleware_1.default)(index_1.hubstaffValidation.getAuthUrl), index_1.hubstaffController.getAuthUrl);
router.post('/exchange-token', (0, validate_middleware_1.default)(index_1.hubstaffValidation.exchangeToken), index_1.hubstaffController.exchangeToken);
router.get('/projects', (0, validate_middleware_1.default)(index_1.hubstaffValidation.getProjects), index_1.hubstaffController.getProjects);
router.delete('/disconnect', (0, access_middleware_1.requirePermission)(access_constants_1.PERMISSIONS.MANAGE_ACCESS_MANAGEMENT), (0, validate_middleware_1.default)(index_1.hubstaffValidation.disconnect), index_1.hubstaffController.disconnect);
exports.default = router;
//# sourceMappingURL=hubstaff.route.js.map