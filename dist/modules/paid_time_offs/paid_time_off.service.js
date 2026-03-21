"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUsedHours = exports.enrichPaidTimeOffDays = exports.hasOverlap = exports.updatePaidTimeOffById = exports.getPaidTimeOffById = exports.queryPaidTimeOffs = exports.createPaidTimeOff = void 0;
const http_status_1 = __importDefault(require("http-status"));
const paid_time_off_model_1 = __importDefault(require("./paid_time_off.model"));
const paid_time_off_interfaces_1 = require("./paid_time_off.interfaces");
const index_1 = require("../errors/index");
const luxon_1 = require("luxon");
const activity_logs_1 = require("../activity_logs");
/**
 * Create a paid time off request
 * @param {IPaidTimeOff} paidTimeOffBody
 * @returns {Promise<IPaidTimeOffDoc>}
 */
const createPaidTimeOff = async (paidTimeOffBody, actorId) => {
    const paidTimeOff = await paid_time_off_model_1.default.create(paidTimeOffBody);
    await activity_logs_1.activityLogService.createActivityLog({
        type: activity_logs_1.activityLogInterfaces.ActivityLogType.ORGANIZATION,
        action: activity_logs_1.activityLogInterfaces.ActivityLogAction.PTO_REQUEST_CREATED,
        description: `Paid time off request was created`,
        organizationId: paidTimeOff.organizationId,
        actorId,
        targetId: paidTimeOff.id,
        metadata: {
            module: 'paid_time_offs',
            operation: 'create_pto_request',
            policyId: paidTimeOff.policyId,
            projectId: paidTimeOff.projectId,
            startDate: paidTimeOff.startDate,
            endDate: paidTimeOff.endDate,
            status: paidTimeOff.status,
        },
    });
    return paidTimeOff;
};
exports.createPaidTimeOff = createPaidTimeOff;
/**
 * Query for paid time offs
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @returns {Promise<QueryResult>}
 */
const queryPaidTimeOffs = async (query, options) => {
    const filter = { organizationId: query.organizationId };
    if (query['userId'])
        filter.userId = query['userId'];
    if (query['status'])
        filter.status = query['status'];
    if (query['from'] && query['to']) {
        filter.startDate = { $lte: new Date(query['to']) };
        filter.endDate = { $gte: new Date(query['from']) };
    }
    else if (query['from']) {
        filter.endDate = { $gte: new Date(query['from']) };
    }
    else if (query['to']) {
        filter.startDate = { $lte: new Date(query['to']) };
    }
    return paid_time_off_model_1.default.paginate(filter, options);
};
exports.queryPaidTimeOffs = queryPaidTimeOffs;
/**
 * Get paid time off by id
 * @param {string} id
 * @returns {Promise<IPaidTimeOffDoc | null>}
 */
const getPaidTimeOffById = async (id) => {
    return paid_time_off_model_1.default.findById(id);
};
exports.getPaidTimeOffById = getPaidTimeOffById;
/**
 * Update paid time off by id
 * @param {string} paidTimeOffId
 * @param {Object} updateBody
 * @returns {Promise<IPaidTimeOffDoc>}
 */
const updatePaidTimeOffById = async (paidTimeOffId, updateBody, actorId) => {
    const paidTimeOff = await (0, exports.getPaidTimeOffById)(paidTimeOffId);
    if (!paidTimeOff)
        throw new index_1.ApiError(http_status_1.default.NOT_FOUND, 'Paid time off not found');
    const changedFields = Object.keys(updateBody || {}).filter((key) => updateBody[key] !== undefined);
    const previousStatus = paidTimeOff.status;
    Object.assign(paidTimeOff, updateBody);
    await paidTimeOff.save();
    if (changedFields.length > 0) {
        await activity_logs_1.activityLogService.createActivityLog({
            type: activity_logs_1.activityLogInterfaces.ActivityLogType.ORGANIZATION,
            action: activity_logs_1.activityLogInterfaces.ActivityLogAction.PTO_REQUEST_UPDATED,
            description: `Paid time off request was updated`,
            organizationId: paidTimeOff.organizationId,
            actorId,
            targetId: paidTimeOff.id,
            metadata: {
                module: 'paid_time_offs',
                operation: 'update_pto_request',
                changedFields,
                previousStatus,
                newStatus: paidTimeOff.status,
            },
        });
    }
    return paidTimeOff;
};
exports.updatePaidTimeOffById = updatePaidTimeOffById;
/**
 * Check if a paid time off overlaps with existing ones
 */
const hasOverlap = async ({ startDate, endDate, userId, organizationId }) => {
    return paid_time_off_model_1.default.findOne({
        userId,
        organizationId,
        status: { $ne: paid_time_off_interfaces_1.PaidTimeOffStatus.REJECTED },
        $and: [
            { startDate: { $lte: endDate } },
            { endDate: { $gte: startDate } }
        ]
    });
};
exports.hasOverlap = hasOverlap;
/**
 * Enrich client-sent days with isHoliday, isWeekend flags and compute totals
 */
const enrichPaidTimeOffDays = ({ days, holidays, excludeWeekends, excludeHolidays }) => {
    const holidaySet = new Set(holidays);
    const enrichedDays = days.map(day => {
        const dt = luxon_1.DateTime.fromJSDate(new Date(day.date)).startOf('day');
        if (!dt.isValid)
            throw new index_1.ApiError(http_status_1.default.BAD_REQUEST, `Invalid date: ${day.date}`);
        const isWeekend = dt.weekday >= 6;
        const isHoliday = holidaySet.has(dt.toISODate());
        // Server enforces hours to 0 regardless of what client sent
        const shouldExclude = (isWeekend && excludeWeekends) || (isHoliday && excludeHolidays);
        const hours = shouldExclude ? 0 : day.hours;
        return {
            date: dt.toJSDate(),
            hours,
            isWeekend,
            isHoliday,
        };
    });
    const totalHours = enrichedDays.reduce((acc, day) => acc + day.hours, 0);
    // totalDays = count of days with hours > 0
    const totalDays = enrichedDays.filter(day => day.hours > 0).length;
    return { enrichedDays, totalDays, totalHours };
};
exports.enrichPaidTimeOffDays = enrichPaidTimeOffDays;
const getUsedHours = async ({ userId, organizationId, policyId, projectId }) => {
    var _a, _b;
    const startOfYear = luxon_1.DateTime.utc().startOf('year').toJSDate();
    const endOfYear = luxon_1.DateTime.utc().endOf('year').toJSDate();
    const result = await paid_time_off_model_1.default.aggregate([
        {
            $match: {
                userId,
                organizationId,
                policyId,
                projectId,
                status: { $in: [paid_time_off_interfaces_1.PaidTimeOffStatus.PENDING, paid_time_off_interfaces_1.PaidTimeOffStatus.APPROVED] },
                startDate: { $gte: startOfYear },
                endDate: { $lte: endOfYear },
            }
        },
        {
            $group: {
                _id: null,
                totalHours: { $sum: '$totalHours' }
            }
        }
    ]);
    return (_b = (_a = result[0]) === null || _a === void 0 ? void 0 : _a.totalHours) !== null && _b !== void 0 ? _b : 0;
};
exports.getUsedHours = getUsedHours;
//# sourceMappingURL=paid_time_off.service.js.map