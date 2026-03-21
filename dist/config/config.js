"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const joi_1 = __importDefault(require("joi"));
require("dotenv/config");
const user_constants_1 = require("../modules/users/user.constants");
const envVarsSchema = joi_1.default.object()
    .keys({
    ENV: joi_1.default.string().required(),
    NODE_ENV: joi_1.default.string().valid('production', 'development', 'test').required(),
    REDIS_HOST: joi_1.default.string().required().description('REDIS Host url'),
    REDIS_PASSWORD: joi_1.default.string().required().description('REDIS password'),
    REDIS_PORT: joi_1.default.string().required().description('REDIS port'),
    REDIS_BASE_KEY: joi_1.default.string().required().description("Base key string for redis store"),
    PORT: joi_1.default.number().default(3000),
    MONGODB_URL: joi_1.default.string().required().description('Mongo DB url'),
    SHAREDB_MONGODB_URL: joi_1.default.string().required().description('ShareDB Mongo url'),
    JWT_SECRET: joi_1.default.string().required().description('JWT secret key'),
    JWT_ACCESS_EXPIRATION_MINUTES: joi_1.default.number().default(30).description('minutes after which access tokens expire'),
    JWT_REFRESH_EXPIRATION_DAYS: joi_1.default.number().default(30).description('days after which refresh tokens expire'),
    JWT_RESET_PASSWORD_EXPIRATION_MINUTES: joi_1.default.number()
        .default(10)
        .description('minutes after which reset password token expires'),
    JWT_VERIFY_EMAIL_EXPIRATION_MINUTES: joi_1.default.number()
        .default(10)
        .description('minutes after which verify email token expires'),
    SMTP_HOST: joi_1.default.string().description('server that will send the emails'),
    SMTP_PORT: joi_1.default.number().description('port to connect to the email server'),
    SMTP_USERNAME: joi_1.default.string().description('username for email server'),
    SMTP_PASSWORD: joi_1.default.string().description('password for email server'),
    EMAIL_FROM: joi_1.default.string().description('the from field in the emails sent by the app'),
    CLIENT_URL: joi_1.default.string().required().description('Client url'),
    SEED_INTERNAL_ADMIN_ON_STARTUP: joi_1.default.boolean().truthy('true').falsy('false').default(false),
    INTERNAL_ADMIN_NAME: joi_1.default.string().trim().optional(),
    INTERNAL_ADMIN_EMAIL: joi_1.default.string().trim().email().optional(),
    INTERNAL_ADMIN_PASSWORD: joi_1.default.string().min(8).optional(),
    INTERNAL_ADMIN_ROLE: joi_1.default.string().valid(...user_constants_1.INTERNAL_USER_ROLES).default('super-admin'),
})
    .unknown();
const { value: envVars, error } = envVarsSchema.prefs({ errors: { label: 'key' } }).validate(process.env);
if (error) {
    throw new Error(`Config validation error: ${error.message}`);
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
};
exports.default = config;
//# sourceMappingURL=config.js.map