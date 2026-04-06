import httpStatus from 'http-status';
import { ApiError } from '../errors';
import { IUserDoc } from '../users/user.interfaces';
import MessageModel from './message.model';
import MessageThread from './messagingThread.model';

const BROADCAST_ROLES = new Set(['super-admin', 'admin', 'school-board-admin']);

const getActorId = (actor: IUserDoc) => {
  const id = (actor as any).id || (actor as any)._id;
  return String(id);
};

const canBroadcast = (actor: IUserDoc) => BROADCAST_ROLES.has(actor.role || '');

const canCreateLargeParticipantThread = (actor: IUserDoc) => BROADCAST_ROLES.has(actor.role || '');

const buildThreadAccessFilter = (actor: IUserDoc) => {
  const actorId = getActorId(actor);

  if (actor.accountType === 'internal') {
    return { $or: [{ participants: actorId }, { createdBy: actorId }, { isBroadcast: true }] };
  }

  if (actor.role === 'school-board-admin') {
    if (!actor.schoolBoardId) {
      throw new ApiError(httpStatus.FORBIDDEN, 'School board context is missing for this user');
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

const ensureThreadAccess = async (threadId: string, actor: IUserDoc) => {
  const accessFilter = buildThreadAccessFilter(actor);
  const thread = await MessageThread.findOne({ _id: threadId, ...accessFilter });

  if (!thread) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Message thread not found');
  }

  return thread;
};

export const createThread = async (
  payload: { title?: string | null; participantIds?: string[]; isBroadcast?: boolean },
  actor: IUserDoc
) => {
  const actorId = getActorId(actor);
  const participantIds = [...new Set((payload.participantIds || []).filter(Boolean))].filter(
    (id) => id !== actorId
  );
  const isBroadcast = Boolean(payload.isBroadcast);

  if (isBroadcast && !canBroadcast(actor)) {
    throw new ApiError(httpStatus.FORBIDDEN, 'You do not have permission to send broadcast messages');
  }

  if (!isBroadcast && participantIds.length === 0) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Select at least one participant for a direct message');
  }

  if (!isBroadcast && participantIds.length > 2 && !canCreateLargeParticipantThread(actor)) {
    throw new ApiError(httpStatus.FORBIDDEN, 'You cannot add more than two users to a message');
  }

  const thread = await MessageThread.create({
    title: payload.title || null,
    createdBy: actorId,
    participants: participantIds,
    isBroadcast,
    schoolBoard: isBroadcast ? actor.schoolBoardId || null : null,
  });

  return thread;
};

export const queryThreads = async (actor: IUserDoc, options: any) => {
  const accessFilter = buildThreadAccessFilter(actor);
  return MessageThread.paginate(accessFilter, { ...options, sortBy: options.sortBy || 'createdAt:desc' });
};

export const queryThreadMessages = async (threadId: string, actor: IUserDoc, options: any) => {
  await ensureThreadAccess(threadId, actor);
  return MessageModel.paginate(
    { thread: threadId },
    { ...options, sortBy: options.sortBy || 'createdAt:asc' }
  );
};

export const sendMessage = async (
  threadId: string,
  content: string,
  attachments: Array<{ name: string; url: string; type?: string; size?: number }> | undefined,
  actor: IUserDoc
) => {
  const actorId = getActorId(actor);
  const thread = await ensureThreadAccess(threadId, actor);

  if (thread.isBroadcast && !canBroadcast(actor)) {
    throw new ApiError(httpStatus.FORBIDDEN, 'You do not have permission to send broadcast messages');
  }

  return MessageModel.create({
    thread: thread.id,
    sender: actorId,
    content: content.trim(),
    attachments: (attachments || []).map((item) => ({
      name: item.name,
      url: item.url,
      type: item.type || undefined,
      size: item.size,
    })),
  });
};
