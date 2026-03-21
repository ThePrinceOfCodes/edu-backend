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
exports.updatePTOPolicy = exports.getPTOPolicies = exports.createPTOPolicy = void 0;
const http_status_1 = __importDefault(require("http-status"));
const index_1 = require("../utils/index");
const ptoPolicyService = __importStar(require("./pto_policies.service"));
const index_2 = require("../errors/index");
const organizations_1 = require("../organizations");
const policy_projects_model_1 = __importDefault(require("./policy_projects.model"));
const luxon_1 = require("luxon");
exports.createPTOPolicy = (0, index_1.catchAsync)(async (req, res) => {
    if (!req.account)
        throw new index_2.ApiError(http_status_1.default.FORBIDDEN, 'Access denied');
    const { organizationId } = req.params;
    const organization = await organizations_1.Organization.findById(organizationId);
    if (!organization)
        throw new index_2.ApiError(http_status_1.default.NOT_FOUND, 'Organization not found');
    if (organization.status !== 'active')
        throw new index_2.ApiError(http_status_1.default.FORBIDDEN, 'Organization is disabled');
    const ptoPolicyBody = {
        name: req.body.name,
        maxDaysPerYear: req.body.maxDaysPerYear,
        enabled: req.body.enabled,
        effectiveDate: req.body.effectiveDate,
        description: req.body.description,
        organizationId: organizationId,
    };
    const ptoPolicy = await ptoPolicyService.createPTOPolicy(ptoPolicyBody, req.account.id);
    const projectIds = req.body.projectIds;
    await policy_projects_model_1.default.insertMany(projectIds.map(id => ({
        policyId: ptoPolicy._id,
        projectId: id,
        organizationId
    })));
    res.status(http_status_1.default.CREATED).send(ptoPolicy);
});
exports.getPTOPolicies = (0, index_1.catchAsync)(async (req, res) => {
    if (!req.account)
        throw new index_2.ApiError(http_status_1.default.FORBIDDEN, 'Access denied');
    const { organizationId } = req.params;
    const filter = Object.assign({ organizationId, search: req.query['search'] }, (req.query['is_enabled'] && { enabled: req.query['is_enabled'] === 'true' }));
    if (req.query['projectId']) {
        const policyProject = await policy_projects_model_1.default.find({ projectId: req.query['projectId'], organizationId }, { policyId: 1 }).lean();
        const policyIds = policyProject.map((p) => p.policyId);
        filter._id = { $in: policyIds };
    }
    const options = {
        sortBy: req.query['sortBy'] || 'createdAt:desc',
        limit: parseInt(req.query['limit'], 10) || 10,
        page: parseInt(req.query['page'], 10) || 1,
    };
    console.log(filter, options);
    const result = await ptoPolicyService.queryPTOPolicies(filter, options);
    res.send(result);
});
exports.updatePTOPolicy = (0, index_1.catchAsync)(async (req, res) => {
    if (!req.account)
        throw new index_2.ApiError(http_status_1.default.FORBIDDEN, 'Access denied');
    const { ptoPolicyId } = req.params;
    const { name, maxDaysPerYear, enabled, description, projectIds } = req.body;
    const updateBody = {
        name,
        maxDaysPerYear,
        enabled,
        description,
        effectiveDate: luxon_1.DateTime.now().toJSDate(),
    };
    const ptoPolicy = await ptoPolicyService.updatePTOPolicyById(ptoPolicyId, updateBody, req.account.id);
    if (Array.isArray(projectIds)) {
        const existing = await policy_projects_model_1.default.find({ policyId: ptoPolicyId }, { projectId: 1 }).lean();
        const existingIds = new Set(existing.map((p) => p.projectId));
        const incomingIds = new Set(projectIds);
        const toAdd = projectIds.filter((id) => !existingIds.has(id));
        const toRemove = [...existingIds].filter((id) => !incomingIds.has(id));
        await Promise.all([
            toRemove.length > 0 && policy_projects_model_1.default.deleteMany({ policyId: ptoPolicyId, projectId: { $in: toRemove } }),
            toAdd.length > 0 && policy_projects_model_1.default.insertMany(toAdd.map((id) => ({
                policyId: ptoPolicyId,
                projectId: id,
                organizationId: ptoPolicy.organizationId,
            }))),
        ]);
    }
    res.send(ptoPolicy);
});
//# sourceMappingURL=pto_policies.controller.js.map