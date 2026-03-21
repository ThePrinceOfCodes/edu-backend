"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPaymentForTimesheet = exports.getPaymentBatchById = exports.getPaymentBatches = exports.executePaymentBatch = exports.createPaymentBatch = exports.getPaymentById = exports.getPayments = exports.processPayment = exports.getPaymentTimesheets = void 0;
const http_status_1 = __importDefault(require("http-status"));
const timesheet_model_1 = __importDefault(require("../timesheet/timesheet.model"));
const sessions_1 = require("../sessions");
const holiday_model_1 = __importDefault(require("../holidays/holiday.model"));
const paid_time_off_model_1 = __importDefault(require("../paid_time_offs/paid_time_off.model"));
const project_member_model_1 = __importDefault(require("../projects/project_member.model"));
const project_configuration_model_1 = __importDefault(require("../projects/project_configuration.model"));
const project_model_1 = __importDefault(require("../projects/project.model"));
const user_model_1 = __importDefault(require("../users/user.model"));
const organizations_1 = require("../organizations");
const organization_interfaces_1 = require("../organizations/organization.interfaces");
const paid_time_off_interfaces_1 = require("../paid_time_offs/paid_time_off.interfaces");
const payment_model_1 = __importDefault(require("./payment.model"));
const payment_batch_model_1 = __importDefault(require("./payment_batch.model"));
const errors_1 = require("../errors");
const payment_interfaces_1 = require("./payment.interfaces");
// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
/**
 * Compute total hours worked per project for a given user + timesheet window.
 * Returns a map of projectId -> seconds worked.
 */
const getSessionSecondsByProject = async (userId, organizationId, startMs, endMs) => {
    var _a, _b;
    const sessions = await sessions_1.Session.find({
        organizationId,
        userId,
        $or: [
            { startTime: { $lte: endMs }, endTime: { $gte: startMs } },
            { startTime: { $lte: endMs }, endTime: { $exists: false } },
        ],
    });
    const map = new Map();
    for (const session of sessions) {
        const sStart = session.startTime;
        const sEnd = (_a = session.endTime) !== null && _a !== void 0 ? _a : endMs;
        const overlapStart = Math.max(sStart, startMs);
        const overlapEnd = Math.min(sEnd, endMs);
        const overlapMs = Math.max(0, overlapEnd - overlapStart);
        const deductedMs = (session.deductedSeconds || 0) * 1000;
        const effectiveMs = Math.max(0, overlapMs - deductedMs);
        const effectiveSecs = Math.floor(effectiveMs / 1000);
        const existing = (_b = map.get(session.projectId)) !== null && _b !== void 0 ? _b : 0;
        map.set(session.projectId, existing + effectiveSecs);
    }
    return map;
};
/**
 * Count total hours from holidays that fall within a date range.
 * Each holiday is treated as one standard 8-hour workday.
 */
const getHolidayHours = async (organizationId, startDate, endDate) => {
    const holidays = await holiday_model_1.default.find({
        organizationId,
        date: { $gte: startDate, $lte: endDate },
    });
    return holidays.length * 8;
};
/**
 * Sum total approved PTO hours for a user that overlap with the given period.
 */
const getPtoHours = async (userId, organizationId, startDate, endDate) => {
    const ptos = await paid_time_off_model_1.default.find({
        userId,
        organizationId,
        status: paid_time_off_interfaces_1.PaidTimeOffStatus.APPROVED,
        startDate: { $lte: endDate },
        endDate: { $gte: startDate },
    });
    return ptos.reduce((sum, pto) => sum + (pto.totalHours || 0), 0);
};
/**
 * Resolve hourly rate for a user on a project.
 * Priority: ProjectMember.hourlyRate → ProjectConfiguration.defaultHourlyRate → 0
 */
const getHourlyRate = async (userId, projectId) => {
    var _a;
    const member = await project_member_model_1.default.findOne({ projectId, userId });
    if (member && member.hourlyRate != null && member.hourlyRate > 0) {
        return { rate: member.hourlyRate, currency: 'USD' };
    }
    const config = await project_configuration_model_1.default.findOne({ projectId });
    if (config && config.defaultHourlyRate != null && config.defaultHourlyRate > 0) {
        return { rate: config.defaultHourlyRate, currency: (_a = config.currency) !== null && _a !== void 0 ? _a : 'USD' };
    }
    return { rate: 0, currency: 'USD' };
};
/**
 * Assert that a user is an owner or manager of the given organisation.
 * Throws 403 if not. Returns the OrganizationMember document on success.
 */
const assertOrgManagerOrOwner = async (organizationId, userId, action) => {
    const member = await organizations_1.OrganizationMember.findOne({ organizationId, userId });
    if (!member ||
        (member.role !== organization_interfaces_1.OrganizationMemberRole.OWNER && member.role !== organization_interfaces_1.OrganizationMemberRole.MANAGER)) {
        throw new errors_1.ApiError(http_status_1.default.FORBIDDEN, `You do not have permission to ${action}`);
    }
    return member;
};
/**
 * Build per-project breakdowns from a seconds-by-project map.
 * Returns the full breakdown list together with rolled-up totals.
 */
const buildProjectBreakdowns = async (userId, secondsByProject, fallbackCurrency = 'USD') => {
    var _a;
    const projectBreakdowns = [];
    let totalLoggedHours = 0;
    let totalAmount = 0;
    let currency = fallbackCurrency.toUpperCase();
    for (const [projectId, seconds] of secondsByProject.entries()) {
        const hours = Number((seconds / 3600).toFixed(2));
        totalLoggedHours += hours;
        const { rate, currency: projCurrency } = await getHourlyRate(userId, projectId);
        currency = projCurrency;
        const amount = Number((hours * rate).toFixed(2));
        totalAmount += amount;
        const project = await project_model_1.default.findById(projectId).select('name').lean();
        projectBreakdowns.push({
            projectId,
            projectName: (_a = project === null || project === void 0 ? void 0 : project.name) !== null && _a !== void 0 ? _a : null,
            hours,
            ratePerHour: rate,
            currency: projCurrency,
            amount,
        });
    }
    return {
        projectBreakdowns,
        totalLoggedHours: Number(totalLoggedHours.toFixed(2)),
        totalAmount: Number(totalAmount.toFixed(2)),
        currency,
    };
};
/**
 * Upsert a Payment record for a single timesheet and mark the timesheet as paid.
 */
const upsertPaymentRecord = async (organizationId, initiatedBy, timesheetId, paymentItem, totalAmount, currency, notes, status) => {
    const payment = await payment_model_1.default.findOneAndUpdate({ organizationId, 'paymentItems.timesheetId': timesheetId }, {
        $set: {
            organizationId,
            initiatedBy,
            timesheetIds: [timesheetId],
            paymentItems: [paymentItem],
            totalAmount,
            currency: currency.toUpperCase(),
            status,
            notes: notes !== null && notes !== void 0 ? notes : null,
            processedAt: new Date(),
        },
    }, { upsert: true, new: true, setDefaultsOnInsert: true });
    await timesheet_model_1.default.updateOne({ _id: timesheetId }, { paymentStatus: 'pending' });
    return payment;
};
// ---------------------------------------------------------------------------
// Public service functions
// ---------------------------------------------------------------------------
/**
 * Fetch all approved timesheets for a given organisation and enrich each with:
 *  - total logged hours (broken down per project with rate × hours = amount)
 *  - total holiday hours in that timesheet period
 *  - total approved PTO hours in that timesheet period
 */
const getPaymentTimesheets = async (orgId, requestingUserId, filters = {}, paymentIds) => {
    await assertOrgManagerOrOwner(orgId, requestingUserId, 'view payment data for this organisation');
    let payments;
    if (paymentIds && paymentIds.length > 0) {
        // When paymentIds are provided, fetch only those specific payment records.
        payments = await payment_model_1.default.find({ _id: { $in: paymentIds }, organizationId: orgId }).lean();
    }
    else {
        // Build Payment query — data was already computed when the timesheet was approved.
        const query = { organizationId: orgId };
        if (filters.paymentStatus === 'paid') {
            query.status = payment_interfaces_1.PaymentStatus.COMPLETED;
        }
        if (filters.dateFrom && filters.dateTo) {
            query['paymentItems.timesheetStartDate'] = { $lte: new Date(filters.dateTo) };
            query['paymentItems.timesheetEndDate'] = { $gte: new Date(filters.dateFrom) };
        }
        payments = await payment_model_1.default.find(query).lean();
    }
    // Flatten: one Payment = one timesheet in our model, but be defensive.
    const items = payments.flatMap((p) => p.paymentItems.map((item) => (Object.assign(Object.assign({}, item), { organizationId: p.organizationId, paymentRecordStatus: p.status }))));
    if (items.length === 0)
        return { results: [], totalTimesheets: 0 };
    // Batch-fetch user names & avatars
    const uniqueUserIds = [...new Set(items.map((i) => String(i.userId)))];
    const users = await user_model_1.default.find({ _id: { $in: uniqueUserIds } })
        .select('_id name avatar')
        .lean();
    const userMap = new Map(users.map((u) => { var _a, _b; return [String(u._id), { name: (_a = u.name) !== null && _a !== void 0 ? _a : null, avatar: (_b = u.avatar) !== null && _b !== void 0 ? _b : null }]; }));
    // Batch-fetch timesheet metadata needed for the response
    const timesheetIds = items.map((i) => i.timesheetId);
    const timesheets = await timesheet_model_1.default.find({ _id: { $in: timesheetIds } })
        .select('_id status paymentStatus approvedBy approvedOn')
        .lean();
    const tsMap = new Map(timesheets.map((ts) => [String(ts._id), ts]));
    const results = items.map((item) => {
        var _a, _b, _c, _d, _e, _f, _g, _h;
        const ts = tsMap.get(String(item.timesheetId));
        return {
            timesheetId: item.timesheetId,
            userId: item.userId,
            userName: (_b = (_a = userMap.get(String(item.userId))) === null || _a === void 0 ? void 0 : _a.name) !== null && _b !== void 0 ? _b : null,
            userAvatar: (_d = (_c = userMap.get(String(item.userId))) === null || _c === void 0 ? void 0 : _c.avatar) !== null && _d !== void 0 ? _d : null,
            organizationId: item.organizationId,
            startDate: item.timesheetStartDate,
            endDate: item.timesheetEndDate,
            status: (_e = ts === null || ts === void 0 ? void 0 : ts.status) !== null && _e !== void 0 ? _e : null,
            paymentStatus: (_f = ts === null || ts === void 0 ? void 0 : ts.paymentStatus) !== null && _f !== void 0 ? _f : 'paid',
            approvedBy: (_g = ts === null || ts === void 0 ? void 0 : ts.approvedBy) !== null && _g !== void 0 ? _g : null,
            approvedOn: (_h = ts === null || ts === void 0 ? void 0 : ts.approvedOn) !== null && _h !== void 0 ? _h : null,
            totalLoggedHours: item.totalLoggedHours,
            totalHolidayHours: item.totalHolidayHours,
            totalPtoHours: item.totalPtoHours,
            projectBreakdowns: item.projectBreakdowns,
            totalAmount: item.totalAmount,
            currency: item.currency,
        };
    });
    return { results, totalTimesheets: results.length };
};
exports.getPaymentTimesheets = getPaymentTimesheets;
/**
 * Process (save) a payment record for a single timesheet.
 */
const processPayment = async (body, initiatedBy) => {
    var _a;
    // Verify the timesheet exists, belongs to the org, and is approved
    const timesheet = await timesheet_model_1.default.findOne({
        _id: body.timesheetId,
        organizationId: body.organizationId,
        status: 'approved',
    });
    if (!timesheet) {
        throw new errors_1.ApiError(http_status_1.default.BAD_REQUEST, 'Timesheet not found, does not belong to this organisation, or is not approved');
    }
    return upsertPaymentRecord(body.organizationId, initiatedBy, body.timesheetId, body.paymentItem, body.totalAmount, (_a = body.currency) !== null && _a !== void 0 ? _a : 'USD', body.notes, payment_interfaces_1.PaymentStatus.COMPLETED);
};
exports.processPayment = processPayment;
/**
 * List all payment records for an organisation.
 */
const getPayments = async (orgId, requestingUserId, options = {}) => {
    var _a, _b, _c;
    await assertOrgManagerOrOwner(orgId, requestingUserId, 'view payments for this organisation');
    return payment_model_1.default.paginate({ organizationId: orgId }, {
        page: (_a = options.page) !== null && _a !== void 0 ? _a : 1,
        limit: (_b = options.limit) !== null && _b !== void 0 ? _b : 20,
        sortBy: (_c = options.sortBy) !== null && _c !== void 0 ? _c : 'createdAt:desc',
        populate: 'initiatedBy',
    });
};
exports.getPayments = getPayments;
/**
 * Get a single payment by ID.
 */
const getPaymentById = async (paymentId, requestingUserId) => {
    const payment = await payment_model_1.default.findById(paymentId).populate('initiatedBy');
    if (!payment) {
        throw new errors_1.ApiError(http_status_1.default.NOT_FOUND, 'Payment not found');
    }
    await assertOrgManagerOrOwner(payment.organizationId, requestingUserId, 'view this payment');
    return payment;
};
exports.getPaymentById = getPaymentById;
// ---------------------------------------------------------------------------
// Batch Payment Processor
// ---------------------------------------------------------------------------
/**
 * Create a PaymentBatch record in PENDING status.
 *
 * Validates that all supplied timesheets are approved, belong to the org,
 * and already have a Payment record (created on approval). Does NOT mark
 * any payments as COMPLETED yet — call executePaymentBatch for that.
 */
const createPaymentBatch = async (body, initiatedBy) => {
    const { organizationId, timesheetIds, dateRange, currency = 'USD', notes } = body;
    await assertOrgManagerOrOwner(organizationId, initiatedBy, 'create a payment batch for this organisation');
    if (!timesheetIds || timesheetIds.length === 0) {
        throw new errors_1.ApiError(http_status_1.default.BAD_REQUEST, 'At least one timesheetId is required');
    }
    const startDate = dateRange ? new Date(dateRange.startDate) : undefined;
    const endDate = dateRange ? new Date(dateRange.endDate) : undefined;
    // Confirm all timesheets are approved and belong to the org
    const timesheets = await timesheet_model_1.default.find({
        _id: { $in: timesheetIds },
        organizationId,
        status: 'approved',
    }).lean();
    if (timesheets.length === 0) {
        throw new errors_1.ApiError(http_status_1.default.BAD_REQUEST, 'No approved timesheets found for the provided IDs in this organisation');
    }
    const foundIds = new Set(timesheets.map((ts) => String(ts._id)));
    const missingIds = timesheetIds.filter(id => !foundIds.has(id));
    if (missingIds.length > 0) {
        throw new errors_1.ApiError(http_status_1.default.BAD_REQUEST, `The following timesheet IDs were not found or are not approved: ${missingIds.join(', ')}`);
    }
    // Confirm every timesheet already has a Payment record (created on approval)
    const existingPayments = await payment_model_1.default.find({
        organizationId,
        'paymentItems.timesheetId': { $in: timesheetIds },
    }).lean();
    const paymentByTimesheetId = new Map();
    for (const p of existingPayments) {
        for (const item of p.paymentItems) {
            paymentByTimesheetId.set(String(item.timesheetId), p);
        }
    }
    // For any timesheet that doesn't have a Payment record yet, create one now.
    const missingPaymentIds = timesheetIds.filter(id => !paymentByTimesheetId.has(id));
    if (missingPaymentIds.length > 0) {
        const created = await Promise.all(missingPaymentIds.map(id => (0, exports.createPaymentForTimesheet)(id, initiatedBy)));
        for (const p of created) {
            existingPayments.push(p);
        }
    }
    const uniquePaymentIds = [...new Set(existingPayments.map((p) => String(p._id)))];
    const batchTotal = Number(existingPayments.reduce((sum, p) => { var _a; return sum + ((_a = p.totalAmount) !== null && _a !== void 0 ? _a : 0); }, 0).toFixed(2));
    const batch = await payment_batch_model_1.default.create({
        organizationId,
        initiatedBy,
        timesheetIds,
        dateRange: startDate && endDate ? { startDate, endDate } : undefined,
        createdOn: new Date(),
        status: payment_interfaces_1.BatchPaymentStatus.PENDING,
        totalTimesheets: timesheets.length,
        processedCount: 0,
        failedCount: 0,
        totalAmount: batchTotal,
        currency: currency.toUpperCase(),
        notes: notes !== null && notes !== void 0 ? notes : null,
        paymentIds: uniquePaymentIds,
    });
    return batch;
};
exports.createPaymentBatch = createPaymentBatch;
/**
 * Execute a PENDING PaymentBatch — marks all linked Payment records as
 * COMPLETED and sets the batch status to COMPLETED.
 */
const executePaymentBatch = async (batchId, requestingUserId) => {
    const batch = await payment_batch_model_1.default.findById(batchId);
    if (!batch) {
        throw new errors_1.ApiError(http_status_1.default.NOT_FOUND, 'Payment batch not found');
    }
    await assertOrgManagerOrOwner(batch.organizationId, requestingUserId, 'process this payment batch');
    if (batch.status !== payment_interfaces_1.BatchPaymentStatus.PENDING) {
        throw new errors_1.ApiError(http_status_1.default.BAD_REQUEST, `Batch cannot be processed — current status is "${batch.status}". Only PENDING batches can be executed.`);
    }
    await payment_model_1.default.updateMany({ _id: { $in: batch.paymentIds } }, { $set: { status: payment_interfaces_1.PaymentStatus.COMPLETED, processedAt: new Date() } });
    await timesheet_model_1.default.updateMany({ _id: { $in: batch.timesheetIds } }, { $set: { paymentStatus: 'paid' } });
    const updated = await payment_batch_model_1.default.findByIdAndUpdate(batchId, {
        $set: {
            status: payment_interfaces_1.BatchPaymentStatus.COMPLETED,
            processedCount: batch.totalTimesheets,
            failedCount: 0,
            processedAt: new Date(),
        },
    }, { new: true });
    return updated;
};
exports.executePaymentBatch = executePaymentBatch;
/**
 * List all payment batches for an organisation.
 */
const getPaymentBatches = async (orgId, requestingUserId, options = {}) => {
    var _a, _b, _c;
    await assertOrgManagerOrOwner(orgId, requestingUserId, 'view payment batches for this organisation');
    const filter = { organizationId: orgId };
    if (options.status) {
        filter.status = options.status;
    }
    if (options.currency) {
        filter.currency = options.currency.toUpperCase();
    }
    if (options.dateFrom || options.dateTo) {
        filter.createdOn = {};
        if (options.dateFrom)
            filter.createdOn.$gte = new Date(options.dateFrom);
        if (options.dateTo)
            filter.createdOn.$lte = new Date(options.dateTo);
    }
    return payment_batch_model_1.default.paginate(filter, {
        page: (_a = options.page) !== null && _a !== void 0 ? _a : 1,
        limit: (_b = options.limit) !== null && _b !== void 0 ? _b : 20,
        sortBy: (_c = options.sortBy) !== null && _c !== void 0 ? _c : 'createdAt:desc',
        populate: 'initiatedBy',
    });
};
exports.getPaymentBatches = getPaymentBatches;
/**
 * Get a single payment batch by ID.
 */
const getPaymentBatchById = async (batchId, requestingUserId) => {
    const batch = await payment_batch_model_1.default.findById(batchId).populate('initiatedBy');
    if (!batch) {
        throw new errors_1.ApiError(http_status_1.default.NOT_FOUND, 'Payment batch not found');
    }
    await assertOrgManagerOrOwner(batch.organizationId, requestingUserId, 'view this payment batch');
    return batch;
};
exports.getPaymentBatchById = getPaymentBatchById;
/**
 * Automatically create (or skip if already exists) a Payment record when a
 * timesheet is approved. Safe to call multiple times — idempotent.
 */
const createPaymentForTimesheet = async (timesheetId, initiatedBy) => {
    // Idempotency guard: if a payment already references this timesheet, return it
    const existing = await payment_model_1.default.findOne({ 'paymentItems.timesheetId': timesheetId });
    if (existing)
        return existing;
    const timesheet = await timesheet_model_1.default.findById(timesheetId).lean();
    if (!timesheet) {
        throw new errors_1.ApiError(http_status_1.default.NOT_FOUND, 'Timesheet not found');
    }
    const startMs = new Date(timesheet.startDate).getTime();
    const endMs = new Date(timesheet.endDate).getTime();
    const secondsByProject = await getSessionSecondsByProject(timesheet.userId, timesheet.organizationId, startMs, endMs);
    const totalHolidayHours = await getHolidayHours(timesheet.organizationId, timesheet.startDate, timesheet.endDate);
    const totalPtoHours = await getPtoHours(timesheet.userId, timesheet.organizationId, timesheet.startDate, timesheet.endDate);
    const { projectBreakdowns, totalLoggedHours, totalAmount, currency } = await buildProjectBreakdowns(timesheet.userId, secondsByProject);
    const paymentItem = {
        userId: timesheet.userId,
        timesheetId,
        timesheetStartDate: timesheet.startDate,
        timesheetEndDate: timesheet.endDate,
        totalLoggedHours,
        totalHolidayHours: Number(totalHolidayHours.toFixed(2)),
        totalPtoHours: Number(totalPtoHours.toFixed(2)),
        projectBreakdowns,
        totalAmount,
        currency,
    };
    return upsertPaymentRecord(timesheet.organizationId, initiatedBy, timesheetId, paymentItem, totalAmount, currency);
};
exports.createPaymentForTimesheet = createPaymentForTimesheet;
//# sourceMappingURL=payment.service.js.map