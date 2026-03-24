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
const auth_1 = require("../../modules/auth");
const academicSessionValidation = __importStar(require("../../modules/academic-session/academicSession.validation"));
const academicSessionController = __importStar(require("../../modules/academic-session/academicSession.controller"));
const router = express_1.default.Router();
router
    .route('/')
    .post(auth_1.authenticate, (0, auth_1.authorize)('academicSessions.write'), (0, validate_middleware_1.default)(academicSessionValidation.createAcademicSession), academicSessionController.createAcademicSession)
    .get(auth_1.authenticate, (0, auth_1.authorize)('academicSessions.read'), (0, validate_middleware_1.default)(academicSessionValidation.getAcademicSessions), academicSessionController.getAcademicSessions);
router
    .route('/:academicSessionId')
    .get(auth_1.authenticate, (0, auth_1.authorize)('academicSessions.read'), (0, validate_middleware_1.default)(academicSessionValidation.getAcademicSession), academicSessionController.getAcademicSession)
    .patch(auth_1.authenticate, (0, auth_1.authorize)('academicSessions.write'), (0, validate_middleware_1.default)(academicSessionValidation.updateAcademicSession), academicSessionController.updateAcademicSession)
    .delete(auth_1.authenticate, (0, auth_1.authorize)('academicSessions.write'), (0, validate_middleware_1.default)(academicSessionValidation.deleteAcademicSession), academicSessionController.deleteAcademicSession);
exports.default = router;
//# sourceMappingURL=academicSession.route.js.map