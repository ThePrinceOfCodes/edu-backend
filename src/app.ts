import express, { Express } from 'express';
import helmet from 'helmet';
import xss from 'xss-clean';
import compression from 'compression';
import cors from 'cors';
import httpStatus from 'http-status';
import config from './config/config';
import { morgan } from './modules/logger/index';
import { ApiError, errorConverter, errorHandler } from './modules/errors/index';
import './modules/redis/index';
import routes from './routes/v1/index';

const app: Express = express();

if (config.env !== 'test') {
  app.use(morgan.successHandler);
  app.use(morgan.errorHandler);
}

// Set security HTTP headers
app.use(helmet());

// Enable CORS

app.use(cors() as any);
app.options('*', cors() as any);

// Webhook routes must come before express.json()

// Parse JSON request body
app.use(express.json({ limit: '6mb' }));

// Parse URL-encoded request body
app.use(express.urlencoded({ extended: true }));

// Sanitize request data
app.use(xss());

// Gzip compression
app.use(compression() as any);

// Health check
app.get('/', (_req, res) => {
  res.status(200).send('OK');
});

// v1 API routes
app.use('/v1', routes);

// Send back a 404 error for any unknown API request
app.use((_req, _res, next) => {
  next(new ApiError(httpStatus.NOT_FOUND, 'Not found'));
});

// Convert error to ApiError, if needed
app.use(errorConverter);

// Handle error
app.use(errorHandler);

export default app;
