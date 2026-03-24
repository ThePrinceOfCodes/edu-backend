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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteSchool = exports.updateSchool = exports.getSchool = exports.getSchools = exports.createSchool = void 0;
const http_status_1 = __importDefault(require("http-status"));
const utils_1 = require("../utils");
const schoolService = __importStar(require("./school.service"));
const getSchoolIdFromParams = (req) => {
    const schoolId = req.params['schoolId'];
    return schoolId;
};
exports.createSchool = (0, utils_1.catchAsync)(async (req, res) => {
    const school = await schoolService.createSchool(req.body, req.account);
    res.status(http_status_1.default.CREATED).send(school);
});
exports.getSchools = (0, utils_1.catchAsync)(async (req, res) => {
    const filter = (0, utils_1.pick)(req.query, ['name', 'schoolBoard', 'state', 'localGovernment', 'district', 'status']);
    const options = (0, utils_1.pick)(req.query, ['sortBy', 'limit', 'page']);
    const result = await schoolService.querySchools(filter, options, req.account);
    res.send(result);
});
exports.getSchool = (0, utils_1.catchAsync)(async (req, res) => {
    const school = await schoolService.getSchoolById(getSchoolIdFromParams(req), req.account);
    res.send(school);
});
exports.updateSchool = (0, utils_1.catchAsync)(async (req, res) => {
    const school = await schoolService.updateSchoolById(getSchoolIdFromParams(req), req.body, req.account);
    res.send(school);
});
exports.deleteSchool = (0, utils_1.catchAsync)(async (req, res) => {
    await schoolService.deleteSchoolById(getSchoolIdFromParams(req), req.account);
    res.status(http_status_1.default.NO_CONTENT).send();
});
//# sourceMappingURL=school.controller.js.map