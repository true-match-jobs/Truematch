import { create } from 'zustand';
import type { User } from '../types/user';
import { api } from '../services/api';
import { chatService } from '../services/chat.service';
import {
  applyRealtimeMessageToConversationList,
  clearAdminConversationUnreadCount,
  setUserConversationUnreadCount
} from './conversation-cache.store';

type PrivateMessagePayload = {
  type: 'private_message';
  id: string;
  fromUserId: string;
  toUserId: string;
  content: string;
  createdAt: string;
};

type PresenceStatus = {
  userId: string;
  isOnline: boolean;
};

type PresenceUpdatePayload = {
  type: 'presence_update';
  userId: string;
  isOnline: boolean;
};

type PresenceSnapshotPayload = {
  type: 'presence_snapshot';
  statuses: PresenceStatus[];
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

const isPresenceUpdatePayload = (value: unknown): value is PresenceUpdatePayload => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const maybePayload = value as Partial<PresenceUpdatePayload>;

  return (
    maybePayload.type === 'presence_update' &&
    typeof maybePayload.userId === 'string' &&
    typeof maybePayload.isOnline === 'boolean'
  );
};

const isPresenceSnapshotPayload = (value: unknown): value is PresenceSnapshotPayload => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const maybePayload = value as Partial<PresenceSnapshotPayload>;

  if (maybePayload.type !== 'presence_snapshot' || !Array.isArray(maybePayload.statuses)) {
    return false;
  }

  return maybePayload.statuses.every((status) => {
    if (!status || typeof status !== 'object') {
      return false;
    }

    const maybeStatus = status as Partial<PresenceStatus>;
    return typeof maybeStatus.userId === 'string' && typeof maybeStatus.isOnline === 'boolean';
  });
};

type ChatContext = {
  isOnChatTab: boolean;
  activePeerUserId: string | null;
};

type ChatNotificationState = {
  unreadUserMessageCount: number;
  unreadAdminUserIds: string[];
  presenceByUserId: Record<string, boolean>;
  context: ChatContext;
  connect: (user: User) => void;
  disconnect: () => void;
  subscribeToPresence: (userIds: string[]) => (() => void);
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
let desiredPresenceUserIds = new Set<string>();
let presenceSubscriptionsByKey = new Map<string, Set<string>>();
let presenceSubscriptionCounter = 0;

const buildPresenceSubscriptionKey = (): string => {
  presenceSubscriptionCounter += 1;
  return `presence_${presenceSubscriptionCounter}`;
};

const recomputeDesiredPresenceUserIds = (): void => {
  const nextDesiredIds = new Set<string>();

  presenceSubscriptionsByKey.forEach((subscriptionIds) => {
    subscriptionIds.forEach((userId) => {
      nextDesiredIds.add(userId);
    });
  });

  desiredPresenceUserIds = nextDesiredIds;
};

const getDesiredPresenceUserIds = (): string[] => Array.from(desiredPresenceUserIds);

const sendPresenceSubscription = () => {
  if (!socket || socket.readyState !== WebSocket.OPEN) {
    return;
  }

  socket.send(
    JSON.stringify({
      type: 'presence_subscribe',
      userIds: getDesiredPresenceUserIds()
    })
  );
};

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

const setupSocket = async (
  set: (partial: Partial<ChatNotificationState> | ((state: ChatNotificationState) => Partial<ChatNotificationState>)) => void,
  get: () => ChatNotificationState
) => {
  if (!connectedUserId || !connectedUserRole) {
    return;
  }

  const expectedUserId = connectedUserId;
  const expectedUserRole = connectedUserRole;

  let nextSocket: WebSocket;
  try {
    nextSocket = await chatService.createSocket();
  } catch (_error) {
    return;
  }

  if (
    connectionConsumers <= 0 ||
    !connectedUserId ||
    !connectedUserRole ||
    connectedUserId !== expectedUserId ||
    connectedUserRole !== expectedUserRole
  ) {
    nextSocket.close();
    return;
  }

  socket = nextSocket;

  socket.onopen = () => {
    sendPresenceSubscription();
  };

  socket.onmessage = (event) => {
    try {
      const payload = JSON.parse(event.data as string) as unknown;

      if (isPresenceSnapshotPayload(payload)) {
        set((state) => {
          const nextPresenceByUserId = { ...state.presenceByUserId };

          payload.statuses.forEach((status) => {
            nextPresenceByUserId[status.userId] = status.isOnline;
          });

          return {
            presenceByUserId: nextPresenceByUserId
          };
        });
        return;
      }

      if (isPresenceUpdatePayload(payload)) {
        set((state) => ({
          presenceByUserId: {
            ...state.presenceByUserId,
            [payload.userId]: payload.isOnline
          }
        }));
        return;
      }

      if (!isPrivateMessagePayload(payload)) {
        return;
      }

      const activeUserId = connectedUserId;
      const activeUserRole = connectedUserRole;
      const context = get().context;

      if (!activeUserId || !activeUserRole) {
        return;
      }

      const isIncomingMessage = payload.fromUserId !== activeUserId;
      const isActiveUserConversationOpen =
        context.isOnChatTab &&
        Boolean(context.activePeerUserId) &&
        (context.activePeerUserId === payload.fromUserId || context.activePeerUserId === payload.toUserId);

      applyRealtimeMessageToConversationList({
        audience: activeUserRole,
        activeUserId,
        fromUserId: payload.fromUserId,
        toUserId: payload.toUserId,
        content: payload.content,
        createdAt: payload.createdAt,
        shouldIncrementUnread: isIncomingMessage && !(activeUserRole === 'USER' && isActiveUserConversationOpen)
      });

      if (payload.fromUserId === activeUserId) {
        return;
      }

      if (activeUserRole === 'USER') {
        if (context.isOnChatTab && context.activePeerUserId === payload.fromUserId) {
          return;
        }
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

    set((state) => {
      const nextPresenceByUserId = { ...state.presenceByUserId };

      getDesiredPresenceUserIds().forEach((userId) => {
        nextPresenceByUserId[userId] = false;
      });

      return {
        presenceByUserId: nextPresenceByUserId
      };
    });

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
        void setupSocket(set, get);
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
  presenceByUserId: {},
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
      void get().hydrateUnreadSummary();
      return;
    }

    closeSocket();

    connectedUserId = user.id;
    connectedUserRole = user.role;
    void setupSocket(set, get);
    void get().hydrateUnreadSummary();
  },

  disconnect: () => {
    connectionConsumers = Math.max(0, connectionConsumers - 1);

    if (connectionConsumers === 0) {
      closeSocket();
    }
  },

  subscribeToPresence: (userIds) => {
    const subscriptionKey = buildPresenceSubscriptionKey();
    const normalizedIds = new Set(
      userIds
        .filter((value) => typeof value === 'string')
        .map((value) => value.trim())
        .filter((value) => value.length > 0)
    );

    presenceSubscriptionsByKey.set(subscriptionKey, normalizedIds);
    recomputeDesiredPresenceUserIds();

    set((state) => {
      const nextPresenceByUserId = { ...state.presenceByUserId };

      getDesiredPresenceUserIds().forEach((userId) => {
        if (typeof nextPresenceByUserId[userId] !== 'boolean') {
          nextPresenceByUserId[userId] = false;
        }
      });

      return {
        presenceByUserId: nextPresenceByUserId
      };
    });

    sendPresenceSubscription();

    return () => {
      presenceSubscriptionsByKey.delete(subscriptionKey);
      recomputeDesiredPresenceUserIds();

      set((state) => {
        const nextPresenceByUserId = { ...state.presenceByUserId };

        getDesiredPresenceUserIds().forEach((userId) => {
          if (typeof nextPresenceByUserId[userId] !== 'boolean') {
            nextPresenceByUserId[userId] = false;
          }
        });

        return {
          presenceByUserId: nextPresenceByUserId
        };
      });

      sendPresenceSubscription();
    };
  },

  setContext: (context) => {
    set({ context });
  },

  clearUserUnread: () => {
    set({ unreadUserMessageCount: 0 });
    setUserConversationUnreadCount(0);
  },

  clearAdminUnreadForUser: (userId) => {
    set((state) => ({
      unreadAdminUserIds: state.unreadAdminUserIds.filter((currentUserId) => currentUserId !== userId)
    }));
    clearAdminConversationUnreadCount(userId);
  },

  hydrateUnreadSummary: async () => {
    if (!connectedUserRole) {
      return;
    }

    try {
      const summary = await chatService.getUnreadSummary();

      if (connectedUserRole === 'USER') {
        set({ unreadUserMessageCount: summary.userUnreadMessageCount });
        setUserConversationUnreadCount(summary.userUnreadMessageCount);
        return;
      }

      set({ unreadAdminUserIds: buildAdminPlaceholderIds(summary.adminUnreadUserCount) });
    } catch (_error) {
      return;
    }
  },

  reset: () => {
    connectionConsumers = 0;
    desiredPresenceUserIds = new Set<string>();
    presenceSubscriptionsByKey = new Map<string, Set<string>>();
    presenceSubscriptionCounter = 0;
    closeSocket();
    set({
      unreadUserMessageCount: 0,
      unreadAdminUserIds: [],
      presenceByUserId: {},
      context: {
        isOnChatTab: false,
        activePeerUserId: null
      }
    });
  }
}));
