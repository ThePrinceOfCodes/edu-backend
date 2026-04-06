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
exports.sendMessage = exports.getThreadMessages = exports.getThreads = exports.createThread = void 0;
const http_status_1 = __importDefault(require("http-status"));
const utils_1 = require("../utils");
const messagingService = __importStar(require("./messaging.service"));
const getThreadIdFromParams = (req) => req.params['threadId'];
exports.createThread = (0, utils_1.catchAsync)(async (req, res) => {
    const created = await messagingService.createThread(req.body, req.account);
    res.status(http_status_1.default.CREATED).send(created);
});
exports.getThreads = (0, utils_1.catchAsync)(async (req, res) => {
    const options = (0, utils_1.pick)(req.query, ['sortBy', 'limit', 'page']);
    const result = await messagingService.queryThreads(req.account, options);
    res.send(result);
});
exports.getThreadMessages = (0, utils_1.catchAsync)(async (req, res) => {
    const options = (0, utils_1.pick)(req.query, ['sortBy', 'limit', 'page']);
    const result = await messagingService.queryThreadMessages(getThreadIdFromParams(req), req.account, options);
    res.send(result);
});
exports.sendMessage = (0, utils_1.catchAsync)(async (req, res) => {
    const created = await messagingService.sendMessage(getThreadIdFromParams(req), req.body.content, req.body.attachments, req.account);
    res.status(http_status_1.default.CREATED).send(created);
});
//# sourceMappingURL=messaging.controller.js.map