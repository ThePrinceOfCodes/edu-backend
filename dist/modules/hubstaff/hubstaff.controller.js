"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.disconnect = exports.getProjects = exports.exchangeToken = exports.getAuthUrl = void 0;
const http_status_1 = __importDefault(require("http-status"));
const index_1 = require("../utils/index");
const hubstaff_services_1 = require("./hubstaff.services");
const index_2 = require("../errors/index");
exports.getAuthUrl = (0, index_1.catchAsync)(async (req, res) => {
    if (!req.account)
        throw new index_2.ApiError(http_status_1.default.FORBIDDEN, "Access denied");
    const { organizationId } = req.params;
    // Validate organization access is already done by middleware
    const authUrl = await hubstaff_services_1.hubstaffService.getAuthorizationUrl(organizationId);
    res.send({ url: authUrl });
});
exports.exchangeToken = (0, index_1.catchAsync)(async (req, res) => {
    if (!req.account)
        throw new index_2.ApiError(http_status_1.default.FORBIDDEN, "Access denied");
    const { code } = req.body;
    const { organizationId } = req.params;
    // Validate organization access is already done by middleware
    const tokenData = await hubstaff_services_1.hubstaffService.getToken(code, organizationId);
    res.send(tokenData);
});
exports.getProjects = (0, index_1.catchAsync)(async (req, res) => {
    if (!req.account)
        throw new index_2.ApiError(http_status_1.default.FORBIDDEN, "Access denied");
    const { organizationId } = req.params;
    const projects = await hubstaff_services_1.hubstaffService.getHubstaffProjects(organizationId);
    res.send(projects);
});
exports.disconnect = (0, index_1.catchAsync)(async (req, res) => {
    if (!req.account)
        throw new index_2.ApiError(http_status_1.default.FORBIDDEN, "Access denied");
    const { organizationId } = req.params;
    await hubstaff_services_1.hubstaffService.disconnect(organizationId);
    res.send({ success: true });
});
//# sourceMappingURL=hubstaff.controller.js.map