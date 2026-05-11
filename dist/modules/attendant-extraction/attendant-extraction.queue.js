"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getQueueJobs = exports.retryFailedJobs = exports.cleanQueue = exports.resumeQueue = exports.pauseQueue = exports.getQueueStatus = exports.attendantExtractionJobOptions = exports.attendantExtractionJobName = exports.createAttendantExtractionQueue = exports.attendantExtractionQueue = exports.ATTENDANT_EXTRACTION_QUEUE = void 0;
const bullmq_1 = require("bullmq");
const config_1 = __importDefault(require("../../config/config"));
exports.ATTENDANT_EXTRACTION_QUEUE = 'attendant-extraction';
const connection = {
    host: config_1.default.redis.host,
    port: Number(config_1.default.redis.port),
    password: config_1.default.redis.password,
};
exports.attendantExtractionQueue = new bullmq_1.Queue(exports.ATTENDANT_EXTRACTION_QUEUE, {
    connection: connection,
});
const createAttendantExtractionQueue = () => new bullmq_1.Queue(exports.ATTENDANT_EXTRACTION_QUEUE, {
    connection: connection,
});
exports.createAttendantExtractionQueue = createAttendantExtractionQueue;
exports.attendantExtractionJobName = 'processAttendantExtraction';
exports.attendantExtractionJobOptions = {
    attempts: 5,
    backoff: {
        type: 'exponential',
        delay: 30000,
    },
    removeOnComplete: true,
    removeOnFail: 100,
};
const getQueueStatus = async () => {
    const counts = await exports.attendantExtractionQueue.getJobCounts('waiting', 'active', 'completed', 'failed', 'delayed');
    const paused = await exports.attendantExtractionQueue.isPaused();
    return {
        queue: exports.ATTENDANT_EXTRACTION_QUEUE,
        paused,
        counts: {
            waiting: counts['waiting'] || 0,
            active: counts['active'] || 0,
            completed: counts['completed'] || 0,
            failed: counts['failed'] || 0,
            delayed: counts['delayed'] || 0,
        },
    };
};
exports.getQueueStatus = getQueueStatus;
const pauseQueue = async () => {
    await exports.attendantExtractionQueue.pause();
    return { queue: exports.ATTENDANT_EXTRACTION_QUEUE, paused: true };
};
exports.pauseQueue = pauseQueue;
const resumeQueue = async () => {
    await exports.attendantExtractionQueue.resume();
    return { queue: exports.ATTENDANT_EXTRACTION_QUEUE, paused: false };
};
exports.resumeQueue = resumeQueue;
const cleanQueue = async (age) => {
    const maxAge = age || 24 * 60 * 60 * 1000;
    const completed = await exports.attendantExtractionQueue.clean(maxAge, 100, 'completed');
    const failed = await exports.attendantExtractionQueue.clean(maxAge, 100, 'failed');
    return {
        cleaned: {
            completed: completed.length,
            failed: failed.length,
        },
    };
};
exports.cleanQueue = cleanQueue;
const retryFailedJobs = async () => {
    const queue = (0, exports.createAttendantExtractionQueue)();
    const failedJobs = await queue.getFailed();
    let retriedCount = 0;
    for (const job of failedJobs) {
        try {
            await job.retry();
            retriedCount++;
        }
        catch (error) {
            console.error(`Failed to retry job ${job.id}:`, error);
        }
    }
    return { retriedCount };
};
exports.retryFailedJobs = retryFailedJobs;
const getQueueJobs = async (type, start = 0, end = 20) => {
    const queue = (0, exports.createAttendantExtractionQueue)();
    const jobs = await queue.getJobs(type, start, end);
    return jobs.map((job) => ({
        id: job.id,
        name: job.name,
        data: job.data,
        progress: job.progress,
        attemptsMade: job.attemptsMade,
        finishedOn: job.finishedOn,
        failedReason: job.failedReason,
        timestamp: job.timestamp,
    }));
};
exports.getQueueJobs = getQueueJobs;
//# sourceMappingURL=attendant-extraction.queue.js.map