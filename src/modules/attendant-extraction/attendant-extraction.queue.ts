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
