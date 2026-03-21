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
exports.deleteStaff = exports.updateStaff = exports.getStaffById = exports.getStaff = exports.createStaff = void 0;
const http_status_1 = __importDefault(require("http-status"));
const utils_1 = require("../utils");
const staffService = __importStar(require("./staff.service"));
const getStaffIdFromParams = (req) => {
    const staffId = req.params['staffId'];
    return staffId;
};
exports.createStaff = (0, utils_1.catchAsync)(async (req, res) => {
    const staff = await staffService.createStaff(req.body, req.account);
    res.status(http_status_1.default.CREATED).send(staff);
});
exports.getStaff = (0, utils_1.catchAsync)(async (req, res) => {
    const filter = (0, utils_1.pick)(req.query, ['user', 'schoolBoard', 'school', 'employmentType', 'isActive']);
    const options = (0, utils_1.pick)(req.query, ['sortBy', 'limit', 'page']);
    const result = await staffService.queryStaff(filter, options, req.account);
    res.send(result);
});
exports.getStaffById = (0, utils_1.catchAsync)(async (req, res) => {
    const staff = await staffService.getStaffById(getStaffIdFromParams(req), req.account);
    res.send(staff);
});
exports.updateStaff = (0, utils_1.catchAsync)(async (req, res) => {
    const staff = await staffService.updateStaffById(getStaffIdFromParams(req), req.body, req.account);
    res.send(staff);
});
exports.deleteStaff = (0, utils_1.catchAsync)(async (req, res) => {
    await staffService.deleteStaffById(getStaffIdFromParams(req), req.account);
    res.status(http_status_1.default.NO_CONTENT).send();
});
//# sourceMappingURL=staff.controller.js.map