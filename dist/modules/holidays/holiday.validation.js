"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteHoliday = exports.updateHoliday = exports.getHolidaysByYear = exports.bulkCreateHolidays = exports.createHoliday = void 0;
const joi_1 = __importDefault(require("joi"));
exports.createHoliday = {
    params: joi_1.default.object().keys({
        organizationId: joi_1.default.string().uuid().required(),
    }),
    body: joi_1.default.object().keys({
        name: joi_1.default.string().required(),
        date: joi_1.default.date().required(),
    }),
};
exports.bulkCreateHolidays = {
    params: joi_1.default.object().keys({
        organizationId: joi_1.default.string().uuid().required(),
    }),
    body: joi_1.default.object().keys({
        holidays: joi_1.default.array().items(joi_1.default.object().keys({
            name: joi_1.default.string().required(),
            date: joi_1.default.date().required(),
        })).min(1).required(),
    }),
};
exports.getHolidaysByYear = {
    params: joi_1.default.object().keys({
        organizationId: joi_1.default.string().uuid().required(),
    }),
    query: joi_1.default.object().keys({
        year: joi_1.default.number().integer().min(2000).max(2100).required(),
    }),
};
exports.updateHoliday = {
    params: joi_1.default.object().keys({
        organizationId: joi_1.default.string().uuid().required(),
        holidayId: joi_1.default.string().uuid().required(),
    }),
    body: joi_1.default.object().keys({
        name: joi_1.default.string(),
        date: joi_1.default.date(),
    }).min(1),
};
exports.deleteHoliday = {
    params: joi_1.default.object().keys({
        organizationId: joi_1.default.string().uuid().required(),
        holidayId: joi_1.default.string().uuid().required(),
    }),
};
//# sourceMappingURL=holiday.validation.js.map