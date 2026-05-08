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
const connection = {
    host: config_1.default.redis.host,
    port: Number(config_1.default.redis.port),
    password: config_1.default.redis.password,
};
exports.attendantExtractionWorker = new bullmq_1.Worker(attendant_extraction_queue_1.ATTENDANT_EXTRACTION_QUEUE, async (job) => {
    if (job.name !== attendant_extraction_queue_1.attendantExtractionJobName)
        return null;
    const { extractionId } = job.data;
    return (0, attendant_extraction_service_1.processExtraction)(extractionId);
}, {
    connection: connection,
});
//# sourceMappingURL=attendant-extraction.worker.js.map