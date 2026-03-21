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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOrganizationStats = exports.getProjectStats = exports.getSystemStats = void 0;
const index_1 = require("../utils/index");
const analyticsService = __importStar(require("./analytics.service"));
exports.getSystemStats = (0, index_1.catchAsync)(async (_, res) => {
    const stats = await analyticsService.getSystemStats();
    res.send(stats);
});
exports.getProjectStats = (0, index_1.catchAsync)(async (req, res) => {
    const { organizationId } = req.query;
    const stats = await analyticsService.getProjectStats(organizationId);
    res.send(stats);
});
exports.getOrganizationStats = (0, index_1.catchAsync)(async (_, res) => {
    const stats = await analyticsService.getOrganizationStats();
    res.send(stats);
});
//# sourceMappingURL=analytics.controller.js.map