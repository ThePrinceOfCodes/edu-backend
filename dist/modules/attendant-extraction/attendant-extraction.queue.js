"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.attendantExtractionJobOptions = exports.attendantExtractionJobName = exports.attendantExtractionQueue = exports.ATTENDANT_EXTRACTION_QUEUE = void 0;
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
//# sourceMappingURL=attendant-extraction.queue.js.map