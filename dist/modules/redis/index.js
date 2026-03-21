"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.redisClient = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
const config_1 = __importDefault(require("../../config/config"));
const index_1 = require("../logger/index");
const redisUrl = `redis://${config_1.default.redis.password ? `:${config_1.default.redis.password}@` : ''}${config_1.default.redis.host}:${config_1.default.redis.port}`;
exports.redisClient = new ioredis_1.default(redisUrl, {
    maxRetriesPerRequest: 3,
    retryStrategy: (times) => Math.min(times * 50, 2000),
});
exports.redisClient.on('error', (err) => {
    index_1.logger.error('Redis Client Error', err);
});
exports.redisClient.on('connect', () => {
    index_1.logger.info('Connected to Redis');
});
//# sourceMappingURL=index.js.map