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

type ConversationCacheEntry = {
  peer: ChatUser;
  messages: ChatUiMessage[];
  cachedAt: number;
};

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

export const useDashboardChatConversation = () => {
  const { user } = useAuth();
  const { conversationId } = useParams<{ conversationId: string }>();
  const [draft, setDraft] = useState('');
  const [peer, setPeer] = useState<ChatUser | null>(null);
  const [messages, setMessages] = useState<ChatUiMessage[]>([]);
  const [pendingAttachment, setPendingAttachment] = useState<PendingComposerAttachment | null>(null);
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);
  const [isLoadingConversation, setIsLoadingConversation] = useState(true);
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
    () => (requestedPeerUserId && requestedPeerUserId.trim().length > 0 ? requestedPeerUserId : '__assigned_admin__'),
    [requestedPeerUserId]
  );

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
    let isCancelled = false;

    const applyResolvedConversation = async (resolvedPeer: ChatUser) => {
      const history = await chatService.getMessages(resolvedPeer.id);
      await chatService.markConversationRead(resolvedPeer.id);

      if (isCancelled) {
        return;
      }

      const normalizedHistory = history.map(toSentMessage);

      setPeer(resolvedPeer);
      setMessages(normalizedHistory);
      conversationCache.set(conversationCacheKey, {
        peer: resolvedPeer,
        messages: normalizedHistory,
        cachedAt: Date.now()
      });

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

      const cachedConversation = conversationCache.get(conversationCacheKey);
      const isCacheFresh =
        Boolean(cachedConversation) && Date.now() - (cachedConversation?.cachedAt ?? 0) < CHAT_PAGE_CACHE_TTL_MS;

      if (cachedConversation && isCacheFresh) {
        setPeer(cachedConversation.peer);
        setMessages(cachedConversation.messages);
        setIsLoadingConversation(false);
        setErrorMessage(null);

        void chatService.markConversationRead(cachedConversation.peer.id);

        if (user.role === 'ADMIN') {
          clearAdminUnreadForUser(cachedConversation.peer.id);
        } else {
          clearUserUnread();
        }

        // SWR: keep UI instant from cache, then refresh quietly for latest messages.
        try {
          await applyResolvedConversation(cachedConversation.peer);
        } catch (_error) {
          return;
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
  }, [conversationCacheKey, messages, peer]);

  useEffect(() => {
    const peerUserId = peer?.id;

    return subscribeToPresence(peerUserId ? [peerUserId] : []);
  }, [peer?.id, subscribeToPresence]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ block: 'end' });
  }, [messages]);

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
