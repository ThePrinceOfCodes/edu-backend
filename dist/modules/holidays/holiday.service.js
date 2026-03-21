"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getHolidayDatesForRange = exports.deleteHoliday = exports.updateHoliday = exports.getHolidaysByYear = exports.bulkCreateHolidays = exports.createHoliday = void 0;
const http_status_1 = __importDefault(require("http-status"));
const holiday_model_1 = __importDefault(require("./holiday.model"));
const ApiError_1 = __importDefault(require("../errors/ApiError"));
const uuid_1 = require("uuid");
const luxon_1 = require("luxon");
const activity_logs_1 = require("../activity_logs");
const createHoliday = async (body, actorId) => {
    const exists = await holiday_model_1.default.findOne({ organizationId: body.organizationId, date: body.date });
    if (exists)
        throw new ApiError_1.default(http_status_1.default.CONFLICT, 'Holiday already exists on this date');
    const holiday = await holiday_model_1.default.create(body);
    await activity_logs_1.activityLogService.createActivityLog({
        type: activity_logs_1.activityLogInterfaces.ActivityLogType.ORGANIZATION,
        action: activity_logs_1.activityLogInterfaces.ActivityLogAction.HOLIDAY_CREATED,
        description: `Holiday "${holiday.name}" was created`,
        organizationId: holiday.organizationId,
        actorId,
        targetId: holiday.id,
        metadata: {
            module: 'holidays',
            operation: 'create_holiday',
            holidayDate: holiday.date,
        },
    });
    return holiday;
};
exports.createHoliday = createHoliday;
const bulkCreateHolidays = async (organizationId, holidays, actorId) => {
    const docs = holidays.map(h => (Object.assign(Object.assign({}, h), { organizationId, _id: (0, uuid_1.v4)() })));
    const result = await holiday_model_1.default.insertMany(docs, { ordered: false });
    await activity_logs_1.activityLogService.createActivityLog({
        type: activity_logs_1.activityLogInterfaces.ActivityLogType.ORGANIZATION,
        action: activity_logs_1.activityLogInterfaces.ActivityLogAction.HOLIDAY_CREATED,
        description: `${result.length} holidays were created`,
        organizationId,
        actorId,
        targetId: organizationId,
        metadata: {
            module: 'holidays',
            operation: 'bulk_create_holidays',
            count: result.length,
        },
    });
    return result;
};
exports.bulkCreateHolidays = bulkCreateHolidays;
const getHolidaysByYear = async (organizationId, year) => {
    const currentYear = new Date().getFullYear();
    const [holidays, nextHoliday] = await Promise.all([
        holiday_model_1.default.find({
            organizationId,
            date: {
                $gte: new Date(`${year}-01-01`),
                $lte: new Date(`${year}-12-31`),
            },
        }).sort({ date: 1 }),
        year === currentYear
            ? holiday_model_1.default.findOne({ organizationId, date: { $gte: new Date() } }).sort({ date: 1 })
            : Promise.resolve(null),
    ]);
    return { holidays, nextHoliday };
};
exports.getHolidaysByYear = getHolidaysByYear;
const updateHoliday = async (holidayId, organizationId, body, actorId) => {
    const holiday = await holiday_model_1.default.findOne({ _id: holidayId, organizationId });
    if (!holiday)
        throw new ApiError_1.default(http_status_1.default.NOT_FOUND, 'Holiday not found');
    if (body.date) {
        const exists = await holiday_model_1.default.findOne({
            organizationId,
            date: body.date,
            _id: { $ne: holidayId },
        });
        if (exists)
            throw new ApiError_1.default(http_status_1.default.CONFLICT, 'Holiday already exists on this date');
    }
    const changedFields = Object.keys(body || {}).filter((key) => body[key] !== undefined);
    Object.assign(holiday, body);
    await holiday.save();
    if (changedFields.length > 0) {
        await activity_logs_1.activityLogService.createActivityLog({
            type: activity_logs_1.activityLogInterfaces.ActivityLogType.ORGANIZATION,
            action: activity_logs_1.activityLogInterfaces.ActivityLogAction.HOLIDAY_UPDATED,
            description: `Holiday "${holiday.name}" was updated`,
            organizationId,
            actorId,
            targetId: holiday.id,
            metadata: {
                module: 'holidays',
                operation: 'update_holiday',
                changedFields,
            },
        });
    }
    return holiday;
};
exports.updateHoliday = updateHoliday;
const deleteHoliday = async (holidayId, organizationId, actorId) => {
    const holiday = await holiday_model_1.default.findOne({ _id: holidayId, organizationId });
    if (!holiday)
        throw new ApiError_1.default(http_status_1.default.NOT_FOUND, 'Holiday not found');
    await holiday.deleteOne();
    await activity_logs_1.activityLogService.createActivityLog({
        type: activity_logs_1.activityLogInterfaces.ActivityLogType.ORGANIZATION,
        action: activity_logs_1.activityLogInterfaces.ActivityLogAction.HOLIDAY_DELETED,
        description: `Holiday "${holiday.name}" was deleted`,
        organizationId,
        actorId,
        targetId: holiday.id,
        metadata: {
            module: 'holidays',
            operation: 'delete_holiday',
            holidayDate: holiday.date,
        },
    });
};
exports.deleteHoliday = deleteHoliday;
const getHolidayDatesForRange = async (organizationId, startDate, endDate) => {
    const holidays = await holiday_model_1.default.find({
        organizationId,
        date: { $gte: startDate, $lte: endDate }
    });
    return holidays.map(h => luxon_1.DateTime.fromJSDate(h.date).toISODate());
};
exports.getHolidayDatesForRange = getHolidayDatesForRange;
//# sourceMappingURL=holiday.service.js.map