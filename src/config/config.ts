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
    GCP_SA_TYPE: Joi.string().default('service_account'),
    GCP_SA_PROJECT_ID: Joi.string().optional(),
    GCP_SA_PRIVATE_KEY_ID: Joi.string().allow('').optional(),
    GCP_SA_PRIVATE_KEY: Joi.string().allow('').optional(),
    GCP_SA_CLIENT_EMAIL: Joi.string().allow('').optional(),
    GCP_SA_CLIENT_ID: Joi.string().allow('').optional(),
    GCP_SA_TOKEN_URI: Joi.string().default('https://oauth2.googleapis.com/token'),
    GCP_SA_AUTH_PROVIDER_CERT_URL: Joi.string().default('https://www.googleapis.com/oauth2/v1/certs'),
    GCP_SA_CLIENT_CERT_URL: Joi.string().allow('').optional(),
    GCP_SA_UNIVERSE_DOMAIN: Joi.string().default('googleapis.com'),
    OPENAI_API_KEY: Joi.string().allow('').optional(),
    GEMINI_API_KEY: Joi.string().allow('').optional(),
    ANTHROPIC_API_KEY: Joi.string().allow('').optional(),
    PUSH_NOTIFICATIONS_ENABLED: Joi.boolean().truthy('true').falsy('false').default(true),
    ATTENDANT_UPLOAD_DIR: Joi.string().optional(),
    ATTENDANT_EXTRACTION_USE_PI: Joi.boolean().truthy('true').falsy('false').default(true),
    ATTENDANT_EXTRACTION_PROVIDER: Joi.string().valid('google', 'openai', 'anthropic').optional(),
    ATTENDANT_EXTRACTION_MODEL: Joi.string().trim().optional(),
    ATTENDANT_EXTRACTION_MAX_UPLOAD_MB: Joi.number().integer().min(1).default(10),
    PI_OAUTH_PROVIDER: Joi.string().trim().optional().description('Pi OAuth provider key, e.g. openai-codex'),
    PI_OAUTH_ACCESS_TOKEN: Joi.string().allow('').optional(),
    PI_OAUTH_REFRESH_TOKEN: Joi.string().allow('').optional(),
    PI_OAUTH_EXPIRES_AT: Joi.number().optional(),
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
  googleServiceAccount: {
    type: envVars.GCP_SA_TYPE,
    projectId: envVars.GCP_SA_PROJECT_ID,
    privateKeyId: envVars.GCP_SA_PRIVATE_KEY_ID,
    privateKey: envVars.GCP_SA_PRIVATE_KEY
      ? envVars.GCP_SA_PRIVATE_KEY.replace(/\\n/g, '\n')
      : undefined,
    clientEmail: envVars.GCP_SA_CLIENT_EMAIL,
    clientId: envVars.GCP_SA_CLIENT_ID,
    tokenUri: envVars.GCP_SA_TOKEN_URI,
    authProviderCertUrl: envVars.GCP_SA_AUTH_PROVIDER_CERT_URL,
    clientCertUrl: envVars.GCP_SA_CLIENT_CERT_URL,
    universeDomain: envVars.GCP_SA_UNIVERSE_DOMAIN,
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

  piOAuth: {
    provider: envVars.PI_OAUTH_PROVIDER as string | undefined,
    accessToken: envVars.PI_OAUTH_ACCESS_TOKEN as string | undefined,
    refreshToken: envVars.PI_OAUTH_REFRESH_TOKEN as string | undefined,
    expiresAt: envVars.PI_OAUTH_EXPIRES_AT as number | undefined,
    clientId: envVars.PI_OAUTH_CLIENT_ID as string | undefined,    
  },
}

export default config
