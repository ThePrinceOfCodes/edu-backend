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
exports.deleteResult = exports.updateResult = exports.getResult = exports.getResults = exports.createResultsBulk = exports.createResult = void 0;
const http_status_1 = __importDefault(require("http-status"));
const utils_1 = require("../utils");
const resultService = __importStar(require("./result.service"));
const getResultIdFromParams = (req) => req.params['resultId'];
exports.createResult = (0, utils_1.catchAsync)(async (req, res) => {
    const result = await resultService.createResult(req.body, req.account);
    res.status(http_status_1.default.CREATED).send(result);
});
exports.createResultsBulk = (0, utils_1.catchAsync)(async (req, res) => {
    const result = await resultService.createResultsBulk(req.body.results, req.account);
    res.status(http_status_1.default.CREATED).send(result);
});
exports.getResults = (0, utils_1.catchAsync)(async (req, res) => {
    const filter = (0, utils_1.pick)(req.query, ['student', 'school', 'classId', 'termId', 'academicSessionId', 'subject']);
    const options = (0, utils_1.pick)(req.query, ['sortBy', 'limit', 'page']);
    const result = await resultService.queryResults(filter, options, req.account);
    res.send(result);
});
exports.getResult = (0, utils_1.catchAsync)(async (req, res) => {
    const result = await resultService.getResultById(getResultIdFromParams(req), req.account);
    res.send(result);
});
exports.updateResult = (0, utils_1.catchAsync)(async (req, res) => {
    const result = await resultService.updateResultById(getResultIdFromParams(req), req.body, req.account);
    res.send(result);
});
exports.deleteResult = (0, utils_1.catchAsync)(async (req, res) => {
    await resultService.deleteResultById(getResultIdFromParams(req), req.account);
    res.status(http_status_1.default.NO_CONTENT).send();
});
//# sourceMappingURL=result.controller.js.map