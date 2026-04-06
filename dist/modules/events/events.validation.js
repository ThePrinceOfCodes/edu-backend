"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteEvent = exports.updateEvent = exports.getEvent = exports.getEvents = exports.createEvent = void 0;
const joi_1 = __importDefault(require("joi"));
exports.createEvent = {
    body: joi_1.default.object().keys({
        title: joi_1.default.string().trim().required(),
        description: joi_1.default.string().trim().allow(null, '').optional(),
        startDate: joi_1.default.date().required(),
        endDate: joi_1.default.date().allow(null).optional(),
        allDay: joi_1.default.boolean().optional(),
        school: joi_1.default.string().trim().allow(null, '').optional(),
        color: joi_1.default.string().trim().allow(null, '').optional(),
    }),
};
exports.getEvents = {
    query: joi_1.default.object().keys({
        limit: joi_1.default.number().integer(),
        page: joi_1.default.number().integer(),
        sortBy: joi_1.default.string(),
        school: joi_1.default.string().trim(),
        startDate: joi_1.default.string(),
        endDate: joi_1.default.string(),
    }),
};
exports.getEvent = {
    params: joi_1.default.object().keys({
        eventId: joi_1.default.string().required(),
    }),
};
exports.updateEvent = {
    params: joi_1.default.object().keys({
        eventId: joi_1.default.string().required(),
    }),
    body: joi_1.default.object()
        .keys({
        title: joi_1.default.string().trim().optional(),
        description: joi_1.default.string().trim().allow(null, '').optional(),
        startDate: joi_1.default.date().optional(),
        endDate: joi_1.default.date().allow(null).optional(),
        allDay: joi_1.default.boolean().optional(),
        school: joi_1.default.string().trim().allow(null, '').optional(),
        color: joi_1.default.string().trim().allow(null, '').optional(),
    })
        .min(1),
};
exports.deleteEvent = {
    params: joi_1.default.object().keys({
        eventId: joi_1.default.string().required(),
    }),
};
//# sourceMappingURL=events.validation.js.map