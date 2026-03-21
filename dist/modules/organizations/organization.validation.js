"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.addOrganizationStaffInternal = exports.getOrganizationUsers = exports.invitationAction = exports.updateInvitation = exports.getInvitations = exports.updateMember = exports.getMember = exports.getMembers = exports.resendOrganizationOnboarding = exports.enableOrganization = exports.disableOrganization = exports.updateInsights = exports.updateOrganization = exports.getOrganization = exports.getOrganizations = exports.inviteMembers = exports.inviteMember = exports.createOrganizationInternal = exports.createOrganization = void 0;
const joi_1 = __importDefault(require("joi"));
exports.createOrganization = {
    body: joi_1.default.object().keys({
        name: joi_1.default.string().required(),
    }),
};
exports.createOrganizationInternal = {
    body: joi_1.default.object().keys({
        name: joi_1.default.string().required().messages({
            'any.required': 'Name is required',
        }),
        organizationName: joi_1.default.string().required().messages({
            'any.required': 'Organization Name is required',
        }),
        workEmail: joi_1.default.string().email().required().custom((value, helpers) => {
            const publicDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com', 'icloud.com', 'proton.me', 'protonmail.com', 'zoho.com', 'yandex.com', 'mail.com', 'gmx.com'];
            const domain = value.split('@')[1];
            if (publicDomains.includes(domain)) {
                return helpers.message({ custom: 'Please use a work email address' });
            }
            return value;
        }).messages({
            'any.required': 'Work Email is required',
            'string.email': 'Work Email must be a valid email',
        }),
    }),
};
exports.inviteMember = {
    params: joi_1.default.object().keys({
        organizationId: joi_1.default.string().uuid().required(),
    }),
    body: joi_1.default.object().keys({
        userId: joi_1.default.string().uuid().required(),
    }),
};
exports.inviteMembers = {
    params: joi_1.default.object().keys({
        organizationId: joi_1.default.string().uuid().required(),
    }),
    body: joi_1.default.object().keys({
        members: joi_1.default.array().items(joi_1.default.object().keys({
            email: joi_1.default.string().email().required(),
            role: joi_1.default.string().valid('manager', 'member').required(),
            birthday: joi_1.default.date().iso().optional(),
            payRate: joi_1.default.string().optional(),
            startDate: joi_1.default.date().iso().optional(),
            projects: joi_1.default.array().items(joi_1.default.object().keys({
                projectId: joi_1.default.string().uuid().required(),
                role: joi_1.default.string().valid('viewer', 'member', 'manager').required()
            })).optional()
        })).required()
    }),
};
exports.getOrganizations = {
    query: joi_1.default.object().keys({
        name: joi_1.default.string(),
        status: joi_1.default.string(),
        sortBy: joi_1.default.string(),
        limit: joi_1.default.number().integer(),
        page: joi_1.default.number().integer(),
    }),
};
exports.getOrganization = {
    params: joi_1.default.object().keys({
        organizationId: joi_1.default.string().required(),
    }),
};
exports.updateOrganization = {
    params: joi_1.default.object().keys({
        organizationId: joi_1.default.string().required(),
    }),
    body: joi_1.default.object()
        .keys({
        name: joi_1.default.string(),
        domain: joi_1.default.string(),
        enableInsights: joi_1.default.boolean(),
    })
        .min(1),
};
exports.updateInsights = {
    params: joi_1.default.object().keys({
        organizationId: joi_1.default.string().required(),
    }),
    body: joi_1.default.object().keys({
        enableInsights: joi_1.default.boolean().required(),
    }),
};
exports.disableOrganization = {
    params: joi_1.default.object().keys({
        organizationId: joi_1.default.string().required(),
    }),
};
exports.enableOrganization = {
    params: joi_1.default.object().keys({
        organizationId: joi_1.default.string().required(),
    }),
};
exports.resendOrganizationOnboarding = {
    params: joi_1.default.object().keys({
        organizationId: joi_1.default.string().required(),
    }),
};
exports.getMembers = {
    params: joi_1.default.object().keys({
        organizationId: joi_1.default.string().uuid().required(),
    }),
    query: joi_1.default.object().keys({
        search: joi_1.default.string().allow(""),
        email: joi_1.default.string().allow(""),
        role: joi_1.default.string(),
        status: joi_1.default.string(),
        sortBy: joi_1.default.string(),
        limit: joi_1.default.number().integer(),
        page: joi_1.default.number().integer(),
    }),
};
exports.getMember = {
    params: joi_1.default.object().keys({
        organizationId: joi_1.default.string().uuid().required(),
        memberId: joi_1.default.string().uuid().required(),
    }),
};
exports.updateMember = {
    params: joi_1.default.object().keys({
        organizationId: joi_1.default.string().uuid().required(),
        memberId: joi_1.default.string().uuid().required(),
    }),
    body: joi_1.default.object().keys({
        name: joi_1.default.string().trim(),
        role: joi_1.default.string().valid('owner', 'manager', 'member'),
        hourlyRate: joi_1.default.number().min(0),
        startDate: joi_1.default.date().iso().allow(null),
        birthday: joi_1.default.date().iso().allow(null),
    }).min(1),
};
exports.getInvitations = {
    params: joi_1.default.object().keys({
        organizationId: joi_1.default.string().uuid().required(),
    }),
    query: joi_1.default.object().keys({
        sortBy: joi_1.default.string(),
        limit: joi_1.default.number().integer(),
        page: joi_1.default.number().integer(),
    }),
};
exports.updateInvitation = {
    params: joi_1.default.object().keys({
        organizationId: joi_1.default.string().uuid().required(),
        invitationToken: joi_1.default.string().required(),
    }),
    body: joi_1.default.object().keys({
        role: joi_1.default.string().valid('manager', 'member'),
        payRate: joi_1.default.number().min(0).allow(null),
        startDate: joi_1.default.date().iso().allow(null),
        birthday: joi_1.default.date().iso().allow(null),
        projects: joi_1.default.array().items(joi_1.default.object().keys({
            projectId: joi_1.default.string().uuid().required(),
            role: joi_1.default.string().valid('viewer', 'member', 'manager').required(),
        })),
    }).min(1),
};
exports.invitationAction = {
    params: joi_1.default.object().keys({
        organizationId: joi_1.default.string().uuid().required(),
        invitationToken: joi_1.default.string().required(),
    }),
};
exports.getOrganizationUsers = {
    params: joi_1.default.object().keys({
        organizationId: joi_1.default.string().uuid().required(),
    }),
    query: joi_1.default.object().keys({
        search: joi_1.default.string().allow(''),
        email: joi_1.default.string().allow(''),
        role: joi_1.default.string(),
        status: joi_1.default.string(),
        sortBy: joi_1.default.string(),
        limit: joi_1.default.number().integer(),
        page: joi_1.default.number().integer(),
    }),
};
exports.addOrganizationStaffInternal = {
    params: joi_1.default.object().keys({
        organizationId: joi_1.default.string().uuid().required(),
    }),
    body: joi_1.default.object().keys({
        payload: joi_1.default.object().keys({
            email: joi_1.default.string().email().required(),
            role: joi_1.default.string().valid('manager', 'member').required(),
            birthday: joi_1.default.date().iso().optional(),
            payRate: joi_1.default.string().optional(),
            startDate: joi_1.default.date().iso().optional(),
            projects: joi_1.default.array().items(joi_1.default.object().keys({
                projectId: joi_1.default.string().uuid().required(),
                role: joi_1.default.string().valid('viewer', 'member', 'manager').required()
            })).optional()
        }).required()
    }),
};
//# sourceMappingURL=organization.validation.js.map