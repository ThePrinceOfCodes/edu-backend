import { redisClient } from '../redis';

const LAST_FINISHED_KEY = 'attendant-extraction:last-finished-at';
const GLOBAL_COOLDOWN_MS = 10_000;

export const waitForExtractionCooldown = async (): Promise<void> => {
  const lastFinishedAtRaw = await redisClient.get(LAST_FINISHED_KEY);
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

export const markExtractionFinished = async (): Promise<void> => {
  await redisClient.set(LAST_FINISHED_KEY, String(Date.now()));
};
