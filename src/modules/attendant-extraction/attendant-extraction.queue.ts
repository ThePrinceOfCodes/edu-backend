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

export const attendantExtractionJobName = 'process-attendant-extraction';
