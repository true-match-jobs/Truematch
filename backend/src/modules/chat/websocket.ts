import type { IncomingMessage } from 'http';
import { WebSocket, WebSocketServer } from 'ws';
import { verifyAccessToken } from '../../utils/jwt';
import { addConversationMessage } from './chat.service';

type WsInboundMessage = {
  type: 'private_message';
  toUserId: string;
  content: string;
} | {
  type: 'presence_subscribe';
  userIds: string[];
} | {
  type: 'typing';
  toUserId: string;
  isTyping: boolean;
};

type WsOutboundMessage = {
  type: 'private_message';
  id: string;
  fromUserId: string;
  toUserId: string;
  content: string;
  createdAt: string;
} | {
  type: 'presence_update';
  userId: string;
  isOnline: boolean;
} | {
  type: 'presence_snapshot';
  statuses: Array<{
    userId: string;
    isOnline: boolean;
  }>;
} | {
  type: 'typing';
  fromUserId: string;
  toUserId: string;
  isTyping: boolean;
};

const userConnections = new Map<string, Set<WebSocket>>();
const presenceSubscribersByTarget = new Map<string, Set<string>>();
const presenceTargetsBySubscriber = new Map<string, Set<string>>();

const parseCookieValue = (cookieHeader: string | undefined, key: string): string | null => {
  if (!cookieHeader) {
    return null;
  }

  const parts = cookieHeader.split(';').map((part) => part.trim());
  const matched = parts.find((part) => part.startsWith(`${key}=`));

  if (!matched) {
    return null;
  }

  return decodeURIComponent(matched.slice(key.length + 1));
};

const parseTokenFromRequest = (req: IncomingMessage): string | null => {
  const fromCookie = parseCookieValue(req.headers.cookie, 'accessToken');

  if (fromCookie) {
    return fromCookie;
  }

  const host = req.headers.host;
  if (!host || !req.url) {
    return null;
  }

  const url = new URL(req.url, `http://${host}`);
  return url.searchParams.get('token');
};

const addUserConnection = (userId: string, socket: WebSocket): void => {
  const existing = userConnections.get(userId);
  if (existing) {
    existing.add(socket);
    return;
  }

  userConnections.set(userId, new Set([socket]));
};

const removeUserConnection = (userId: string, socket: WebSocket): void => {
  const existing = userConnections.get(userId);

  if (!existing) {
    return;
  }

  existing.delete(socket);

  if (!existing.size) {
    userConnections.delete(userId);
  }
};

const isUserOnline = (userId: string): boolean => {
  return Boolean(userConnections.get(userId)?.size);
};

const removeAllPresenceSubscriptionsForSubscriber = (subscriberUserId: string): void => {
  const targets = presenceTargetsBySubscriber.get(subscriberUserId);

  if (!targets?.size) {
    return;
  }

  targets.forEach((targetUserId) => {
    const subscribers = presenceSubscribersByTarget.get(targetUserId);

    if (!subscribers) {
      return;
    }

    subscribers.delete(subscriberUserId);

    if (!subscribers.size) {
      presenceSubscribersByTarget.delete(targetUserId);
    }
  });

  presenceTargetsBySubscriber.delete(subscriberUserId);
};

const setPresenceSubscriptions = (subscriberUserId: string, userIds: string[]): void => {
  removeAllPresenceSubscriptionsForSubscriber(subscriberUserId);

  const uniqueTargetUserIds = Array.from(
    new Set(
      userIds
        .filter((value) => typeof value === 'string')
        .map((value) => value.trim())
        .filter((value) => value.length > 0 && value !== subscriberUserId)
        .slice(0, 100)
    )
  );

  if (!uniqueTargetUserIds.length) {
    return;
  }

  presenceTargetsBySubscriber.set(subscriberUserId, new Set(uniqueTargetUserIds));

  uniqueTargetUserIds.forEach((targetUserId) => {
    const subscribers = presenceSubscribersByTarget.get(targetUserId);

    if (subscribers) {
      subscribers.add(subscriberUserId);
      return;
    }

    presenceSubscribersByTarget.set(targetUserId, new Set([subscriberUserId]));
  });
};

const broadcastToUser = (userId: string, payload: WsOutboundMessage): void => {
  const sockets = userConnections.get(userId);

  if (!sockets?.size) {
    return;
  }

  const serialized = JSON.stringify(payload);

  sockets.forEach((socket) => {
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(serialized);
    }
  });
};

const sendPresenceSnapshot = (subscriberUserId: string): void => {
  const targets = presenceTargetsBySubscriber.get(subscriberUserId);

  if (!targets?.size) {
    return;
  }

  const statuses = Array.from(targets).map((targetUserId) => ({
    userId: targetUserId,
    isOnline: isUserOnline(targetUserId)
  }));

  broadcastToUser(subscriberUserId, {
    type: 'presence_snapshot',
    statuses
  });
};

const broadcastPresenceUpdate = (targetUserId: string, isOnline: boolean): void => {
  const subscribers = presenceSubscribersByTarget.get(targetUserId);

  if (!subscribers?.size) {
    return;
  }

  subscribers.forEach((subscriberUserId) => {
    broadcastToUser(subscriberUserId, {
      type: 'presence_update',
      userId: targetUserId,
      isOnline
    });
  });
};

export const setupWebSocketServer = (server: import('http').Server): WebSocketServer => {
  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (socket, req) => {
    try {
      const token = parseTokenFromRequest(req);
      if (!token) {
        socket.close(1008, 'Token missing');
        return;
      }

      const payload = verifyAccessToken(token);
      const wasOnline = isUserOnline(payload.userId);
      addUserConnection(payload.userId, socket);

      if (!wasOnline) {
        broadcastPresenceUpdate(payload.userId, true);
      }

      socket.on('message', async (rawData) => {
        try {
          const data = JSON.parse(rawData.toString()) as WsInboundMessage;

          if (data.type === 'presence_subscribe') {
            setPresenceSubscriptions(payload.userId, Array.isArray(data.userIds) ? data.userIds : []);
            sendPresenceSnapshot(payload.userId);
            return;
          }

          if (data.type === 'typing') {
            if (typeof data.toUserId !== 'string' || typeof data.isTyping !== 'boolean') {
              return;
            }

            const outboundTypingPayload: WsOutboundMessage = {
              type: 'typing',
              fromUserId: payload.userId,
              toUserId: data.toUserId,
              isTyping: data.isTyping
            };

            broadcastToUser(payload.userId, outboundTypingPayload);
            broadcastToUser(data.toUserId, outboundTypingPayload);
            return;
          }

          if (data.type !== 'private_message') {
            return;
          }

          const persistedMessage = await addConversationMessage(payload.userId, data.toUserId, data.content);

          const outboundMessage: WsOutboundMessage = {
            type: 'private_message',
            id: persistedMessage.id,
            fromUserId: persistedMessage.fromUserId,
            toUserId: persistedMessage.toUserId,
            content: persistedMessage.content,
            createdAt: persistedMessage.createdAt
          };

          broadcastToUser(payload.userId, outboundMessage);
          broadcastToUser(data.toUserId, outboundMessage);
        } catch (_error) {
          socket.send(JSON.stringify({ type: 'error', message: 'Invalid message payload' }));
        }
      });

      socket.on('close', () => {
        const wasOnline = isUserOnline(payload.userId);
        removeUserConnection(payload.userId, socket);

        const isStillOnline = isUserOnline(payload.userId);

        if (wasOnline && !isStillOnline) {
          removeAllPresenceSubscriptionsForSubscriber(payload.userId);
          broadcastPresenceUpdate(payload.userId, false);
        }
      });
    } catch (_error) {
      socket.close(1008, 'Unauthorized');
    }
  });

  return wss;
};
