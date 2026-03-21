"use strict";
/**
 * Seed timesheets for a user across a date range.
 *
 * Each calendar month gets two timesheets:
 *   - First  half : 1st  → 14th
 *   - Second half : 15th → last day of month
 *
 * Timesheets that already exist for the same user / org / date range are
 * skipped, making the function fully idempotent.
 *
 * Usage (standalone):
 *   npx ts-node -r tsconfig-paths/register src/scripts/seedTimesheets.ts
 *
 * Usage (programmatic, e.g. from login):
 *   import { seedUserTimesheets } from '@/scripts/seedTimesheets';
 *   await seedUserTimesheets({ userId, organizationId, from, to });
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedUserTimesheets = void 0;
require("dotenv/config");
const mongoose_1 = __importDefault(require("mongoose"));
const timesheet_model_1 = __importDefault(require("../modules/timesheet/timesheet.model"));
// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
/** Return the last day-of-month date for a given year + month (0-indexed). */
const lastDayOf = (year, month) => new Date(year, month + 1, 0); // day 0 of next month = last day
/** Build the two bi-weekly slots for a calendar month. */
const slotsForMonth = (year, month) => [
    {
        startDate: new Date(year, month, 1),
        endDate: new Date(year, month, 14),
    },
    {
        startDate: new Date(year, month, 15),
        endDate: lastDayOf(year, month),
    },
];
// ---------------------------------------------------------------------------
// Core function
// ---------------------------------------------------------------------------
const seedUserTimesheets = async (opts) => {
    const { userId, organizationId, from, to } = opts;
    // Collect every bi-weekly slot across the requested month range
    const slots = [];
    const cursor = new Date(from.getFullYear(), from.getMonth(), 1);
    const end = new Date(to.getFullYear(), to.getMonth(), 1);
    while (cursor <= end) {
        slots.push(...slotsForMonth(cursor.getFullYear(), cursor.getMonth()));
        cursor.setMonth(cursor.getMonth() + 1);
    }
    // Load existing timesheets for this user / org in the full date window to
    // avoid N round-trips for the idempotency check.
    const existing = await timesheet_model_1.default.find({
        userId,
        organizationId,
        startDate: { $gte: from },
        endDate: { $lte: lastDayOf(to.getFullYear(), to.getMonth()) },
    }).select('startDate endDate').lean();
    const existingKeys = new Set(existing.map((ts) => `${new Date(ts.startDate).toISOString()}|${new Date(ts.endDate).toISOString()}`));
    // Filter to only the slots we still need to create
    const toCreate = slots.filter((s) => !existingKeys.has(`${s.startDate.toISOString()}|${s.endDate.toISOString()}`));
    if (toCreate.length === 0) {
        console.log(`[seedTimesheets] All timesheets already exist for user ${userId} — nothing to do.`);
        return;
    }
    const docs = toCreate.map((s) => ({
        userId,
        organizationId,
        startDate: s.startDate,
        endDate: s.endDate,
        status: 'open',
        paymentStatus: 'notpaid',
        submittedOn: s.startDate, // placeholder; updated when user actually submits
    }));
    await timesheet_model_1.default.insertMany(docs, { ordered: false });
    console.log(`[seedTimesheets] Created ${docs.length} timesheet(s) for user ${userId} ` +
        `(${toCreate.length} new, ${existing.length} already existed).`);
};
exports.seedUserTimesheets = seedUserTimesheets;
// ---------------------------------------------------------------------------
// Standalone entry-point
// ---------------------------------------------------------------------------
const runStandalone = async () => {
    const MONGODB_URL = process.env['MONGODB_URL'];
    if (!MONGODB_URL)
        throw new Error('MONGODB_URL env var is required');
    await mongoose_1.default.connect(MONGODB_URL);
    console.log('[seedTimesheets] Connected to MongoDB');
    await (0, exports.seedUserTimesheets)({
        userId: '066ceabf-6947-4430-bf93-a535f14ee49e',
        organizationId: 'c24fce0e-897c-42fe-bf75-14057504b712',
        from: new Date('2025-12-01'),
        to: new Date('2026-03-01'),
    });
    await mongoose_1.default.disconnect();
    console.log('[seedTimesheets] Done.');
};
// Run when executed directly (ts-node src/scripts/seedTimesheets.ts)
if (require.main === module) {
    runStandalone().catch((err) => {
        console.error('[seedTimesheets] Fatal error:', err);
        process.exit(1);
    });
}
//# sourceMappingURL=seedTimesheets.js.map