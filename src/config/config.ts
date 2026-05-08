import Joi from 'joi'
import 'dotenv/config'

import { INTERNAL_USER_ROLES } from '../modules/users/user.constants';

const envVarsSchema = Joi.object()
  .keys({
    ENV: Joi.string().required(),
    NODE_ENV: Joi.string().valid('production', 'development', 'test').required(),
    REDIS_HOST: Joi.string().required().description('REDIS Host url'),
    REDIS_PASSWORD: Joi.string().required().description('REDIS password'),
    REDIS_PORT: Joi.string().required().description('REDIS port'),
    REDIS_BASE_KEY: Joi.string().required().description("Base key string for redis store"),
    PORT: Joi.number().default(3000),
    MONGODB_URL: Joi.string().required().description('Mongo DB url'),
    SHAREDB_MONGODB_URL: Joi.string().required().description('ShareDB Mongo url'),
    JWT_SECRET: Joi.string().required().description('JWT secret key'),
    JWT_ACCESS_EXPIRATION_MINUTES: Joi.number().default(30).description('minutes after which access tokens expire'),
    JWT_REFRESH_EXPIRATION_DAYS: Joi.number().default(30).description('days after which refresh tokens expire'),
    JWT_RESET_PASSWORD_EXPIRATION_MINUTES: Joi.number()
      .default(10)
      .description('minutes after which reset password token expires'),
    JWT_VERIFY_EMAIL_EXPIRATION_MINUTES: Joi.number()
      .default(10)
      .description('minutes after which verify email token expires'),

    SMTP_HOST: Joi.string().description('server that will send the emails'),
    SMTP_PORT: Joi.number().description('port to connect to the email server'),
    SMTP_USERNAME: Joi.string().description('username for email server'),
    SMTP_PASSWORD: Joi.string().description('password for email server'),
    EMAIL_FROM: Joi.string().description('the from field in the emails sent by the app'),
    CLIENT_URL: Joi.string().required().description('Client url'),
    SEED_INTERNAL_ADMIN_ON_STARTUP: Joi.boolean().truthy('true').falsy('false').default(false),
    INTERNAL_ADMIN_NAME: Joi.string().trim().optional(),
    INTERNAL_ADMIN_EMAIL: Joi.string().trim().email().optional(),
    INTERNAL_ADMIN_PASSWORD: Joi.string().min(8).optional(),
    INTERNAL_ADMIN_ROLE: Joi.string().valid(...INTERNAL_USER_ROLES).default('super-admin'),
    GOOGLE_CLOUD_PROJECT_ID: Joi.string().optional(),
    GOOGLE_CLOUD_LOCATION: Joi.string().valid('us', 'eu').optional(),
    GOOGLE_CLOUD_DOCUMENT_AI_PROCESSOR_ID: Joi.string().optional(),
    DOCUMENT_AI_PROCESSOR_ID: Joi.string().optional(),
    OPENAI_API_KEY: Joi.string().allow('').optional(),
    GEMINI_API_KEY: Joi.string().allow('').optional(),
    ANTHROPIC_API_KEY: Joi.string().allow('').optional(),
    PUSH_NOTIFICATIONS_ENABLED: Joi.boolean().truthy('true').falsy('false').default(true),
    ATTENDANT_UPLOAD_DIR: Joi.string().optional(),
    ATTENDANT_EXTRACTION_USE_PI: Joi.boolean().truthy('true').falsy('false').default(true),
    ATTENDANT_EXTRACTION_PROVIDER: Joi.string().valid('google', 'openai', 'anthropic').optional(),
    ATTENDANT_EXTRACTION_MODEL: Joi.string().trim().optional(),
    ATTENDANT_EXTRACTION_MAX_UPLOAD_MB: Joi.number().integer().min(1).default(10),
  })
  .unknown()

const { value: envVars, error } = envVarsSchema.prefs({ errors: { label: 'key' } }).validate(process.env)

if (error) {
  throw new Error(`Config validation error: ${error.message}`)
}

const config = {
  env: envVars.NODE_ENV,
  server: envVars.ENV,
  port: envVars.PORT,
  mongoose: {
    url: envVars.MONGODB_URL + (envVars.NODE_ENV === 'test' ? '-test' : ''),
    options: {
      useCreateIndex: true,
      useNewUrlParser: true,
      useUnifiedTopology: true,
    },
  },
  webhooks: {
    url: envVars.WEBHOOK_URL
  },
  jwt: {
    secret: envVars.JWT_SECRET,
    accessExpirationMinutes: envVars.JWT_ACCESS_EXPIRATION_MINUTES,
    refreshExpirationDays: envVars.JWT_REFRESH_EXPIRATION_DAYS,
    resetPasswordExpirationMinutes: envVars.JWT_RESET_PASSWORD_EXPIRATION_MINUTES,
    verifyEmailExpirationMinutes: envVars.JWT_VERIFY_EMAIL_EXPIRATION_MINUTES,
    cookieOptions: {
      httpOnly: true,
      secure: envVars.NODE_ENV === 'production',
      signed: true,
    },
  },
  email: {
    smtp: {
      host: envVars.SMTP_HOST,
      port: envVars.SMTP_PORT,
      auth: {
        user: envVars.SMTP_USERNAME,
        pass: envVars.SMTP_PASSWORD,
      },
    },
    from: envVars.EMAIL_FROM,
  },
  redis: {
    host: envVars.REDIS_HOST,
    password: envVars.REDIS_PASSWORD,
    port: envVars.REDIS_PORT
  },
  redisBaseKey: envVars.REDIS_BASE_KEY,
  clientUrl: envVars.CLIENT_URL,
  shareDbUrl: envVars.SHAREDB_MONGODB_URL,
  internalAdminSeed: {
    enabled: envVars.SEED_INTERNAL_ADMIN_ON_STARTUP,
    name: envVars.INTERNAL_ADMIN_NAME,
    email: envVars.INTERNAL_ADMIN_EMAIL,
    password: envVars.INTERNAL_ADMIN_PASSWORD,
    role: envVars.INTERNAL_ADMIN_ROLE,
  },
  googleDocumentAi: {
    projectId: envVars.GOOGLE_CLOUD_PROJECT_ID,
    location: envVars.GOOGLE_CLOUD_LOCATION,
    processorId: envVars.DOCUMENT_AI_PROCESSOR_ID || envVars.GOOGLE_CLOUD_DOCUMENT_AI_PROCESSOR_ID,
  },
  pushNotifications: {
    enabled: envVars.PUSH_NOTIFICATIONS_ENABLED,
    projectId: envVars.GOOGLE_CLOUD_PROJECT_ID,
  },
  attendantUploadsDir: envVars.ATTENDANT_UPLOAD_DIR || 'uploads/attendant-extractions',
  attendanceExtraction: {
    usePi: envVars.ATTENDANT_EXTRACTION_USE_PI,
    provider: envVars.ATTENDANT_EXTRACTION_PROVIDER,
    model: envVars.ATTENDANT_EXTRACTION_MODEL,
    maxUploadMb: envVars.ATTENDANT_EXTRACTION_MAX_UPLOAD_MB,
    apiKeys: {
      openai: envVars.OPENAI_API_KEY,
      google: envVars.GEMINI_API_KEY,
      anthropic: envVars.ANTHROPIC_API_KEY,
    },
  },
}

export default config
