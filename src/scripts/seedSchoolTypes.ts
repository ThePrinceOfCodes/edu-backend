import mongoose from 'mongoose';
import config from '../config/config';
import logger from '../modules/logger/logger';
import { SchoolType } from '../modules/school-type';

const SCHOOL_TYPE_NAMES = ['Nursery', 'Primary', 'Junior Secondary', 'Senior Secondary'];

const run = async () => {
  try {
    await mongoose.connect(config.mongoose.url);
    logger.info('Connected to MongoDB for school type seed');

    for (const name of SCHOOL_TYPE_NAMES) {
      await SchoolType.findOneAndUpdate(
        { name },
        { $set: { name } },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }

    logger.info('School types seeded successfully');
  } finally {
    await mongoose.disconnect();
  }
};

run()
  .then(() => {
    logger.info('School type seed completed');
    process.exit(0);
  })
  .catch((error: Error) => {
    logger.error(error.message);
    process.exit(1);
  });
