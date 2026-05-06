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
const classValidation = __importStar(require("../../modules/class/class.validation"));
const classController = __importStar(require("../../modules/class/class.controller"));
const router = express_1.default.Router();
router
    .route('/')
    .post(auth_1.authenticate, (0, auth_1.authorize)('classes.write'), (0, validate_middleware_1.default)(classValidation.createClass), classController.createClass)
    .get(auth_1.authenticate, (0, auth_1.authorize)('classes.read'), (0, validate_middleware_1.default)(classValidation.getClasses), classController.getClasses);
router
    .route('/:classId')
    .get(auth_1.authenticate, (0, auth_1.authorize)('classes.read'), (0, validate_middleware_1.default)(classValidation.getClass), classController.getClass)
    .patch(auth_1.authenticate, (0, auth_1.authorize)('classes.write'), (0, validate_middleware_1.default)(classValidation.updateClass), classController.updateClass)
    .delete(auth_1.authenticate, (0, auth_1.authorize)('classes.write'), (0, validate_middleware_1.default)(classValidation.deleteClass), classController.deleteClass);
exports.default = router;
//# sourceMappingURL=class.route.js.map