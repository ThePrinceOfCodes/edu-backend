"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteClass = exports.updateClass = exports.getClass = exports.getClasses = exports.createClass = void 0;
const joi_1 = __importDefault(require("joi"));
exports.createClass = {
    body: joi_1.default.object().keys({
        name: joi_1.default.string().trim().required(),
        code: joi_1.default.string().trim().required(),
        schoolTypeId: joi_1.default.string().trim().required(),
    }),
};
exports.getClasses = {
    query: joi_1.default.object().keys({
        name: joi_1.default.string(),
        code: joi_1.default.string(),
        schoolTypeId: joi_1.default.string(),
        sortBy: joi_1.default.string(),
        limit: joi_1.default.number().integer(),
        page: joi_1.default.number().integer(),
    }),
};
exports.getClass = {
    params: joi_1.default.object().keys({
        classId: joi_1.default.string().required(),
    }),
};
exports.updateClass = {
    params: joi_1.default.object().keys({
        classId: joi_1.default.string().required(),
    }),
    body: joi_1.default.object()
        .keys({
        name: joi_1.default.string().trim(),
        code: joi_1.default.string().trim(),
        schoolTypeId: joi_1.default.string().trim(),
    })
        .min(1),
};
exports.deleteClass = {
    params: joi_1.default.object().keys({
        classId: joi_1.default.string().required(),
    }),
};
//# sourceMappingURL=class.validation.js.map