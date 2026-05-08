"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.bulkResolveReviews = exports.resolveReview = exports.listPendingReviews = void 0;
const joi_1 = __importDefault(require("joi"));
exports.listPendingReviews = {
    query: joi_1.default.object().keys({
        extractionId: joi_1.default.string().optional(),
        sortBy: joi_1.default.string(),
        limit: joi_1.default.number().integer(),
        page: joi_1.default.number().integer(),
    }),
};
exports.resolveReview = {
    body: joi_1.default.object().keys({
        resolvedStudentId: joi_1.default.string().optional(),
        resolvedStatus: joi_1.default.string().valid('resolved', 'ignored').optional(),
    }),
};
exports.bulkResolveReviews = {
    body: joi_1.default.object().keys({
        reviewIds: joi_1.default.array().items(joi_1.default.string().required()).min(1).required(),
        resolvedStudentId: joi_1.default.string().optional(),
        resolvedStatus: joi_1.default.string().valid('resolved', 'ignored').optional(),
    }),
};
//# sourceMappingURL=attendant-review.validation.js.map