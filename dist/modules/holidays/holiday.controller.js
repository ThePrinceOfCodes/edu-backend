"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteHoliday = exports.updateHoliday = exports.getHolidaysByYear = exports.bulkCreateHolidays = exports.createHoliday = void 0;
const http_status_1 = __importDefault(require("http-status"));
const catchAsync_1 = __importDefault(require("../utils/catchAsync"));
const errors_1 = require("../errors");
const _1 = require(".");
exports.createHoliday = (0, catchAsync_1.default)(async (req, res) => {
    var _a;
    if (!((_a = req.account) === null || _a === void 0 ? void 0 : _a.id))
        throw new errors_1.ApiError(http_status_1.default.UNAUTHORIZED, 'Authentication required');
    const { organizationId } = req.params;
    const holiday = await _1.holidayService.createHoliday(Object.assign(Object.assign({}, req.body), { organizationId }), req.account.id);
    res.status(http_status_1.default.CREATED).send(holiday);
});
exports.bulkCreateHolidays = (0, catchAsync_1.default)(async (req, res) => {
    var _a;
    if (!((_a = req.account) === null || _a === void 0 ? void 0 : _a.id))
        throw new errors_1.ApiError(http_status_1.default.UNAUTHORIZED, 'Authentication required');
    const { organizationId } = req.params;
    const result = await _1.holidayService.bulkCreateHolidays(organizationId, req.body.holidays, req.account.id);
    res.status(http_status_1.default.CREATED).send(result);
});
exports.getHolidaysByYear = (0, catchAsync_1.default)(async (req, res) => {
    const { organizationId } = req.params;
    const year = parseInt(req.query['year']);
    if (isNaN(year))
        throw new errors_1.ApiError(http_status_1.default.BAD_REQUEST, 'Invalid year');
    const holidays = await _1.holidayService.getHolidaysByYear(organizationId, year);
    res.send(holidays);
});
exports.updateHoliday = (0, catchAsync_1.default)(async (req, res) => {
    var _a;
    if (!((_a = req.account) === null || _a === void 0 ? void 0 : _a.id))
        throw new errors_1.ApiError(http_status_1.default.UNAUTHORIZED, 'Authentication required');
    const { organizationId, holidayId } = req.params;
    const holiday = await _1.holidayService.updateHoliday(holidayId, organizationId, req.body, req.account.id);
    res.send(holiday);
});
exports.deleteHoliday = (0, catchAsync_1.default)(async (req, res) => {
    var _a;
    if (!((_a = req.account) === null || _a === void 0 ? void 0 : _a.id))
        throw new errors_1.ApiError(http_status_1.default.UNAUTHORIZED, 'Authentication required');
    const { organizationId, holidayId } = req.params;
    await _1.holidayService.deleteHoliday(holidayId, organizationId, req.account.id);
    res.status(http_status_1.default.NO_CONTENT).send();
});
//# sourceMappingURL=holiday.controller.js.map