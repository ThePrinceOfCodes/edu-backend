"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const http_status_1 = __importDefault(require("http-status"));
const node_mocks_http_1 = __importDefault(require("node-mocks-http"));
const globals_1 = require("@jest/globals");
const winston_1 = __importDefault(require("winston"));
const error_1 = require("./error");
const ApiError_1 = __importDefault(require("./ApiError"));
const config_1 = __importDefault(require("../../config/config"));
const logger_1 = __importDefault(require("../logger/logger"));
describe('Error middlewares', () => {
    describe('Error converter', () => {
        test('should return the same ApiError object it was called with', () => {
            const error = new ApiError_1.default(http_status_1.default.BAD_REQUEST, 'Any error');
            const next = globals_1.jest.fn();
            (0, error_1.errorConverter)(error, node_mocks_http_1.default.createRequest(), node_mocks_http_1.default.createResponse(), next);
            expect(next).toHaveBeenCalledWith(error);
        });
        test('should convert an Error to ApiError and preserve its status and message', () => {
            const error = new Error('Any error');
            error.statusCode = http_status_1.default.BAD_REQUEST;
            const next = globals_1.jest.fn();
            (0, error_1.errorConverter)(error, node_mocks_http_1.default.createRequest(), node_mocks_http_1.default.createResponse(), next);
            expect(next).toHaveBeenCalledWith(expect.any(ApiError_1.default));
            expect(next).toHaveBeenCalledWith(expect.objectContaining({
                statusCode: error.statusCode,
                message: error.message,
                isOperational: false,
            }));
        });
        test('should convert an Error without status to ApiError with status 500', () => {
            const error = new Error('Any error');
            const next = globals_1.jest.fn();
            (0, error_1.errorConverter)(error, node_mocks_http_1.default.createRequest(), node_mocks_http_1.default.createResponse(), next);
            expect(next).toHaveBeenCalledWith(expect.any(ApiError_1.default));
            expect(next).toHaveBeenCalledWith(expect.objectContaining({
                statusCode: http_status_1.default.INTERNAL_SERVER_ERROR,
                message: error.message,
                isOperational: false,
            }));
        });
        test('should convert an Error without message to ApiError with default message of that http status', () => {
            const error = new Error();
            error.statusCode = http_status_1.default.BAD_REQUEST;
            const next = globals_1.jest.fn();
            (0, error_1.errorConverter)(error, node_mocks_http_1.default.createRequest(), node_mocks_http_1.default.createResponse(), next);
            expect(next).toHaveBeenCalledWith(expect.any(ApiError_1.default));
            expect(next).toHaveBeenCalledWith(expect.objectContaining({
                statusCode: error.statusCode,
                isOperational: false,
            }));
        });
        test('should convert a Mongoose error to ApiError with status 400 and preserve its message', () => {
            const error = new mongoose_1.default.Error('Any mongoose error');
            const next = globals_1.jest.fn();
            (0, error_1.errorConverter)(error, node_mocks_http_1.default.createRequest(), node_mocks_http_1.default.createResponse(), next);
            expect(next).toHaveBeenCalledWith(expect.any(ApiError_1.default));
            expect(next).toHaveBeenCalledWith(expect.objectContaining({
                statusCode: http_status_1.default.BAD_REQUEST,
                message: error.message,
                isOperational: false,
            }));
        });
        test('should convert any other object to ApiError with status 500 and its message', () => {
            const error = {};
            const next = globals_1.jest.fn();
            (0, error_1.errorConverter)(error, node_mocks_http_1.default.createRequest(), node_mocks_http_1.default.createResponse(), next);
            expect(next).toHaveBeenCalledWith(expect.any(ApiError_1.default));
            expect(next).toHaveBeenCalledWith(expect.objectContaining({
                statusCode: http_status_1.default.INTERNAL_SERVER_ERROR,
                message: http_status_1.default[http_status_1.default.INTERNAL_SERVER_ERROR],
                isOperational: false,
            }));
        });
    });
    describe('Error handler', () => {
        beforeEach(() => {
            globals_1.jest.spyOn(logger_1.default, 'error').mockImplementation(() => winston_1.default.createLogger({}));
        });
        test('should send proper error response and put the error message in res.locals', () => {
            const error = new ApiError_1.default(http_status_1.default.BAD_REQUEST, 'Any error');
            const res = node_mocks_http_1.default.createResponse();
            const next = globals_1.jest.fn();
            const sendSpy = globals_1.jest.spyOn(res, 'send');
            (0, error_1.errorHandler)(error, node_mocks_http_1.default.createRequest(), res, next);
            expect(sendSpy).toHaveBeenCalledWith(expect.objectContaining({ code: error.statusCode, message: error.message }));
            expect(res.locals['errorMessage']).toBe(error.message);
        });
        test('should put the error stack in the response if in development mode', () => {
            config_1.default.env = 'development';
            const error = new ApiError_1.default(http_status_1.default.BAD_REQUEST, 'Any error');
            const res = node_mocks_http_1.default.createResponse();
            const next = globals_1.jest.fn();
            const sendSpy = globals_1.jest.spyOn(res, 'send');
            (0, error_1.errorHandler)(error, node_mocks_http_1.default.createRequest(), res, next);
            expect(sendSpy).toHaveBeenCalledWith(expect.objectContaining({ code: error.statusCode, message: error.message, stack: error.stack }));
            config_1.default.env = process.env['NODE_ENV'];
        });
        test('should send internal server error status and message if in production mode and error is not operational', () => {
            config_1.default.env = 'production';
            const error = new ApiError_1.default(http_status_1.default.BAD_REQUEST, 'Any error', false);
            const res = node_mocks_http_1.default.createResponse();
            const next = globals_1.jest.fn();
            const sendSpy = globals_1.jest.spyOn(res, 'send');
            (0, error_1.errorHandler)(error, node_mocks_http_1.default.createRequest(), res, next);
            expect(sendSpy).toHaveBeenCalledWith(expect.objectContaining({
                code: http_status_1.default.INTERNAL_SERVER_ERROR,
                message: http_status_1.default[http_status_1.default.INTERNAL_SERVER_ERROR],
            }));
            expect(res.locals['errorMessage']).toBe(error.message);
            config_1.default.env = process.env['NODE_ENV'];
        });
        test('should preserve original error status and message if in production mode and error is operational', () => {
            config_1.default.env = 'production';
            const error = new ApiError_1.default(http_status_1.default.BAD_REQUEST, 'Any error');
            const res = node_mocks_http_1.default.createResponse();
            const next = globals_1.jest.fn();
            const sendSpy = globals_1.jest.spyOn(res, 'send');
            (0, error_1.errorHandler)(error, node_mocks_http_1.default.createRequest(), res, next);
            expect(sendSpy).toHaveBeenCalledWith(expect.objectContaining({
                code: error.statusCode,
                message: error.message,
            }));
            config_1.default.env = process.env['NODE_ENV'];
        });
    });
});
//# sourceMappingURL=error.test.js.map