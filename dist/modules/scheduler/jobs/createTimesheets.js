"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const organization_member_model_1 = __importDefault(require("../../organizations/organization_member.model"));
const timesheet_model_1 = __importDefault(require("../../timesheet/timesheet.model"));
exports.default = async (agenda) => {
    agenda.define('createTimesheets', async (_job) => {
        console.log('Running createTimesheets job check');
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowDate = tomorrow.getDate();
        let startDate;
        let endDate;
        // Condition 1: If tomorrow is the 1st, generate for 1st-15th of that new month
        if (tomorrowDate === 1) {
            console.log('Tomorrow is the 1st. Generating timesheets for 1st-15th.');
            startDate = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), 1);
            endDate = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), 15, 23, 59, 59, 999);
        }
        // Condition 2: If tomorrow is the 16th, generate for 16th-End of this month
        else if (tomorrowDate === 16) {
            console.log('Tomorrow is the 16th. Generating timesheets for 16th-End of month.');
            startDate = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), 16);
            // Get last day of the current month
            endDate = new Date(tomorrow.getFullYear(), tomorrow.getMonth() + 1, 0, 23, 59, 59, 999);
        }
        else {
            console.log(`Tomorrow is the ${tomorrowDate}th. No timesheets to generate.`);
            return;
        }
        try {
            // Find all members who can submit timesheets
            const eligibleMembers = await organization_member_model_1.default.find({
                canSubmitTimesheet: true,
                status: 'active',
            });
            console.log(`Found ${eligibleMembers.length} eligible members`);
            for (const member of eligibleMembers) {
                // Check if timesheet already exists for this period
                const existingTimesheet = await timesheet_model_1.default.findOne({
                    userId: member.userId,
                    organizationId: member.organizationId,
                    startDate: startDate,
                    endDate: endDate
                });
                if (!existingTimesheet) {
                    await timesheet_model_1.default.create({
                        startDate,
                        endDate,
                        status: 'open',
                        submittedOn: now,
                        organizationId: member.organizationId,
                        userId: member.userId,
                    });
                    console.log(`Created timesheet for User ${member.userId} in Org ${member.organizationId} (${startDate.toISOString()} - ${endDate.toISOString()})`);
                }
                else {
                    console.log(`Timesheet already exists for User ${member.userId} in Org ${member.organizationId}`);
                }
            }
        }
        catch (error) {
            console.error('Error creating timesheets:', error);
        }
    });
    // Schedule the job daily at 23:55
    agenda.on('ready', async () => {
        await agenda.every('55 23 * * *', 'createTimesheets');
    });
};
//# sourceMappingURL=createTimesheets.js.map