"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.testPi = exports.testDocumentAi = exports.exportExtraction = exports.approveExtraction = exports.correctExtraction = exports.listPendingReviewExtractions = exports.listExtractions = exports.getExtraction = exports.createExtraction = void 0;
const http_status_1 = __importDefault(require("http-status"));
const utils_1 = require("../utils");
const attendantExtractionService = __importStar(require("./attendant-extraction.service"));
const attendanceCorrectionService = __importStar(require("./attendance-correction.service"));
const attendanceExportService = __importStar(require("./attendance-export.service"));
const attendant_extraction_model_1 = __importDefault(require("./attendant-extraction.model"));
const errors_1 = require("../errors");
const getPublicBaseUrl = (req) => `${req.protocol}://${req.get('host') || ''}`;
exports.createExtraction = (0, utils_1.catchAsync)(async (req, res) => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
    const file = req.file;
    const schoolId = (((_a = req.body) === null || _a === void 0 ? void 0 : _a['schoolId']) || ((_b = req.query) === null || _b === void 0 ? void 0 : _b['schoolId']) || ((_c = req.account) === null || _c === void 0 ? void 0 : _c['schoolId']));
    const termId = (((_d = req.body) === null || _d === void 0 ? void 0 : _d['termId']) || ((_e = req.query) === null || _e === void 0 ? void 0 : _e['termId']));
    const academicSessionId = (((_f = req.body) === null || _f === void 0 ? void 0 : _f['academicSessionId']) || ((_g = req.query) === null || _g === void 0 ? void 0 : _g['academicSessionId']));
    const startDate = ((_h = req.body) === null || _h === void 0 ? void 0 : _h['startDate']) ? new Date(req.body['startDate']) : undefined;
    const endDate = ((_j = req.body) === null || _j === void 0 ? void 0 : _j['endDate']) ? new Date(req.body['endDate']) : undefined;
    if (!schoolId)
        throw new errors_1.ApiError(http_status_1.default.BAD_REQUEST, 'schoolId is required');
    if (!termId)
        throw new errors_1.ApiError(http_status_1.default.BAD_REQUEST, 'termId is required');
    if (!academicSessionId)
        throw new errors_1.ApiError(http_status_1.default.BAD_REQUEST, 'academicSessionId is required');
    if (!startDate || isNaN(startDate.getTime()))
        throw new errors_1.ApiError(http_status_1.default.BAD_REQUEST, 'startDate is required and must be a valid date');
    if (!endDate || isNaN(endDate.getTime()))
        throw new errors_1.ApiError(http_status_1.default.BAD_REQUEST, 'endDate is required and must be a valid date');
    if (startDate > endDate)
        throw new errors_1.ApiError(http_status_1.default.BAD_REQUEST, 'startDate must be before or equal to endDate');
    const upload = await attendantExtractionService.saveUpload(file);
    const extraction = await attendantExtractionService.createExtractionJob(upload, {
        createdBy: String(((_k = req.account) === null || _k === void 0 ? void 0 : _k.id) || ((_l = req.account) === null || _l === void 0 ? void 0 : _l._id) || ''),
        schoolId,
        termId,
        academicSessionId,
        startDate,
        endDate,
    });
    res.status(http_status_1.default.CREATED).send(attendantExtractionService.serializeExtraction(extraction, getPublicBaseUrl(req)));
});
exports.getExtraction = (0, utils_1.catchAsync)(async (req, res) => {
    const extraction = await attendantExtractionService.getExtractionById(req.params['id']);
    if (!extraction) {
        throw new errors_1.ApiError(http_status_1.default.NOT_FOUND, 'Extraction not found');
    }
    res.send(attendantExtractionService.serializeExtraction(extraction, getPublicBaseUrl(req)));
});
exports.listExtractions = (0, utils_1.catchAsync)(async (req, res) => {
    const filter = (0, utils_1.pick)(req.query, ['status']);
    const options = (0, utils_1.pick)(req.query, ['sortBy', 'limit', 'page']);
    const result = await attendant_extraction_model_1.default.paginate(filter, options);
    res.send(Object.assign(Object.assign({}, result), { results: (result.results || []).map((item) => attendantExtractionService.serializeExtraction(item, getPublicBaseUrl(req))) }));
});
exports.listPendingReviewExtractions = (0, utils_1.catchAsync)(async (req, res) => {
    const options = (0, utils_1.pick)(req.query, ['sortBy', 'limit', 'page']);
    const result = await attendantExtractionService.listPendingReviewExtractions(options);
    res.send(Object.assign(Object.assign({}, result), { results: (result.results || []).map((item) => attendantExtractionService.serializeExtraction(item, getPublicBaseUrl(req))) }));
});
exports.correctExtraction = (0, utils_1.catchAsync)(async (req, res) => {
    const extraction = await attendanceCorrectionService.correctExtraction(req.params['id'], req.body);
    res.status(http_status_1.default.OK).send(attendantExtractionService.serializeExtraction(extraction, getPublicBaseUrl(req)));
});
exports.approveExtraction = (0, utils_1.catchAsync)(async (req, res) => {
    var _a, _b;
    const approvedBy = ((_a = req.account) === null || _a === void 0 ? void 0 : _a.id) || ((_b = req.account) === null || _b === void 0 ? void 0 : _b._id);
    if (!approvedBy) {
        throw new errors_1.ApiError(http_status_1.default.UNAUTHORIZED, 'Please authenticate');
    }
    const extraction = await attendanceCorrectionService.approveExtraction(req.params['id'], approvedBy);
    res.status(http_status_1.default.OK).send(attendantExtractionService.serializeExtraction(extraction, getPublicBaseUrl(req)));
});
exports.exportExtraction = (0, utils_1.catchAsync)(async (req, res) => {
    const format = req.query['format'] || 'jsonl';
    const exported = await attendanceExportService.exportExtraction(req.params['id'], format);
    res.setHeader('Content-Type', exported.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${exported.fileName}"`);
    res.status(http_status_1.default.OK).send(exported.body);
});
exports.testDocumentAi = (0, utils_1.catchAsync)(async (req, res) => {
    const file = req.file;
    const result = await attendantExtractionService.runDocumentAiTest(file, {
        includeRaw: req.query['includeRaw'] === 'true',
    });
    res.status(http_status_1.default.OK).send(result);
});
exports.testPi = (0, utils_1.catchAsync)(async (req, res) => {
    var _a, _b, _c;
    const file = req.file;
    const options = {
        includeRawResponse: req.query['includeRawResponse'] === 'true',
        includeValidationErrors: req.query['includeValidationErrors'] !== 'false',
    };
    if ((_a = req.body) === null || _a === void 0 ? void 0 : _a['prompt'])
        options.prompt = req.body['prompt'];
    if ((_b = req.body) === null || _b === void 0 ? void 0 : _b['ocrText'])
        options.ocrText = req.body['ocrText'];
    if ((_c = req.body) === null || _c === void 0 ? void 0 : _c['ocrLayoutSummary'])
        options.ocrLayoutSummary = req.body['ocrLayoutSummary'];
    const result = await attendantExtractionService.runPiTest(file, options);
    res.status(http_status_1.default.OK).send(result);
});
//# sourceMappingURL=attendant-extraction.controller.js.map