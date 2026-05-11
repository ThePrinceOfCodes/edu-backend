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
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMyStudentsOverview = exports.unlinkStudentsFromGuardian = exports.linkStudentsToGuardian = exports.getGuardians = exports.createGuardian = void 0;
const http_status_1 = __importDefault(require("http-status"));
const utils_1 = require("../utils");
const guardianService = __importStar(require("./guardian.service"));
exports.createGuardian = (0, utils_1.catchAsync)(async (req, res) => {
    const result = await guardianService.createGuardian(req.body, req.account);
    res.status(http_status_1.default.CREATED).send(result);
});
exports.getGuardians = (0, utils_1.catchAsync)(async (req, res) => {
    const qParam = req.query['q'];
    const query = qParam ? { q: qParam } : undefined;
    const result = await guardianService.getGuardians(req.account, query);
    res.send(result);
});
exports.linkStudentsToGuardian = (0, utils_1.catchAsync)(async (req, res) => {
    const result = await guardianService.linkStudentsToGuardian({
        guardianId: req.params['guardianId'],
        studentIds: req.body.studentIds,
    }, req.account);
    res.send(result);
});
exports.unlinkStudentsFromGuardian = (0, utils_1.catchAsync)(async (req, res) => {
    const result = await guardianService.unlinkStudentsFromGuardian({
        guardianId: req.params['guardianId'],
        studentIds: req.body.studentIds,
    }, req.account);
    res.send(result);
});
exports.getMyStudentsOverview = (0, utils_1.catchAsync)(async (req, res) => {
    const result = await guardianService.getMyStudentsOverview(req.account);
    res.send(result);
});
//# sourceMappingURL=guardian.controller.js.map