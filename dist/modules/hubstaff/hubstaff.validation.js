"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.disconnect = exports.getProjects = exports.exchangeToken = exports.getAuthUrl = void 0;
const joi_1 = __importDefault(require("joi"));
exports.getAuthUrl = {
    params: joi_1.default.object().keys({
        organizationId: joi_1.default.string().required().uuid()
    })
};
exports.exchangeToken = {
    params: joi_1.default.object().keys({
        organizationId: joi_1.default.string().required().uuid()
    }),
    body: joi_1.default.object().keys({
        code: joi_1.default.string().required()
    })
};
exports.getProjects = {
    params: joi_1.default.object().keys({
        organizationId: joi_1.default.string().required().uuid()
    })
};
exports.disconnect = {
    params: joi_1.default.object().keys({
        organizationId: joi_1.default.string().required().uuid()
    })
};
//# sourceMappingURL=hubstaff.validation.js.map