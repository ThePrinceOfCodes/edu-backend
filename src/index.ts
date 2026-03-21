import mongoose from 'mongoose';
import http from 'http';
import app from './app';
import config from './config/config';
import logger from './modules/logger/logger';
import { seedInternalAdminUser } from './modules/users/user.seed';
let server: http.Server;

// Create HTTP server using Express app
server = http.createServer(app);

mongoose.connect(config.mongoose.url).then(async () => {
  logger.info('Connected to MongoDB');

  if (config.internalAdminSeed.enabled) {
    await seedInternalAdminUser({ requireConfig: true });
  }

  server.listen(config.port, () => {
    logger.info(`Listening to port ${config.port}`);
  });
});

const exitHandler = () => {
  if (server) {
    server.close(() => {
      logger.info('Server closed');
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
};

const unexpectedErrorHandler = (error: string) => {
  logger.error(error);
  exitHandler();
};

process.on('uncaughtException', unexpectedErrorHandler);
process.on('unhandledRejection', unexpectedErrorHandler);

process.on('SIGTERM', () => {
  logger.info('SIGTERM received');
  if (server) {
    server.close();
  }
});
