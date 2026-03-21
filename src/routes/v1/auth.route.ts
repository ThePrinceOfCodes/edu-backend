import express from 'express';
import validate from '../../modules/validate/validate.middleware';
import * as authValidation from '../../modules/auth/auth.validation';
import * as authController from '../../modules/auth/auth.controller';

const router = express.Router();

router.post('/register-company', validate(authValidation.register), authController.register);
router.post('/login', validate(authValidation.login), authController.login);
router.post('/verify', validate(authValidation.verifyEmail), authController.verifyEmail);
router.post("/refresh-tokens", authController.refreshTokens);
router.post('/forgot-password', validate(authValidation.forgotPassword), authController.forgotPassword);
router.post('/finish-reset-password', validate(authValidation.resetPassword), authController.resetPassword);
router.post('/verify-reset-token', validate(authValidation.verifyToken), authController.verifyResetToken);

export default router;
