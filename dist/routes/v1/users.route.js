"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const index_1 = require("../../modules/users/index");
const index_2 = require("../../modules/auth/index");
const index_3 = require("../../modules/validate/index");
const user_validation_1 = require("../../modules/users/user.validation");
const router = express_1.default.Router();
// Public signup is disabled in favor of company registration via auth/register
router.post('/', (0, index_3.validate)(user_validation_1.createUser), index_1.userController.createUser);
router.get('/me', index_2.authenticate, index_1.userController.getLoggedInUser);
router.patch('/me/profile', index_2.authenticate, (0, index_3.validate)(user_validation_1.updateProfile), index_1.userController.updateProfile);
router.post('/me/profile-image', index_2.authenticate, (0, index_3.validate)(user_validation_1.saveOrEditProfileImage), index_1.userController.saveOrEditProfileImage);
router.delete('/me/profile-image', index_2.authenticate, index_1.userController.deleteProfileImage);
router.patch('/me/two-factor', index_2.authenticate, (0, index_3.validate)(user_validation_1.updateTwoFactor), index_1.userController.updateTwoFactor);
router.patch('/me/password', index_2.authenticate, (0, index_3.validate)(user_validation_1.changeMyPassword), index_1.userController.changeMyPassword);
router.post('/setup-password', index_2.authenticate, (0, index_3.validate)(user_validation_1.setupPassword), index_1.userController.setupPassword);
exports.default = router;
//# sourceMappingURL=users.route.js.map