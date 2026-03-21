"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.reviewPTO = exports.submitPTO = exports.updatePTOPolicy = exports.getPTOPolicies = exports.createPTOPolicy = void 0;
const joi_1 = __importDefault(require("joi"));
exports.createPTOPolicy = {
    params: joi_1.default.object().keys({
        organizationId: joi_1.default.string().uuid().required(),
    }),
    body: joi_1.default.object().keys({
        name: joi_1.default.string().required(),
        maxDaysPerYear: joi_1.default.number().integer().min(1).max(365).required(),
        enabled: joi_1.default.boolean().default(true),
        projectIds: joi_1.default.array().items(joi_1.default.string().uuid()).required(),
        effectiveDate: joi_1.default.date().required(),
    }),
};
exports.getPTOPolicies = {
    params: joi_1.default.object().keys({
        organizationId: joi_1.default.string().uuid().required(),
    }),
    query: joi_1.default.object().keys({
        sortBy: joi_1.default.string(),
        limit: joi_1.default.number().integer(),
        page: joi_1.default.number().integer(),
    }),
};
exports.updatePTOPolicy = {
    params: joi_1.default.object().keys({
        ptoPolicyId: joi_1.default.string().uuid().required(),
    }),
    body: joi_1.default.object().keys({
        enabled: joi_1.default.boolean().optional(),
        maxDaysPerYear: joi_1.default.number().integer().min(1).max(365).optional(),
        name: joi_1.default.string().optional(),
        projectIds: joi_1.default.array().items(joi_1.default.string().uuid()).optional(),
    }),
};
exports.submitPTO = {
    body: joi_1.default.object().keys({
        policyId: joi_1.default.string().uuid().required(),
        startDate: joi_1.default.date().required(),
        endDate: joi_1.default.date().min(joi_1.default.ref('startDate')).required(),
        reason: joi_1.default.string().allow(null, '').optional(),
    })
};
exports.reviewPTO = {
    params: joi_1.default.object().keys({
        id: joi_1.default.string().uuid().required(),
    }),
    body: joi_1.default.object().keys({
        status: joi_1.default.string().valid('approved', 'rejected').required(),
    }),
};
//# sourceMappingURL=pto_policies.validation.js.map