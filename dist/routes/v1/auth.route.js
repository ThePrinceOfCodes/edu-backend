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
const authValidation = __importStar(require("../../modules/auth/auth.validation"));
const authController = __importStar(require("../../modules/auth/auth.controller"));
const router = express_1.default.Router();
router.post('/register-company', (0, validate_middleware_1.default)(authValidation.register), authController.register);
router.post('/login', (0, validate_middleware_1.default)(authValidation.login), authController.login);
router.post('/verify', (0, validate_middleware_1.default)(authValidation.verifyEmail), authController.verifyEmail);
router.post("/refresh-tokens", authController.refreshTokens);
router.post('/forgot-password', (0, validate_middleware_1.default)(authValidation.forgotPassword), authController.forgotPassword);
router.post('/finish-reset-password', (0, validate_middleware_1.default)(authValidation.resetPassword), authController.resetPassword);
router.post('/verify-reset-token', (0, validate_middleware_1.default)(authValidation.verifyToken), authController.verifyResetToken);
exports.default = router;
//# sourceMappingURL=auth.route.js.map