import { decodeAttachmentMessageContent, type AdminConversation, type ChatRole } from '../services/chat.service';

type ConversationListAudience = Extract<ChatRole, 'USER' | 'ADMIN'>;

type ConversationCacheEntry = {
  conversations: AdminConversation[];
  cachedAt: number;
  isDirty: boolean;
};

type ConversationListListener = (conversations: AdminConversation[]) => void;

type SetConversationListOptions = {
  cachedAt?: number;
  isDirty?: boolean;
};

type ApplyRealtimeMessageParams = {
  audience: ConversationListAudience;
  activeUserId: string;
  fromUserId: string;
  toUserId: string;
  content: string;
  createdAt: string;
  shouldIncrementUnread: boolean;
};

const cacheByAudience: Record<ConversationListAudience, ConversationCacheEntry | null> = {
  USER: null,
  ADMIN: null
};

const listenersByAudience: Record<ConversationListAudience, Set<ConversationListListener>> = {
  USER: new Set<ConversationListListener>(),
  ADMIN: new Set<ConversationListListener>()
};

const cloneConversations = (conversations: AdminConversation[]): AdminConversation[] => {
  return conversations.map((conversation) => ({
    ...conversation,
    user: { ...conversation.user }
  }));
};

const isConversationListEqual = (left: AdminConversation[], right: AdminConversation[]): boolean => {
  if (left.length !== right.length) {
    return false;
  }

  for (let index = 0; index < left.length; index += 1) {
    const leftConversation = left[index];
    const rightConversation = right[index];

    if (
      leftConversation.user.id !== rightConversation.user.id ||
      leftConversation.lastMessageAt !== rightConversation.lastMessageAt ||
      leftConversation.lastMessagePreview !== rightConversation.lastMessagePreview ||
      leftConversation.lastMessageFromUserId !== rightConversation.lastMessageFromUserId ||
      leftConversation.unreadMessageCount !== rightConversation.unreadMessageCount
    ) {
      return false;
    }
  }

  return true;
};

const emit = (audience: ConversationListAudience) => {
  const snapshot = getConversationListSnapshot(audience);

  listenersByAudience[audience].forEach((listener) => {
    listener(snapshot);
  });
};

const normalizeLastMessagePreview = (content: string): string => {
  const decodedAttachment = decodeAttachmentMessageContent(content);

  if (!decodedAttachment) {
    return content;
  }

  return decodedAttachment.text?.trim() || 'Sent an attachment';
};

export const getConversationListSnapshot = (audience: ConversationListAudience): AdminConversation[] => {
  return cloneConversations(cacheByAudience[audience]?.conversations ?? []);
};

export const getConversationListCachedAt = (audience: ConversationListAudience): number | null => {
  return cacheByAudience[audience]?.cachedAt ?? null;
};

export const setConversationListSnapshot = (
  audience: ConversationListAudience,
  conversations: AdminConversation[],
  options: SetConversationListOptions = {}
): void => {
  const previous = cacheByAudience[audience];

  cacheByAudience[audience] = {
    conversations: cloneConversations(conversations),
    cachedAt: options.cachedAt ?? Date.now(),
    isDirty: options.isDirty ?? false
  };

  const hasChanged =
    !previous ||
    previous.cachedAt !== cacheByAudience[audience]?.cachedAt ||
    previous.isDirty !== cacheByAudience[audience]?.isDirty ||
    !isConversationListEqual(previous.conversations, conversations);

  if (hasChanged) {
    emit(audience);
  }
};

export const markConversationListDirty = (audience: ConversationListAudience): void => {
  const existingEntry = cacheByAudience[audience];

  if (!existingEntry || existingEntry.isDirty) {
    return;
  }

  cacheByAudience[audience] = {
    ...existingEntry,
    isDirty: true
  };
};

export const shouldRefetchConversationList = (audience: ConversationListAudience, maxAgeMs: number): boolean => {
  const entry = cacheByAudience[audience];

  if (!entry) {
    return true;
  }

  if (entry.isDirty) {
    return true;
  }

  return Date.now() - entry.cachedAt > maxAgeMs;
};

export const subscribeToConversationList = (
  audience: ConversationListAudience,
  listener: ConversationListListener
): (() => void) => {
  listenersByAudience[audience].add(listener);

  return () => {
    listenersByAudience[audience].delete(listener);
  };
};

export const setUserConversationUnreadCount = (unreadCount: number): void => {
  const entry = cacheByAudience.USER;

  if (!entry || !entry.conversations.length) {
    return;
  }

  const currentConversation = entry.conversations[0];

  if (currentConversation.unreadMessageCount === unreadCount) {
    return;
  }

  const nextConversations = [
    {
      ...currentConversation,
      unreadMessageCount: unreadCount
    },
    ...entry.conversations.slice(1)
  ];

  setConversationListSnapshot('USER', nextConversations, {
    cachedAt: entry.cachedAt,
    isDirty: entry.isDirty
  });
};

export const clearAdminConversationUnreadCount = (userId: string): void => {
  const entry = cacheByAudience.ADMIN;

  if (!entry) {
    return;
  }

  let hasChanged = false;

  const nextConversations = entry.conversations.map((conversation) => {
    if (conversation.user.id !== userId || conversation.unreadMessageCount === 0) {
      return conversation;
    }

    hasChanged = true;

    return {
      ...conversation,
      unreadMessageCount: 0
    };
  });

  if (!hasChanged) {
    return;
  }

  setConversationListSnapshot('ADMIN', nextConversations, {
    cachedAt: entry.cachedAt,
    isDirty: entry.isDirty
  });
};

export const applyRealtimeMessageToConversationList = ({
  audience,
  activeUserId,
  fromUserId,
  toUserId,
  content,
  createdAt,
  shouldIncrementUnread
}: ApplyRealtimeMessageParams): void => {
  const entry = cacheByAudience[audience];

  if (!entry || !entry.conversations.length) {
    markConversationListDirty(audience);
    return;
  }

  const previewText = normalizeLastMessagePreview(content);

  if (audience === 'USER') {
    const currentConversation = entry.conversations[0];

    if (!currentConversation) {
      markConversationListDirty('USER');
      return;
    }

    const participants = [fromUserId, toUserId];

    if (!participants.includes(activeUserId) || !participants.includes(currentConversation.user.id)) {
      return;
    }

    const nextConversations = [
      {
        ...currentConversation,
        lastMessageAt: createdAt,
        lastMessagePreview: previewText,
        lastMessageFromUserId: fromUserId,
        unreadMessageCount:
          shouldIncrementUnread && fromUserId === currentConversation.user.id
            ? currentConversation.unreadMessageCount + 1
            : currentConversation.unreadMessageCount
      },
      ...entry.conversations.slice(1)
    ];

    setConversationListSnapshot('USER', nextConversations, {
      cachedAt: Date.now(),
      isDirty: false
    });

    return;
  }

  const peerUserId = fromUserId === activeUserId ? toUserId : fromUserId;
  const existingConversationIndex = entry.conversations.findIndex((conversation) => conversation.user.id === peerUserId);

  if (existingConversationIndex === -1) {
    markConversationListDirty('ADMIN');
    return;
  }

  const existingConversation = entry.conversations[existingConversationIndex];

  const updatedConversation: AdminConversation = {
    ...existingConversation,
    lastMessageAt: createdAt,
    lastMessagePreview: previewText,
    lastMessageFromUserId: fromUserId,
    unreadMessageCount:
      shouldIncrementUnread && fromUserId === peerUserId
        ? existingConversation.unreadMessageCount + 1
        : existingConversation.unreadMessageCount
  };

  const nextConversations = [
    updatedConversation,
    ...entry.conversations.filter((conversation) => conversation.user.id !== peerUserId)
  ];

  setConversationListSnapshot('ADMIN', nextConversations, {
    cachedAt: Date.now(),
    isDirty: false
  });
};
