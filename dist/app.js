"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const xss_clean_1 = __importDefault(require("xss-clean"));
const compression_1 = __importDefault(require("compression"));
const cors_1 = __importDefault(require("cors"));
const http_status_1 = __importDefault(require("http-status"));
const config_1 = __importDefault(require("./config/config"));
const index_1 = require("./modules/logger/index");
const index_2 = require("./modules/errors/index");
require("./modules/redis/index");
const index_3 = __importDefault(require("./routes/v1/index"));
const app = (0, express_1.default)();
if (config_1.default.env !== 'test') {
    app.use(index_1.morgan.successHandler);
    app.use(index_1.morgan.errorHandler);
}
// Set security HTTP headers
app.use((0, helmet_1.default)());
// Enable CORS
app.use((0, cors_1.default)());
app.options('*', (0, cors_1.default)());
// Webhook routes must come before express.json()
// Parse JSON request body
app.use(express_1.default.json({ limit: '6mb' }));
// Parse URL-encoded request body
app.use(express_1.default.urlencoded({ extended: true }));
// Sanitize request data
app.use((0, xss_clean_1.default)());
// Gzip compression
app.use((0, compression_1.default)());
// Health check
app.get('/', (_req, res) => {
    res.status(200).send('OK');
});
// v1 API routes
app.use('/v1', index_3.default);
// Send back a 404 error for any unknown API request
app.use((_req, _res, next) => {
    next(new index_2.ApiError(http_status_1.default.NOT_FOUND, 'Not found'));
});
// Convert error to ApiError, if needed
app.use(index_2.errorConverter);
// Handle error
app.use(index_2.errorHandler);
exports.default = app;
//# sourceMappingURL=app.js.map