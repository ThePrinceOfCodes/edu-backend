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
exports.getActiveTerm = exports.deleteTerm = exports.updateTerm = exports.getTerm = exports.getTerms = exports.createTerm = void 0;
const http_status_1 = __importDefault(require("http-status"));
const utils_1 = require("../utils");
const termService = __importStar(require("./term.service"));
const getTermIdFromParams = (req) => req.params['termId'];
exports.createTerm = (0, utils_1.catchAsync)(async (req, res) => {
    const created = await termService.createTerm(req.body, req.account);
    res.status(http_status_1.default.CREATED).send(created);
});
exports.getTerms = (0, utils_1.catchAsync)(async (req, res) => {
    const filter = (0, utils_1.pick)(req.query, ['name', 'termName', 'academicSession', 'schoolBoard', 'school', 'isActive']);
    const options = (0, utils_1.pick)(req.query, ['sortBy', 'limit', 'page']);
    const result = await termService.queryTerms(filter, options, req.account);
    res.send(result);
});
exports.getTerm = (0, utils_1.catchAsync)(async (req, res) => {
    const found = await termService.getTermById(getTermIdFromParams(req), req.account);
    res.send(found);
});
exports.updateTerm = (0, utils_1.catchAsync)(async (req, res) => {
    const updated = await termService.updateTermById(getTermIdFromParams(req), req.body, req.account);
    res.send(updated);
});
exports.deleteTerm = (0, utils_1.catchAsync)(async (req, res) => {
    await termService.deleteTermById(getTermIdFromParams(req), req.account);
    res.status(http_status_1.default.NO_CONTENT).send();
});
exports.getActiveTerm = (0, utils_1.catchAsync)(async (req, res) => {
    const schoolId = req.query['school'];
    const activeTerm = await termService.getActiveTermForRequest(req.account, schoolId);
    res.send(activeTerm);
});
//# sourceMappingURL=term.controller.js.map