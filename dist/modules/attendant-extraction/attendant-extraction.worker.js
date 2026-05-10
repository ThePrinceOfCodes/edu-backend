"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.attendantExtractionWorker = void 0;
const bullmq_1 = require("bullmq");
const config_1 = __importDefault(require("../../config/config"));
const attendant_extraction_queue_1 = require("./attendant-extraction.queue");
const attendant_extraction_service_1 = require("./attendant-extraction.service");
const attendant_extraction_throttle_1 = require("./attendant-extraction.throttle");
const connection = {
    host: config_1.default.redis.host,
    port: Number(config_1.default.redis.port),
    password: config_1.default.redis.password,
};
exports.attendantExtractionWorker = new bullmq_1.Worker(attendant_extraction_queue_1.ATTENDANT_EXTRACTION_QUEUE, async (job) => {
    if (job.name !== attendant_extraction_queue_1.attendantExtractionJobName)
        return null;
    await (0, attendant_extraction_throttle_1.waitForExtractionCooldown)();
    const { extractionId } = job.data;
    try {
        return await (0, attendant_extraction_service_1.processExtraction)(extractionId);
    }
    finally {
        await (0, attendant_extraction_throttle_1.markExtractionFinished)();
    }
}, {
    connection: connection,
});
//# sourceMappingURL=attendant-extraction.worker.js.map