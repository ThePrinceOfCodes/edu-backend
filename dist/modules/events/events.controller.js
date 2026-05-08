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
exports.deleteEvent = exports.updateEvent = exports.getEvent = exports.getEvents = exports.createEvent = void 0;
const http_status_1 = __importDefault(require("http-status"));
const utils_1 = require("../utils");
const eventsService = __importStar(require("./events.service"));
const getEventIdFromParams = (req) => req.params['eventId'];
exports.createEvent = (0, utils_1.catchAsync)(async (req, res) => {
    const event = await eventsService.createEvent(req.body, req.account);
    res.status(http_status_1.default.CREATED).send(event);
});
exports.getEvents = (0, utils_1.catchAsync)(async (req, res) => {
    const queryParams = (0, utils_1.pick)(req.query, ['school', 'startDate', 'endDate']);
    const options = (0, utils_1.pick)(req.query, ['sortBy', 'limit', 'page']);
    const result = await eventsService.queryEvents(queryParams, options, req.account);
    res.send(result);
});
exports.getEvent = (0, utils_1.catchAsync)(async (req, res) => {
    const event = await eventsService.getEventById(getEventIdFromParams(req), req.account);
    res.send(event);
});
exports.updateEvent = (0, utils_1.catchAsync)(async (req, res) => {
    const event = await eventsService.updateEventById(getEventIdFromParams(req), req.body, req.account);
    res.send(event);
});
exports.deleteEvent = (0, utils_1.catchAsync)(async (req, res) => {
    await eventsService.deleteEventById(getEventIdFromParams(req), req.account);
    res.status(http_status_1.default.NO_CONTENT).send();
});
//# sourceMappingURL=events.controller.js.map