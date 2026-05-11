import { Queue } from 'bullmq';
import config from '../../config/config';

export const ATTENDANT_EXTRACTION_QUEUE = 'attendant-extraction';

const connection = {
  host: config.redis.host,
  port: Number(config.redis.port),
  password: config.redis.password,
};

export const attendantExtractionQueue = new Queue(ATTENDANT_EXTRACTION_QUEUE, {
  connection: connection as any,
});

export const createAttendantExtractionQueue = () => new Queue(ATTENDANT_EXTRACTION_QUEUE, {
  connection: connection as any,
});

export const attendantExtractionJobName = 'processAttendantExtraction';

export const attendantExtractionJobOptions = {
  attempts: 5,
  backoff: {
    type: 'exponential',
    delay: 30_000,
  },
  removeOnComplete: true,
  removeOnFail: 100,
};

export const getQueueStatus = async () => {
  const counts = await attendantExtractionQueue.getJobCounts('waiting', 'active', 'completed', 'failed', 'delayed');
  const paused = await attendantExtractionQueue.isPaused();
  return {
    queue: ATTENDANT_EXTRACTION_QUEUE,
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

export const pauseQueue = async () => {
  await attendantExtractionQueue.pause();
  return { queue: ATTENDANT_EXTRACTION_QUEUE, paused: true };
};

export const resumeQueue = async () => {
  await attendantExtractionQueue.resume();
  return { queue: ATTENDANT_EXTRACTION_QUEUE, paused: false };
};

export const cleanQueue = async (age?: number) => {
  const maxAge = age || 24 * 60 * 60 * 1000;
  const completed = await attendantExtractionQueue.clean(maxAge, 100, 'completed');
  const failed = await attendantExtractionQueue.clean(maxAge, 100, 'failed');
  return {
    cleaned: {
      completed: completed.length,
      failed: failed.length,
    },
  };
};

export const retryFailedJobs = async () => {
  const queue = createAttendantExtractionQueue();
  const failedJobs = await queue.getFailed();
  let retriedCount = 0;

  for (const job of failedJobs) {
    try {
      await job.retry();
      retriedCount++;
    } catch (error) {
      console.error(`Failed to retry job ${job.id}:`, error);
    }
  }

  return { retriedCount };
};

export const getQueueJobs = async (type: 'waiting' | 'active' | 'failed', start = 0, end = 20) => {
  const queue = createAttendantExtractionQueue();
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