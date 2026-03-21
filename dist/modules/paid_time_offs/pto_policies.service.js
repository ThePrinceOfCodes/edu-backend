"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isValidPTOPolicy = exports.updatePTOPolicyById = exports.queryPTOPolicies = exports.createPTOPolicy = void 0;
const http_status_1 = __importDefault(require("http-status"));
const errors_1 = require("../errors");
const pto_policies_model_1 = __importDefault(require("./pto_policies.model"));
const organizations_1 = require("../organizations");
const luxon_1 = require("luxon");
const policy_projects_model_1 = __importDefault(require("./policy_projects.model"));
const activity_logs_1 = require("../activity_logs");
const createPTOPolicy = async (ptoPolicyBody, actorId) => {
    const ptoPolicy = await pto_policies_model_1.default.create(ptoPolicyBody);
    await activity_logs_1.activityLogService.createActivityLog({
        type: activity_logs_1.activityLogInterfaces.ActivityLogType.ORGANIZATION,
        action: activity_logs_1.activityLogInterfaces.ActivityLogAction.PTO_POLICY_CREATED,
        description: `PTO policy "${ptoPolicy.name}" was created`,
        organizationId: ptoPolicy.organizationId,
        actorId,
        targetId: ptoPolicy.id,
        metadata: {
            module: 'pto_policies',
            operation: 'create_pto_policy',
            maxDaysPerYear: ptoPolicy.maxDaysPerYear,
            enabled: ptoPolicy.enabled,
        },
    });
    return ptoPolicy;
};
exports.createPTOPolicy = createPTOPolicy;
const queryPTOPolicies = async (filter, options) => {
    const { search } = filter, rest = __rest(filter, ["search"]);
    const finalFilter = Object.assign({}, rest);
    if (search && search.trim() !== '') {
        finalFilter['$or'] = [
            { 'name': { '$regex': search, '$options': 'i' } },
            { 'description': { '$regex': search, '$options': 'i' } }
        ];
    }
    const result = await pto_policies_model_1.default.paginate(finalFilter, options);
    if (!result.results.length)
        return result;
    const policyIds = result.results.map((p) => p.id);
    const projectGroups = await policy_projects_model_1.default.aggregate([
        { $match: { policyId: { $in: policyIds } } },
        { $group: { _id: "$policyId", projectIds: { $push: "$projectId" } } },
    ]);
    const projectMap = new Map(projectGroups.map((c) => [c._id, c.projectIds]));
    result.results = result.results.map((policy) => (Object.assign(Object.assign({}, policy.toJSON()), { projectIds: projectMap.get(policy.id) || [] })));
    return result;
};
exports.queryPTOPolicies = queryPTOPolicies;
const updatePTOPolicyById = async (ptoPolicyId, updateBody, actorId) => {
    const changedFields = Object.keys(updateBody || {}).filter((key) => updateBody[key] !== undefined);
    const ptoPolicy = await pto_policies_model_1.default.findOneAndUpdate({ _id: ptoPolicyId }, { $set: updateBody }, { new: true, runValidators: true });
    if (!ptoPolicy) {
        throw new errors_1.ApiError(http_status_1.default.NOT_FOUND, 'PTO Policy not found');
    }
    if (changedFields.length > 0) {
        await activity_logs_1.activityLogService.createActivityLog({
            type: activity_logs_1.activityLogInterfaces.ActivityLogType.ORGANIZATION,
            action: activity_logs_1.activityLogInterfaces.ActivityLogAction.PTO_POLICY_UPDATED,
            description: `PTO policy "${ptoPolicy.name}" was updated`,
            organizationId: ptoPolicy.organizationId,
            actorId,
            targetId: ptoPolicy.id,
            metadata: {
                module: 'pto_policies',
                operation: 'update_pto_policy',
                changedFields,
            },
        });
    }
    return ptoPolicy;
};
exports.updatePTOPolicyById = updatePTOPolicyById;
const isValidPTOPolicy = async (ptoPolicyId, organizationId, startDate) => {
    const ptoPolicy = await pto_policies_model_1.default.findById(ptoPolicyId);
    if (!ptoPolicy)
        throw new errors_1.ApiError(http_status_1.default.NOT_FOUND, 'PTO Policy not found');
    const organization = await organizations_1.Organization.findById(organizationId);
    if (!organization || organization.status !== 'active')
        throw new errors_1.ApiError(http_status_1.default.FORBIDDEN, 'Organization is disabled');
    const requestedStart = luxon_1.DateTime.fromJSDate(startDate, { zone: 'utc' }).startOf('day');
    const effectiveDate = luxon_1.DateTime.fromJSDate(ptoPolicy.effectiveDate).startOf('day');
    if (requestedStart < effectiveDate)
        throw new errors_1.ApiError(http_status_1.default.FORBIDDEN, 'PTO Policy not yet effective');
    return ptoPolicy.organizationId === organizationId;
};
exports.isValidPTOPolicy = isValidPTOPolicy;
//# sourceMappingURL=pto_policies.service.js.map