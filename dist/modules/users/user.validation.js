"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.changeMyPassword = exports.updateProfile = exports.updateTwoFactor = exports.saveOrEditProfileImage = exports.setupPassword = exports.createUser = void 0;
const joi_1 = __importDefault(require("joi"));
const ALLOWED_IMAGE_EXTENSIONS = ['png', 'jpg', 'jpeg', 'webp'];
const MAX_PROFILE_IMAGE_BYTES = 2 * 1024 * 1024;
const estimateBase64Bytes = (base64Data) => {
    const trimmed = base64Data.trim();
    const padding = trimmed.endsWith('==') ? 2 : trimmed.endsWith('=') ? 1 : 0;
    return Math.floor((trimmed.length * 3) / 4) - padding;
};
const validateProfileImageBase64 = (value, helpers) => {
    var _a;
    const match = value.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
    if (!match) {
        return helpers.message({ custom: 'image must be a valid base64 data URL (data:image/...;base64,...)' });
    }
    const mimeType = match[1] || '';
    const mimeExt = (_a = mimeType.split('/')[1]) === null || _a === void 0 ? void 0 : _a.toLowerCase();
    if (!mimeExt || !ALLOWED_IMAGE_EXTENSIONS.includes(mimeExt)) {
        return helpers.message({ custom: 'image type must be one of png, jpg, jpeg, webp' });
    }
    const base64Data = match[2] || '';
    const estimatedBytes = estimateBase64Bytes(base64Data);
    if (estimatedBytes > MAX_PROFILE_IMAGE_BYTES) {
        return helpers.message({ custom: 'image must be 2MB or less' });
    }
    return value;
};
exports.createUser = {
    body: joi_1.default.object().keys({
        name: joi_1.default.string().required(),
        email: joi_1.default.string().required().email(),
        password: joi_1.default.string().required().min(8),
        role: joi_1.default.string().required(),
    }),
};
exports.setupPassword = {
    body: joi_1.default.object().keys({
        password: joi_1.default.string().required().min(8)
    })
};
exports.saveOrEditProfileImage = {
    body: joi_1.default.object().keys({
        image: joi_1.default.string().required().custom(validateProfileImageBase64).description('Base64 image string'),
        fileExt: joi_1.default.string().optional().valid(...ALLOWED_IMAGE_EXTENSIONS),
    }),
};
exports.updateTwoFactor = {
    body: joi_1.default.object().keys({
        enabled: joi_1.default.boolean().required(),
    }),
};
exports.updateProfile = {
    body: joi_1.default.object().keys({
        name: joi_1.default.string().trim().optional(),
        phoneNumber: joi_1.default.string().trim().allow('').optional(),
    }).min(1),
};
exports.changeMyPassword = {
    body: joi_1.default.object().keys({
        currentPassword: joi_1.default.string().required(),
        password: joi_1.default.string().required().min(8),
    }),
};
//# sourceMappingURL=user.validation.js.map