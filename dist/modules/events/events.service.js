"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteEventById = exports.updateEventById = exports.getEventById = exports.queryEvents = exports.createEvent = void 0;
const http_status_1 = __importDefault(require("http-status"));
const errors_1 = require("../errors");
const event_model_1 = __importDefault(require("./event.model"));
const getActorId = (actor) => {
    const id = actor.id || actor._id;
    return String(id);
};
const buildAccessFilter = (actor, queryParams = {}) => {
    const filter = {};
    if (actor.accountType === 'internal') {
        // internal users see all events
        if (queryParams.school) {
            filter['school'] = queryParams.school;
        }
    }
    else if (actor.schoolBoardId) {
        filter['schoolBoard'] = actor.schoolBoardId;
        if (queryParams.school) {
            filter['school'] = queryParams.school;
        }
    }
    else if (actor.schoolId) {
        filter['school'] = actor.schoolId;
    }
    return filter;
};
const createEvent = async (payload, actor) => {
    const actorId = getActorId(actor);
    const event = await event_model_1.default.create(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({ title: payload.title, description: payload.description || null, startDate: payload.startDate }, (payload.endDate !== undefined ? { endDate: payload.endDate } : {})), { allDay: payload.allDay !== undefined ? payload.allDay : true, schoolBoard: actor.schoolBoardId || null }), (payload.school ? { school: payload.school } : {})), (payload.color ? { color: payload.color } : {})), { createdBy: actorId }));
    return event;
};
exports.createEvent = createEvent;
const queryEvents = async (queryParams, options, actor) => {
    const filter = buildAccessFilter(actor, queryParams);
    if (queryParams.startDate) {
        filter['startDate'] = filter['startDate'] || {};
        filter['startDate']['$gte'] = new Date(queryParams.startDate);
    }
    if (queryParams.endDate) {
        filter['startDate'] = filter['startDate'] || {};
        filter['startDate']['$lte'] = new Date(queryParams.endDate);
    }
    const result = await event_model_1.default.paginate(filter, {
        sortBy: options.sortBy || 'startDate:asc',
        limit: options.limit ? Number(options.limit) : 100,
        page: options.page ? Number(options.page) : 1,
    });
    return result;
};
exports.queryEvents = queryEvents;
const getEventById = async (eventId, actor) => {
    const accessFilter = buildAccessFilter(actor);
    const event = await event_model_1.default.findOne(Object.assign({ _id: eventId }, accessFilter));
    if (!event) {
        throw new errors_1.ApiError(http_status_1.default.NOT_FOUND, 'Event not found');
    }
    return event;
};
exports.getEventById = getEventById;
const updateEventById = async (eventId, payload, actor) => {
    const event = await (0, exports.getEventById)(eventId, actor);
    Object.assign(event, Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({}, (payload.title !== undefined ? { title: payload.title } : {})), (payload.description !== undefined ? { description: payload.description } : {})), (payload.startDate !== undefined ? { startDate: payload.startDate } : {})), (payload.endDate !== undefined ? { endDate: payload.endDate } : {})), (payload.allDay !== undefined ? { allDay: payload.allDay } : {})), (payload.school !== undefined ? { school: payload.school } : {})), (payload.color !== undefined ? { color: payload.color } : {})));
    await event.save();
    return event;
};
exports.updateEventById = updateEventById;
const deleteEventById = async (eventId, actor) => {
    const event = await (0, exports.getEventById)(eventId, actor);
    await event.deleteOne();
};
exports.deleteEventById = deleteEventById;
//# sourceMappingURL=events.service.js.map