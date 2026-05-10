"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.markExtractionFinished = exports.waitForExtractionCooldown = void 0;
const redis_1 = require("../redis");
const LAST_FINISHED_KEY = 'attendant-extraction:last-finished-at';
const GLOBAL_COOLDOWN_MS = 10000;
const waitForExtractionCooldown = async () => {
    const lastFinishedAtRaw = await redis_1.redisClient.get(LAST_FINISHED_KEY);
    const lastFinishedAt = lastFinishedAtRaw ? Number(lastFinishedAtRaw) : 0;
    if (!lastFinishedAt || Number.isNaN(lastFinishedAt)) {
        return;
    }
    const elapsed = Date.now() - lastFinishedAt;
    const remaining = GLOBAL_COOLDOWN_MS - elapsed;
    if (remaining > 0) {
        await new Promise((resolve) => setTimeout(resolve, remaining));
    }
};
exports.waitForExtractionCooldown = waitForExtractionCooldown;
const markExtractionFinished = async () => {
    await redis_1.redisClient.set(LAST_FINISHED_KEY, String(Date.now()));
};
exports.markExtractionFinished = markExtractionFinished;
//# sourceMappingURL=attendant-extraction.throttle.js.map