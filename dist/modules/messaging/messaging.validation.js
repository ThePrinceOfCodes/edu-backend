"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendMessage = exports.getThreadMessages = exports.getThreads = exports.createThread = void 0;
const joi_1 = __importDefault(require("joi"));
exports.createThread = {
    body: joi_1.default.object().keys({
        title: joi_1.default.string().trim().allow(null, ''),
        participantIds: joi_1.default.array().items(joi_1.default.string().trim()).default([]),
        isBroadcast: joi_1.default.boolean().default(false),
    }),
};
exports.getThreads = {
    query: joi_1.default.object().keys({
        limit: joi_1.default.number().integer(),
        page: joi_1.default.number().integer(),
        sortBy: joi_1.default.string(),
    }),
};
exports.getThreadMessages = {
    params: joi_1.default.object().keys({
        threadId: joi_1.default.string().required(),
    }),
    query: joi_1.default.object().keys({
        limit: joi_1.default.number().integer(),
        page: joi_1.default.number().integer(),
        sortBy: joi_1.default.string(),
    }),
};
exports.sendMessage = {
    params: joi_1.default.object().keys({
        threadId: joi_1.default.string().required(),
    }),
    body: joi_1.default.object().keys({
        content: joi_1.default.string().trim().required(),
    }),
};
//# sourceMappingURL=messaging.validation.js.map