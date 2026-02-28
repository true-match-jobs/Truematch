import { create } from 'zustand';
import type { User } from '../types/user';
import { api } from '../services/api';
import { chatService } from '../services/chat.service';

type PrivateMessagePayload = {
  type: 'private_message';
  id: string;
  fromUserId: string;
  toUserId: string;
  content: string;
  createdAt: string;
};

const isPrivateMessagePayload = (value: unknown): value is PrivateMessagePayload => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const maybePayload = value as Partial<PrivateMessagePayload>;

  return (
    maybePayload.type === 'private_message' &&
    typeof maybePayload.fromUserId === 'string' &&
    typeof maybePayload.toUserId === 'string' &&
    typeof maybePayload.content === 'string' &&
    typeof maybePayload.createdAt === 'string' &&
    typeof maybePayload.id === 'string'
  );
};

type ChatContext = {
  isOnChatTab: boolean;
  activePeerUserId: string | null;
};

type ChatNotificationState = {
  unreadUserMessageCount: number;
  unreadAdminUserIds: string[];
  context: ChatContext;
  connect: (user: User) => void;
  disconnect: () => void;
  setContext: (context: ChatContext) => void;
  clearUserUnread: () => void;
  clearAdminUnreadForUser: (userId: string) => void;
  hydrateUnreadSummary: () => Promise<void>;
  reset: () => void;
};

let socket: WebSocket | null = null;
let connectedUserId: string | null = null;
let connectedUserRole: User['role'] | null = null;
let connectionConsumers = 0;
let reconnectTimeoutId: number | null = null;
let isReconnecting = false;

const clearReconnectTimeout = () => {
  if (reconnectTimeoutId !== null) {
    window.clearTimeout(reconnectTimeoutId);
    reconnectTimeoutId = null;
  }
};

const closeSocket = () => {
  clearReconnectTimeout();

  if (socket) {
    socket.close();
    socket = null;
  }

  connectedUserId = null;
  connectedUserRole = null;
};

const toUniqueIds = (ids: string[]): string[] => Array.from(new Set(ids));

const buildAdminPlaceholderIds = (count: number): string[] =>
  Array.from({ length: count }, (_, index) => `__unread_${index}`);

const setupSocket = (set: (partial: Partial<ChatNotificationState> | ((state: ChatNotificationState) => Partial<ChatNotificationState>)) => void) => {
  if (!connectedUserId || !connectedUserRole) {
    return;
  }

  socket = chatService.createSocket();

  socket.onmessage = (event) => {
    try {
      const payload = JSON.parse(event.data as string) as unknown;

      if (!isPrivateMessagePayload(payload)) {
        return;
      }

      const activeUserId = connectedUserId;
      const activeUserRole = connectedUserRole;

      if (!activeUserId || !activeUserRole) {
        return;
      }

      if (payload.fromUserId === activeUserId) {
        return;
      }

      if (activeUserRole === 'USER') {
        set((state) => ({
          unreadUserMessageCount: state.unreadUserMessageCount + 1
        }));
        return;
      }

      const senderUserId = payload.fromUserId;

      set((state) => ({
        unreadAdminUserIds: toUniqueIds([...state.unreadAdminUserIds.filter((id) => !id.startsWith('__unread_')), senderUserId])
      }));
    } catch (_error) {
      return;
    }
  };

  socket.onclose = () => {
    socket = null;

    if (connectionConsumers <= 0) {
      return;
    }

    if (isReconnecting) {
      return;
    }

    isReconnecting = true;
    clearReconnectTimeout();
    reconnectTimeoutId = window.setTimeout(async () => {
      try {
        await api.post('/auth/refresh');
      } catch (_error) {
        return;
      } finally {
        isReconnecting = false;
      }

      if (connectionConsumers > 0 && connectedUserId && connectedUserRole && !socket) {
        setupSocket(set);
      }
    }, 1200);
  };

  socket.onerror = () => {
    return;
  };
};

export const useChatNotificationStore = create<ChatNotificationState>((set, get) => ({
  unreadUserMessageCount: 0,
  unreadAdminUserIds: [],
  context: {
    isOnChatTab: false,
    activePeerUserId: null
  },

  connect: (user) => {
    const alreadyConnected =
      socket &&
      socket.readyState !== WebSocket.CLOSED &&
      connectedUserId === user.id &&
      connectedUserRole === user.role;

    connectionConsumers += 1;

    if (alreadyConnected) {
      return;
    }

    closeSocket();

    connectedUserId = user.id;
    connectedUserRole = user.role;
    setupSocket(set);
    void get().hydrateUnreadSummary();
  },

  disconnect: () => {
    connectionConsumers = Math.max(0, connectionConsumers - 1);

    if (connectionConsumers === 0) {
      closeSocket();
    }
  },

  setContext: (context) => {
    set({ context });
  },

  clearUserUnread: () => {
    set({ unreadUserMessageCount: 0 });
  },

  clearAdminUnreadForUser: (userId) => {
    set((state) => ({
      unreadAdminUserIds: state.unreadAdminUserIds.filter((currentUserId) => currentUserId !== userId)
    }));
  },

  hydrateUnreadSummary: async () => {
    if (!connectedUserRole) {
      return;
    }

    try {
      const summary = await chatService.getUnreadSummary();

      if (connectedUserRole === 'USER') {
        set({ unreadUserMessageCount: summary.userUnreadMessageCount });
        return;
      }

      set({ unreadAdminUserIds: buildAdminPlaceholderIds(summary.adminUnreadUserCount) });
    } catch (_error) {
      return;
    }
  },

  reset: () => {
    connectionConsumers = 0;
    closeSocket();
    set({
      unreadUserMessageCount: 0,
      unreadAdminUserIds: [],
      context: {
        isOnChatTab: false,
        activePeerUserId: null
      }
    });
  }
}));
