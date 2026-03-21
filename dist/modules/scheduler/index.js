"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.agenda = void 0;
const agenda_1 = require("agenda");
const config_1 = __importDefault(require("../../config/config"));
const backgroundTasks_1 = __importDefault(require("./jobs/backgroundTasks"));
const ai_jobs_1 = __importDefault(require("../ai/ai.jobs"));
const agenda = new agenda_1.Agenda({
    db: {
        address: `${config_1.default.mongoose.url}`,
        collection: process.env['SCHEDULER_COLLECTION'] || 'crons',
    },
});
exports.agenda = agenda;
// List the different jobs available throughout your app
const createTimesheets_1 = __importDefault(require("./jobs/createTimesheets"));
const jobTypes = ['backgroundTasks', 'createTimesheets', 'aiJobs'];
// Map job types to their implementations
const jobFunctions = {
    backgroundTasks: backgroundTasks_1.default,
    createTimesheets: createTimesheets_1.default,
    aiJobs: ai_jobs_1.default,
};
// Register jobs with agenda
jobTypes.forEach((type) => {
    const jobFunction = jobFunctions[type];
    if (typeof jobFunction === 'function') {
        jobFunction(agenda);
    }
    else {
        console.warn(`No job function found for type: ${type}`);
    }
});
if (jobTypes.length) {
    agenda.on('ready', async () => {
        await agenda.start();
        await agenda.every('1 hour', 'orchestrate-hourly-insights');
        await agenda.every('1 hour', 'cleanup-completed-jobs');
    });
}
const graceful = () => {
    agenda.stop().then(() => {
        process.exit(0);
    });
};
process.on('SIGTERM', graceful);
process.on('SIGINT', graceful);
//# sourceMappingURL=index.js.map