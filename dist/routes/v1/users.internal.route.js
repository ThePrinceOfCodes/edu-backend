"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const index_1 = require("../../modules/users/index");
const index_2 = require("../../modules/auth/index");
const access_middleware_1 = require("../../modules/access/access.middleware");
const index_3 = require("../../modules/validate/index");
const user_validation_1 = require("../../modules/users/user.validation");
const router = express_1.default.Router();
router.get('/me', index_2.authenticate, index_1.userController.getLoggedInUser);
router.patch('/me/profile', index_2.authenticate, (0, index_3.validate)(user_validation_1.updateProfile), index_1.userController.updateProfile);
router.post('/me/profile-image', index_2.authenticate, (0, index_3.validate)(user_validation_1.saveOrEditProfileImage), index_1.userController.saveOrEditProfileImage);
router.delete('/me/profile-image', index_2.authenticate, index_1.userController.deleteProfileImage);
router.patch('/me/two-factor', index_2.authenticate, (0, index_3.validate)(user_validation_1.updateTwoFactor), index_1.userController.updateTwoFactor);
router.patch('/me/password', index_2.authenticate, (0, index_3.validate)(user_validation_1.changeMyPassword), index_1.userController.changeMyPassword);
router.post('/', index_2.authenticate, (0, access_middleware_1.requirePermission)('view_users'), (0, index_3.validate)(user_validation_1.createUser), index_1.userController.createInternalUser);
router.get('/', index_2.authenticate, (0, access_middleware_1.requirePermission)('view_users'), index_1.userController.getInternalUsers);
router.post('/:userId/reset-password', index_2.authenticate, (0, access_middleware_1.requirePermission)('view_users'), index_1.userController.resetUserPassword);
router.post('/:userId/disable', index_2.authenticate, (0, access_middleware_1.requirePermission)('view_users'), index_1.userController.disableUser);
router.post('/:userId/restore', index_2.authenticate, (0, access_middleware_1.requirePermission)('view_users'), index_1.userController.restoreUser);
exports.default = router;
//# sourceMappingURL=users.internal.route.js.map