"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.reviewPaidTimeOff = exports.getPaidTimeOffs = exports.createPaidTimeOff = void 0;
const joi_1 = __importDefault(require("joi"));
const paid_time_off_interfaces_1 = require("./paid_time_off.interfaces");
const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;
exports.createPaidTimeOff = {
    params: joi_1.default.object().keys({
        organizationId: joi_1.default.string().uuid().required(),
    }),
    body: joi_1.default.object().keys({
        projectId: joi_1.default.string().uuid().required(),
        policyId: joi_1.default.string().uuid().required(),
        excludeWeekends: joi_1.default.boolean().default(true),
        excludeHolidays: joi_1.default.boolean().default(true),
        startTime: joi_1.default.string()
            .pattern(TIME_REGEX)
            .required()
            .messages({
            'string.pattern.base': 'Start time must be a valid time in HH:MM format',
        }),
        endTime: joi_1.default.string()
            .pattern(TIME_REGEX)
            .required()
            .messages({
            'string.pattern.base': 'End time must be a valid time in HH:MM format',
        }),
        days: joi_1.default.array().items(joi_1.default.object({
            date: joi_1.default.date().required(),
            hours: joi_1.default.number().min(0).required(),
        })).min(1).required(),
        reason: joi_1.default.string().allow(null, '').optional(),
    }),
};
exports.getPaidTimeOffs = {
    params: joi_1.default.object().keys({
        organizationId: joi_1.default.string().uuid().required(),
    }),
    query: joi_1.default.object().keys({
        userId: joi_1.default.string().uuid(),
        status: joi_1.default.string().valid(...Object.values(paid_time_off_interfaces_1.PaidTimeOffStatus)),
        from: joi_1.default.date().iso(),
        to: joi_1.default.date().iso(),
        sortBy: joi_1.default.string(),
        limit: joi_1.default.number().integer(),
        page: joi_1.default.number().integer(),
    }),
};
exports.reviewPaidTimeOff = {
    params: joi_1.default.object().keys({
        organizationId: joi_1.default.string().uuid().required(),
        paidTimeOffId: joi_1.default.string().uuid().required(),
    }),
    body: joi_1.default.object().keys({
        status: joi_1.default.string().valid(paid_time_off_interfaces_1.PaidTimeOffStatus.APPROVED, paid_time_off_interfaces_1.PaidTimeOffStatus.REJECTED).required(),
    }),
};
//# sourceMappingURL=paid_time_off.validation.js.map