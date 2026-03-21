import mongoose from 'mongoose';
import config from '../config/config';
import logger from '../modules/logger/logger';
import { seedInternalAdminUser } from '../modules/users/user.seed';

const run = async () => {
  try {
    await mongoose.connect(config.mongoose.url);
    logger.info('Connected to MongoDB for internal admin seed');

    const result = await seedInternalAdminUser({ requireConfig: true });

    if (!result.seeded) {
      throw new Error('Internal admin seed configuration is missing.');
    }
  } finally {
    await mongoose.disconnect();
  }
};

run()
  .then(() => {
    logger.info('Internal admin seed completed');
    process.exit(0);
  })
  .catch((error: Error) => {
    logger.error(error.message);
    process.exit(1);
  });