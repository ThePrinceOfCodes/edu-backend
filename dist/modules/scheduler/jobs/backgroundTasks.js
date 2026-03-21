"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = async (agenda) => {
    agenda.define("cleanup-completed-jobs", async () => {
        console.log("[Scheduler] Running cleanup-completed-jobs...");
        try {
            const result = await agenda.cancel({
                lastFinishedAt: { $exists: true },
                nextRunAt: null,
            });
            console.log(`[Scheduler] Removed ${result} completed jobs.`);
        }
        catch (error) {
            console.error("[Scheduler] Error cleaning up completed jobs:", error);
        }
    });
};
//# sourceMappingURL=backgroundTasks.js.map