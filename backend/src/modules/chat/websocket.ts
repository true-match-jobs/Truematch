import type { IncomingMessage } from 'http';
import { WebSocket, WebSocketServer } from 'ws';
import { verifyAccessToken } from '../../utils/jwt';
import { addConversationMessage } from './chat.service';

type WsInboundMessage = {
  type: 'private_message';
  toUserId: string;
  content: string;
};

type WsOutboundMessage = {
  type: 'private_message';
  id: string;
  fromUserId: string;
  toUserId: string;
  content: string;
  createdAt: string;
};

const userConnections = new Map<string, Set<WebSocket>>();

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
      addUserConnection(payload.userId, socket);

      socket.on('message', async (rawData) => {
        try {
          const data = JSON.parse(rawData.toString()) as WsInboundMessage;

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
        removeUserConnection(payload.userId, socket);
      });
    } catch (_error) {
      socket.close(1008, 'Unauthorized');
    }
  });

  return wss;
};
