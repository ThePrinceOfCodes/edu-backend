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
exports.deleteSchoolType = exports.updateSchoolType = exports.getSchoolType = exports.getSchoolTypes = exports.createSchoolType = void 0;
const http_status_1 = __importDefault(require("http-status"));
const utils_1 = require("../utils");
const schoolTypeService = __importStar(require("./schoolType.service"));
const getSchoolTypeIdFromParams = (req) => req.params['schoolTypeId'];
exports.createSchoolType = (0, utils_1.catchAsync)(async (req, res) => {
    const schoolType = await schoolTypeService.createSchoolType(req.body);
    res.status(http_status_1.default.CREATED).send(schoolType);
});
exports.getSchoolTypes = (0, utils_1.catchAsync)(async (req, res) => {
    const filter = (0, utils_1.pick)(req.query, ['name']);
    const options = (0, utils_1.pick)(req.query, ['sortBy', 'limit', 'page']);
    const result = await schoolTypeService.querySchoolTypes(filter, options);
    res.send(result);
});
exports.getSchoolType = (0, utils_1.catchAsync)(async (req, res) => {
    const schoolType = await schoolTypeService.getSchoolTypeById(getSchoolTypeIdFromParams(req));
    res.send(schoolType);
});
exports.updateSchoolType = (0, utils_1.catchAsync)(async (req, res) => {
    const schoolType = await schoolTypeService.updateSchoolTypeById(getSchoolTypeIdFromParams(req), req.body);
    res.send(schoolType);
});
exports.deleteSchoolType = (0, utils_1.catchAsync)(async (req, res) => {
    await schoolTypeService.deleteSchoolTypeById(getSchoolTypeIdFromParams(req));
    res.status(http_status_1.default.NO_CONTENT).send();
});
//# sourceMappingURL=schoolType.controller.js.map