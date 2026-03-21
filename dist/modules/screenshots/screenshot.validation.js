"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadScreenshot = void 0;
const joi_1 = __importDefault(require("joi"));
exports.uploadScreenshot = {
    body: joi_1.default.object().keys({
        sessionUuid: joi_1.default.string().required(),
        projectId: joi_1.default.string().required(),
        timestamp: joi_1.default.number().required(),
        image: joi_1.default.string().required().description('Base64 image string'),
        fileExt: joi_1.default.string()
    }),
};
//# sourceMappingURL=screenshot.validation.js.map