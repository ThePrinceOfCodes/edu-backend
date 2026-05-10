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
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const validate_middleware_1 = __importDefault(require("../../modules/validate/validate.middleware"));
const auth_1 = require("../../modules/auth");
const termValidation = __importStar(require("../../modules/term/term.validation"));
const termController = __importStar(require("../../modules/term/term.controller"));
const router = express_1.default.Router();
router.get('/active', auth_1.authenticate, (0, auth_1.authorize)('terms.read'), (0, validate_middleware_1.default)(termValidation.getActiveTerm), termController.getActiveTerm);
router.get('/by-date-range', auth_1.authenticate, (0, auth_1.authorize)('terms.read'), (0, validate_middleware_1.default)(termValidation.getTermByDateRange), termController.getTermByDateRange);
router
    .route('/')
    .post(auth_1.authenticate, (0, auth_1.authorize)('terms.write'), (0, validate_middleware_1.default)(termValidation.createTerm), termController.createTerm)
    .get(auth_1.authenticate, (0, auth_1.authorize)('terms.read'), (0, validate_middleware_1.default)(termValidation.getTerms), termController.getTerms);
router
    .route('/:termId')
    .get(auth_1.authenticate, (0, auth_1.authorize)('terms.read'), (0, validate_middleware_1.default)(termValidation.getTerm), termController.getTerm)
    .patch(auth_1.authenticate, (0, auth_1.authorize)('terms.write'), (0, validate_middleware_1.default)(termValidation.updateTerm), termController.updateTerm)
    .delete(auth_1.authenticate, (0, auth_1.authorize)('terms.write'), (0, validate_middleware_1.default)(termValidation.deleteTerm), termController.deleteTerm);
exports.default = router;
//# sourceMappingURL=term.route.js.map