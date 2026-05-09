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
exports.deleteClass = exports.updateClass = exports.getClass = exports.getClasses = exports.createClass = void 0;
const http_status_1 = __importDefault(require("http-status"));
const utils_1 = require("../utils");
const classService = __importStar(require("./class.service"));
const getClassIdFromParams = (req) => req.params['classId'];
exports.createClass = (0, utils_1.catchAsync)(async (req, res) => {
    const created = await classService.createClass(req.body);
    res.status(http_status_1.default.CREATED).send(created);
});
exports.getClasses = (0, utils_1.catchAsync)(async (req, res) => {
    const filter = (0, utils_1.pick)(req.query, ['name', 'code', 'schoolTypeId']);
    const options = (0, utils_1.pick)(req.query, ['sortBy', 'limit', 'page']);
    const requestedSchoolId = req.query['schoolId'];
    const result = await classService.queryClasses(filter, options, req.account, requestedSchoolId);
    res.send(result);
});
exports.getClass = (0, utils_1.catchAsync)(async (req, res) => {
    const found = await classService.getClassById(getClassIdFromParams(req));
    res.send(found);
});
exports.updateClass = (0, utils_1.catchAsync)(async (req, res) => {
    const updated = await classService.updateClassById(getClassIdFromParams(req), req.body);
    res.send(updated);
});
exports.deleteClass = (0, utils_1.catchAsync)(async (req, res) => {
    await classService.deleteClassById(getClassIdFromParams(req));
    res.status(http_status_1.default.NO_CONTENT).send();
});
//# sourceMappingURL=class.controller.js.map