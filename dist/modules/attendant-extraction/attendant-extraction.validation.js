"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listExtractions = void 0;
const joi_1 = __importDefault(require("joi"));
exports.listExtractions = {
    query: joi_1.default.object().keys({
        status: joi_1.default.string().valid('uploaded', 'queued', 'processing', 'parsed', 'attendance_created', 'needs_review', 'failed').optional(),
        sortBy: joi_1.default.string(),
        limit: joi_1.default.number().integer(),
        page: joi_1.default.number().integer(),
    }),
};
//# sourceMappingURL=attendant-extraction.validation.js.map