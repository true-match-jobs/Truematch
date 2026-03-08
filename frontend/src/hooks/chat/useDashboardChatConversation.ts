import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../useAuth';
import {
  chatService,
  encodeAttachmentMessageContent,
  type ChatAttachment,
  type ChatMessage,
  type ChatUser
} from '../../services/chat.service';
import { useChatNotificationStore } from '../../store/chat-notification.store';
import { buildInitialAvatarUrl } from '../../utils/avatar';
import { useChatRealtimeSession } from './useChatRealtimeSession';
import type { ChatUiMessage, PendingComposerAttachment } from './chat-types';

const CHAT_PAGE_CACHE_TTL_MS = 45_000;
const PERSISTED_CHAT_CACHE_KEY = 'tm_chat_cache_v1';
const PERSISTED_CHAT_CACHE_MAX_CONVERSATIONS = 24;
const PERSISTED_CHAT_CACHE_MAX_MESSAGES_PER_CONVERSATION = 80;

type ConversationCacheEntry = {
  peer: ChatUser;
  messages: ChatUiMessage[];
  cachedAt: number;
};

type PersistedConversationCacheEntry = {
  peer: ChatUser;
  messages: ChatMessage[];
  cachedAt: number;
};

type PersistedChatCache = Record<string, PersistedConversationCacheEntry>;

const conversationCache = new Map<string, ConversationCacheEntry>();

const toSentMessage = (message: ChatMessage): ChatUiMessage => ({
  ...message,
  deliveryStatus: 'sent'
});

const buildClientMessageId = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

const preloadImage = (src: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve();
    image.onerror = () => reject(new Error('Image preload failed'));
    image.src = src;
  });
};

const readPersistedChatCache = (): PersistedChatCache => {
  if (typeof window === 'undefined') {
    return {};
  }

  try {
    const raw = window.localStorage.getItem(PERSISTED_CHAT_CACHE_KEY);

    if (!raw) {
      return {};
    }

    const parsed = JSON.parse(raw) as unknown;

    if (!parsed || typeof parsed !== 'object') {
      return {};
    }

    return parsed as PersistedChatCache;
  } catch {
    return {};
  }
};

const writePersistedChatCache = (cache: PersistedChatCache): void => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(PERSISTED_CHAT_CACHE_KEY, JSON.stringify(cache));
  } catch {
  }
};

const getPersistedConversation = (conversationCacheKey: string): ConversationCacheEntry | null => {
  const persistedCache = readPersistedChatCache();
  const persistedEntry = persistedCache[conversationCacheKey];

  if (!persistedEntry) {
    return null;
  }

  return {
    peer: persistedEntry.peer,
    messages: persistedEntry.messages.map(toSentMessage),
    cachedAt: persistedEntry.cachedAt
  };
};

const persistConversation = (conversationCacheKey: string, entry: ConversationCacheEntry): void => {
  const persistedCache = readPersistedChatCache();

  // Keep only stable server messages in persistent storage.
  const persistedMessages = entry.messages
    .filter((message) => message.deliveryStatus !== 'pending' && !message.localAttachment)
    .slice(-PERSISTED_CHAT_CACHE_MAX_MESSAGES_PER_CONVERSATION)
    .map((message) => ({
      id: message.id,
      fromUserId: message.fromUserId,
      toUserId: message.toUserId,
      content: message.content,
      isRead: message.isRead,
      createdAt: message.createdAt
    }));

  persistedCache[conversationCacheKey] = {
    peer: entry.peer,
    messages: persistedMessages,
    cachedAt: entry.cachedAt
  };

  const sortedEntries = Object.entries(persistedCache).sort(([, left], [, right]) => right.cachedAt - left.cachedAt);

  const trimmedCache: PersistedChatCache = {};

  sortedEntries.slice(0, PERSISTED_CHAT_CACHE_MAX_CONVERSATIONS).forEach(([key, value]) => {
    trimmedCache[key] = value;
  });

  writePersistedChatCache(trimmedCache);
};

const getPreferredCachedConversation = (conversationCacheKey: string): ConversationCacheEntry | null => {
  const inMemoryConversation = conversationCache.get(conversationCacheKey) ?? null;
  const persistedConversation = getPersistedConversation(conversationCacheKey);

  const preferredCachedConversation = [inMemoryConversation, persistedConversation]
    .filter((value): value is ConversationCacheEntry => Boolean(value))
    .sort((left, right) => right.cachedAt - left.cachedAt)[0] ?? null;

  return preferredCachedConversation;
};

export const useDashboardChatConversation = () => {
  const { user } = useAuth();
  const { conversationId } = useParams<{ conversationId: string }>();

  const requestedPeerUserId = useMemo(() => {
    if (user?.role === 'ADMIN') {
      return conversationId;
    }

    if (user?.role === 'USER') {
      return conversationId;
    }

    return undefined;
  }, [conversationId, user?.role]);

  const conversationCacheKey = useMemo(
    () => {
      const peerKey = requestedPeerUserId && requestedPeerUserId.trim().length > 0 ? requestedPeerUserId : '__assigned_admin__';
      const userKey = user?.id ?? '__anonymous__';

      return `${userKey}:${peerKey}`;
    },
    [requestedPeerUserId, user?.id]
  );

  const initialCachedConversation = useMemo(
    () => getPreferredCachedConversation(conversationCacheKey),
    [conversationCacheKey]
  );

  const [draft, setDraft] = useState('');
  const [peer, setPeer] = useState<ChatUser | null>(() => initialCachedConversation?.peer ?? null);
  const [messages, setMessages] = useState<ChatUiMessage[]>(() => initialCachedConversation?.messages ?? []);
  const [pendingAttachment, setPendingAttachment] = useState<PendingComposerAttachment | null>(null);
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);
  const [isLoadingConversation, setIsLoadingConversation] = useState(() => !initialCachedConversation);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [downloadingMessageId, setDownloadingMessageId] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<{ url: string; name: string } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const trackedLocalUrlsRef = useRef<Set<string>>(new Set());
  const clearUserUnread = useChatNotificationStore((state) => state.clearUserUnread);
  const clearAdminUnreadForUser = useChatNotificationStore((state) => state.clearAdminUnreadForUser);
  const setNotificationContext = useChatNotificationStore((state) => state.setContext);
  const presenceByUserId = useChatNotificationStore((state) => state.presenceByUserId);
  const subscribeToPresence = useChatNotificationStore((state) => state.subscribeToPresence);

  const isPeerOnline = peer?.id ? Boolean(presenceByUserId[peer.id]) : false;
  const generatedPeerAvatarUrl = buildInitialAvatarUrl({
    fullName: peer?.fullName,
    email: peer?.email,
    id: peer?.id,
    fallback: 'Chat',
    size: 44
  });

  const peerAvatarUrl = peer?.role === 'ADMIN' && peer.profilePhotoUrl ? peer.profilePhotoUrl : generatedPeerAvatarUrl;

  const { isSocketReady, isPeerTyping, stopTyping, sendPrivateMessage } = useChatRealtimeSession({
    userId: user?.id,
    peer,
    draft,
    setMessages
  });

  useEffect(() => {
    const cachedConversation = getPreferredCachedConversation(conversationCacheKey);

    if (cachedConversation) {
      setPeer(cachedConversation.peer);
      setMessages(cachedConversation.messages);
      setIsLoadingConversation(false);
      setErrorMessage(null);
      return;
    }

    setPeer(null);
    setMessages([]);
    setIsLoadingConversation(true);
    setErrorMessage(null);
  }, [conversationCacheKey]);

  useEffect(() => {
    let isCancelled = false;

    const applyResolvedConversation = async (resolvedPeer: ChatUser) => {
      const history = await chatService.getMessages(resolvedPeer.id);
      await chatService.markConversationRead(resolvedPeer.id);

      if (isCancelled) {
        return;
      }

      const normalizedHistory = history.map(toSentMessage);
      const nextEntry: ConversationCacheEntry = {
        peer: resolvedPeer,
        messages: normalizedHistory,
        cachedAt: Date.now()
      };

      setPeer(resolvedPeer);
      setMessages(normalizedHistory);
      conversationCache.set(conversationCacheKey, nextEntry);
      persistConversation(conversationCacheKey, nextEntry);

      if (user?.role === 'ADMIN') {
        clearAdminUnreadForUser(resolvedPeer.id);
      } else {
        clearUserUnread();
      }
    };

    const loadConversation = async () => {
      if (!user) {
        return;
      }

      const preferredCachedConversation = getPreferredCachedConversation(conversationCacheKey);

      const isCacheFresh =
        Boolean(preferredCachedConversation) &&
        Date.now() - (preferredCachedConversation?.cachedAt ?? 0) < CHAT_PAGE_CACHE_TTL_MS;

      if (preferredCachedConversation) {
        setPeer(preferredCachedConversation.peer);
        setMessages(preferredCachedConversation.messages);
        setIsLoadingConversation(false);
        setErrorMessage(null);

        void chatService.markConversationRead(preferredCachedConversation.peer.id);

        if (user.role === 'ADMIN') {
          clearAdminUnreadForUser(preferredCachedConversation.peer.id);
        } else {
          clearUserUnread();
        }

        if (navigator.onLine) {
          // SWR: keep UI instant from cache, then refresh quietly for latest messages.
          try {
            await applyResolvedConversation(preferredCachedConversation.peer);
          } catch (_error) {
            return;
          }
        }

        return;
      }

      setIsLoadingConversation(true);
      setErrorMessage(null);

      try {
        const resolvedPeer = await chatService.getPeer(requestedPeerUserId);
        await applyResolvedConversation(resolvedPeer);
      } catch (_error) {
        if (isCancelled) {
          return;
        }

        setPeer(null);
        setMessages([]);
        setErrorMessage('Unable to open this conversation right now.');
      } finally {
        if (!isCancelled) {
          setIsLoadingConversation(false);
        }
      }
    };

    void loadConversation();

    return () => {
      isCancelled = true;
    };
  }, [clearAdminUnreadForUser, clearUserUnread, conversationCacheKey, requestedPeerUserId, user]);

  useEffect(() => {
    const activePeerUserId = peer?.id ?? null;

    if (!activePeerUserId) {
      return;
    }

    setNotificationContext({
      isOnChatTab: true,
      activePeerUserId
    });

    return () => {
      setNotificationContext({
        isOnChatTab: false,
        activePeerUserId: null
      });
    };
  }, [peer?.id, setNotificationContext]);

  useEffect(() => {
    if (!peer) {
      return;
    }

    conversationCache.set(conversationCacheKey, {
      peer,
      messages,
      cachedAt: Date.now()
    });

    persistConversation(conversationCacheKey, {
      peer,
      messages,
      cachedAt: Date.now()
    });
  }, [conversationCacheKey, messages, peer]);

  useEffect(() => {
    const peerUserId = peer?.id;

    return subscribeToPresence(peerUserId ? [peerUserId] : []);
  }, [peer?.id, subscribeToPresence]);

  useEffect(() => {
    const nextTrackedUrls = new Set<string>();

    if (pendingAttachment?.localUrl) {
      nextTrackedUrls.add(pendingAttachment.localUrl);
    }

    messages.forEach((message) => {
      if (message.localAttachment?.localUrl) {
        nextTrackedUrls.add(message.localAttachment.localUrl);
      }
    });

    trackedLocalUrlsRef.current.forEach((trackedUrl) => {
      if (!nextTrackedUrls.has(trackedUrl)) {
        URL.revokeObjectURL(trackedUrl);
      }
    });

    trackedLocalUrlsRef.current = nextTrackedUrls;
  }, [messages, pendingAttachment?.localUrl]);

  useEffect(() => {
    return () => {
      trackedLocalUrlsRef.current.forEach((trackedUrl) => {
        URL.revokeObjectURL(trackedUrl);
      });
      trackedLocalUrlsRef.current = new Set<string>();
    };
  }, []);

  const clearLocalAttachmentForClientId = (clientId: string) => {
    setMessages((current) =>
      current.map((message) =>
        message.clientId === clientId
          ? {
              ...message,
              localAttachment: undefined
            }
          : message
      )
    );
  };

  const sendMessage = async () => {
    if (!peer || !isSocketReady) {
      return;
    }

    const nextContent = draft.trim();

    if (!nextContent && !pendingAttachment) {
      return;
    }

    setErrorMessage(null);

    const clientId = buildClientMessageId();
    const attachmentSnapshot = pendingAttachment
      ? {
          file: pendingAttachment.file,
          name: pendingAttachment.name,
          mimeType: pendingAttachment.mimeType,
          localUrl: pendingAttachment.localUrl
        }
      : null;

    const optimisticMessage: ChatUiMessage = {
      id: clientId,
      clientId,
      fromUserId: user?.id ?? 'current-user',
      toUserId: peer.id,
      content: nextContent,
      isRead: false,
      createdAt: new Date().toISOString(),
      deliveryStatus: 'pending',
      localAttachment: attachmentSnapshot
        ? {
            name: attachmentSnapshot.name,
            mimeType: attachmentSnapshot.mimeType,
            localUrl: attachmentSnapshot.localUrl
          }
        : undefined
    };

    setMessages((current) => [...current, optimisticMessage]);

    stopTyping();
    setDraft('');
    setPendingAttachment(null);

    let outboundContent = nextContent;

    if (attachmentSnapshot) {
      try {
        setErrorMessage(null);
        setIsUploadingAttachment(true);

        const uploadedAttachment = await chatService.uploadAttachment(attachmentSnapshot.file);
        outboundContent = encodeAttachmentMessageContent(uploadedAttachment, nextContent || undefined);

        setMessages((current) =>
          current.map((message) =>
            message.clientId === clientId
              ? {
                  ...message,
                  content: outboundContent
                }
              : message
          )
        );

        if (uploadedAttachment.mimeType.startsWith('image/')) {
          try {
            await preloadImage(uploadedAttachment.url);
          } catch (_error) {
            // Keep local preview fallback if image preload fails.
          }
        }

        clearLocalAttachmentForClientId(clientId);
      } catch (_error) {
        setErrorMessage('Unable to upload attachment right now.');
        setMessages((current) => current.filter((message) => message.clientId !== clientId));
        setPendingAttachment(attachmentSnapshot);
        setDraft(nextContent);
        return;
      } finally {
        setIsUploadingAttachment(false);
      }
    }

    if (!sendPrivateMessage({ toUserId: peer.id, content: outboundContent, clientId })) {
      setMessages((current) => current.filter((message) => message.clientId !== clientId));
      if (attachmentSnapshot) {
        setPendingAttachment({
          file: attachmentSnapshot.file,
          name: attachmentSnapshot.name,
          mimeType: attachmentSnapshot.mimeType,
          localUrl: URL.createObjectURL(attachmentSnapshot.file)
        });
      }
      setDraft(nextContent);
      setErrorMessage('Unable to send message right now. Please try again.');
      return;
    }
  };

  const removePendingAttachment = () => {
    setPendingAttachment(null);
  };

  const handleFileSelection = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    event.currentTarget.value = '';

    if (!selectedFile) {
      return;
    }

    const isPdf = selectedFile.type === 'application/pdf';
    const isImage = selectedFile.type.startsWith('image/');

    if (!isPdf && !isImage) {
      setErrorMessage('Only image and PDF files are allowed.');
      return;
    }

    setErrorMessage(null);

    if (pendingAttachment?.localUrl) {
      URL.revokeObjectURL(pendingAttachment.localUrl);
    }

    setPendingAttachment({
      file: selectedFile,
      name: selectedFile.name,
      mimeType: selectedFile.type,
      localUrl: URL.createObjectURL(selectedFile)
    });
  };

  const handlePdfDownload = async (messageId: string, attachment: ChatAttachment) => {
    try {
      setErrorMessage(null);
      setDownloadingMessageId(messageId);
      await chatService.downloadAttachment(attachment);
    } catch (_error) {
      setErrorMessage('Unable to download attachment right now. Please try again.');
    } finally {
      setDownloadingMessageId(null);
    }
  };

  return {
    user,
    peer,
    draft,
    messages,
    pendingAttachment,
    isUploadingAttachment,
    isLoadingConversation,
    errorMessage,
    isSocketReady,
    downloadingMessageId,
    isPeerTyping,
    previewImage,
    peerAvatarUrl,
    isPeerOnline,
    messagesEndRef,
    setDraft,
    setPreviewImage,
    sendMessage,
    stopTyping,
    handleFileSelection,
    removePendingAttachment,
    handlePdfDownload
  };
};
