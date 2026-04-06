"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendMessage = exports.queryThreadMessages = exports.queryThreads = exports.createThread = void 0;
const http_status_1 = __importDefault(require("http-status"));
const errors_1 = require("../errors");
const message_model_1 = __importDefault(require("./message.model"));
const messagingThread_model_1 = __importDefault(require("./messagingThread.model"));
const BROADCAST_ROLES = new Set(['super-admin', 'admin', 'school-board-admin']);
const getActorId = (actor) => {
    const id = actor.id || actor._id;
    return String(id);
};
const canBroadcast = (actor) => BROADCAST_ROLES.has(actor.role || '');
const canCreateLargeParticipantThread = (actor) => BROADCAST_ROLES.has(actor.role || '');
const buildThreadAccessFilter = (actor) => {
    const actorId = getActorId(actor);
    if (actor.accountType === 'internal') {
        return { $or: [{ participants: actorId }, { createdBy: actorId }, { isBroadcast: true }] };
    }
    if (actor.role === 'school-board-admin') {
        if (!actor.schoolBoardId) {
            throw new errors_1.ApiError(http_status_1.default.FORBIDDEN, 'School board context is missing for this user');
        }
        return {
            $or: [
                { participants: actorId },
                { createdBy: actorId },
                { isBroadcast: true, schoolBoard: actor.schoolBoardId },
            ],
        };
    }
    return { $or: [{ participants: actorId }, { createdBy: actorId }] };
};
const ensureThreadAccess = async (threadId, actor) => {
    const accessFilter = buildThreadAccessFilter(actor);
    const thread = await messagingThread_model_1.default.findOne(Object.assign({ _id: threadId }, accessFilter));
    if (!thread) {
        throw new errors_1.ApiError(http_status_1.default.NOT_FOUND, 'Message thread not found');
    }
    return thread;
};
const createThread = async (payload, actor) => {
    const actorId = getActorId(actor);
    const participantIds = [...new Set((payload.participantIds || []).filter(Boolean))].filter((id) => id !== actorId);
    const isBroadcast = Boolean(payload.isBroadcast);
    if (isBroadcast && !canBroadcast(actor)) {
        throw new errors_1.ApiError(http_status_1.default.FORBIDDEN, 'You do not have permission to send broadcast messages');
    }
    if (!isBroadcast && participantIds.length === 0) {
        throw new errors_1.ApiError(http_status_1.default.BAD_REQUEST, 'Select at least one participant for a direct message');
    }
    if (!isBroadcast && participantIds.length > 2 && !canCreateLargeParticipantThread(actor)) {
        throw new errors_1.ApiError(http_status_1.default.FORBIDDEN, 'You cannot add more than two users to a message');
    }
    const thread = await messagingThread_model_1.default.create({
        title: payload.title || null,
        createdBy: actorId,
        participants: participantIds,
        isBroadcast,
        schoolBoard: isBroadcast ? actor.schoolBoardId || null : null,
    });
    return thread;
};
exports.createThread = createThread;
const queryThreads = async (actor, options) => {
    const accessFilter = buildThreadAccessFilter(actor);
    return messagingThread_model_1.default.paginate(accessFilter, Object.assign(Object.assign({}, options), { sortBy: options.sortBy || 'createdAt:desc' }));
};
exports.queryThreads = queryThreads;
const queryThreadMessages = async (threadId, actor, options) => {
    await ensureThreadAccess(threadId, actor);
    return message_model_1.default.paginate({ thread: threadId }, Object.assign(Object.assign({}, options), { sortBy: options.sortBy || 'createdAt:asc' }));
};
exports.queryThreadMessages = queryThreadMessages;
const sendMessage = async (threadId, content, actor) => {
    const actorId = getActorId(actor);
    const thread = await ensureThreadAccess(threadId, actor);
    if (thread.isBroadcast && !canBroadcast(actor)) {
        throw new errors_1.ApiError(http_status_1.default.FORBIDDEN, 'You do not have permission to send broadcast messages');
    }
    return message_model_1.default.create({
        thread: thread.id,
        sender: actorId,
        content: content.trim(),
    });
};
exports.sendMessage = sendMessage;
//# sourceMappingURL=messaging.service.js.map