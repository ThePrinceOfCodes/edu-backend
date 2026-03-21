"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDashboard = void 0;
const joi_1 = __importDefault(require("joi"));
exports.getDashboard = {
    params: joi_1.default.object().keys({
        organizationId: joi_1.default.string().uuid().required(),
    }),
};
//# sourceMappingURL=dashboard.validation.js.map