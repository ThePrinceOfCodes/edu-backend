import { Worker } from 'bullmq';
import config from '../../config/config';
import { ATTENDANT_EXTRACTION_QUEUE, attendantExtractionJobName } from './attendant-extraction.queue';
import { processExtraction } from './attendant-extraction.service';

const connection = {
  host: config.redis.host,
  port: Number(config.redis.port),
  password: config.redis.password,
};

export const attendantExtractionWorker = new Worker(
  ATTENDANT_EXTRACTION_QUEUE,
  async (job) => {
    if (job.name !== attendantExtractionJobName) return null;
    const { extractionId } = job.data as { extractionId: string };
    return processExtraction(extractionId);
  },
  {
    connection: connection as any,
  }
);
