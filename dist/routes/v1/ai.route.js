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
const aiValidation = __importStar(require("../../modules/ai/ai.validation"));
const aiController = __importStar(require("../../modules/ai/ai.controller"));
const index_1 = require("../../modules/auth/index");
const router = express_1.default.Router();
router.get('/staff', index_1.authenticate, (0, validate_middleware_1.default)(aiValidation.getStaffInsights), aiController.getStaffInsights);
router.get('/org', index_1.authenticate, (0, validate_middleware_1.default)(aiValidation.getOrgInsights), aiController.getOrgInsights);
router.post('/run-user-insights', index_1.authenticate, (0, validate_middleware_1.default)(aiValidation.runUserInsights), aiController.runUserInsights);
router.get('/insights-to-review', index_1.authenticate, (0, validate_middleware_1.default)(aiValidation.getInsightsToReview), aiController.getInsightsToReview);
router.get('/user-project-insights', index_1.authenticate, (0, validate_middleware_1.default)(aiValidation.getUserProjectInsights), aiController.getUserProjectInsights);
router.patch('/notes/:insightId', index_1.authenticate, (0, validate_middleware_1.default)(aiValidation.updateInsightNotes), aiController.updateInsightNotes);
router.post('/trigger-org-narrative', index_1.authenticate, (0, validate_middleware_1.default)(aiValidation.triggerOrgNarrative), aiController.triggerOrgNarrative);
router.get('/usage', index_1.authenticate, (0, validate_middleware_1.default)(aiValidation.getAiUsage), aiController.getAiUsage);
exports.default = router;
//# sourceMappingURL=ai.route.js.map