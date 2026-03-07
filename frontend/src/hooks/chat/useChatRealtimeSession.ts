import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import { chatService, type ChatMessage, type ChatUser } from '../../services/chat.service';
import type { ChatUiMessage } from './chat-types';

type ChatTypingPayload = {
  type: 'typing';
  fromUserId: string;
  toUserId: string;
  isTyping: boolean;
};

type ChatReadReceiptPayload = {
  type: 'read_receipt';
  readerUserId: string;
  peerUserId: string;
  messageIds: string[];
  readAt: string;
};

type ChatPrivateMessagePayload = ChatMessage & {
  type: 'private_message';
  clientId?: string;
};

type UseChatRealtimeSessionParams = {
  userId?: string;
  peer: ChatUser | null;
  draft: string;
  setMessages: Dispatch<SetStateAction<ChatUiMessage[]>>;
};

const normalizePayload = (payload: ChatPrivateMessagePayload): ChatUiMessage => ({
  ...payload,
  deliveryStatus: 'sent'
});

export const useChatRealtimeSession = ({ userId, peer, draft, setMessages }: UseChatRealtimeSessionParams) => {
  const [isSocketReady, setIsSocketReady] = useState(false);
  const [isPeerTyping, setIsPeerTyping] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);
  const typingIdleTimeoutRef = useRef<number | null>(null);
  const typingHeartbeatIntervalRef = useRef<number | null>(null);
  const peerTypingTimeoutRef = useRef<number | null>(null);
  const hasEmittedTypingRef = useRef(false);

  const clearTypingIdleTimeout = () => {
    if (typingIdleTimeoutRef.current !== null) {
      window.clearTimeout(typingIdleTimeoutRef.current);
      typingIdleTimeoutRef.current = null;
    }
  };

  const clearTypingHeartbeat = () => {
    if (typingHeartbeatIntervalRef.current !== null) {
      window.clearInterval(typingHeartbeatIntervalRef.current);
      typingHeartbeatIntervalRef.current = null;
    }
  };

  const clearPeerTypingTimeout = () => {
    if (peerTypingTimeoutRef.current !== null) {
      window.clearTimeout(peerTypingTimeoutRef.current);
      peerTypingTimeoutRef.current = null;
    }
  };

  const emitTyping = (isTyping: boolean) => {
    const activeSocket = socketRef.current;

    if (!peer || !activeSocket || activeSocket.readyState !== WebSocket.OPEN) {
      return;
    }

    activeSocket.send(
      JSON.stringify({
        type: 'typing',
        toUserId: peer.id,
        isTyping
      })
    );
  };

  const stopTyping = () => {
    clearTypingIdleTimeout();
    clearTypingHeartbeat();

    if (!hasEmittedTypingRef.current) {
      return;
    }

    emitTyping(false);
    hasEmittedTypingRef.current = false;
  };

  const sendPrivateMessage = (payload: { toUserId: string; content: string; clientId: string }): boolean => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      return false;
    }

    socketRef.current.send(
      JSON.stringify({
        type: 'private_message',
        toUserId: payload.toUserId,
        content: payload.content,
        clientId: payload.clientId
      })
    );

    return true;
  };

  useEffect(() => {
    if (!userId || !peer) {
      return;
    }

    let isCancelled = false;
    let currentSocket: WebSocket | null = null;

    const connectSocket = async () => {
      try {
        const socket = await chatService.createSocket();

        if (isCancelled) {
          socket.close();
          return;
        }

        currentSocket = socket;
        socketRef.current = socket;

        socket.onopen = () => {
          setIsSocketReady(true);
        };

        socket.onclose = () => {
          setIsSocketReady(false);
        };

        socket.onerror = () => {
          setIsSocketReady(false);
        };

        socket.onmessage = (event) => {
          try {
            const payload = JSON.parse(event.data as string) as
              | ChatPrivateMessagePayload
              | ChatTypingPayload
              | ChatReadReceiptPayload;

            if (
              payload.type === 'typing' &&
              'fromUserId' in payload &&
              'toUserId' in payload &&
              'isTyping' in payload &&
              typeof payload.fromUserId === 'string' &&
              typeof payload.toUserId === 'string' &&
              typeof payload.isTyping === 'boolean'
            ) {
              const participants = [payload.fromUserId, payload.toUserId];

              if (!participants.includes(userId) || !participants.includes(peer.id) || payload.fromUserId !== peer.id) {
                return;
              }

              if (!payload.isTyping) {
                setIsPeerTyping(false);
                clearPeerTypingTimeout();
                return;
              }

              setIsPeerTyping(true);
              clearPeerTypingTimeout();
              peerTypingTimeoutRef.current = window.setTimeout(() => {
                setIsPeerTyping(false);
                peerTypingTimeoutRef.current = null;
              }, 3000);
              return;
            }

            if (payload.type === 'read_receipt') {
              if (
                payload.readerUserId !== peer.id ||
                payload.peerUserId !== userId ||
                !Array.isArray(payload.messageIds) ||
                !payload.messageIds.length
              ) {
                return;
              }

              const readMessageIds = new Set(payload.messageIds);
              setMessages((current) =>
                current.map((message) =>
                  readMessageIds.has(message.id) ? { ...message, isRead: true, deliveryStatus: 'sent' } : message
                )
              );
              return;
            }

            if (payload.type !== 'private_message') {
              return;
            }

            const participants = [payload.fromUserId, payload.toUserId];

            if (!participants.includes(userId) || !participants.includes(peer.id)) {
              return;
            }

            setMessages((current) => {
              const normalized = normalizePayload(payload);

              if (payload.clientId) {
                const optimisticIndex = current.findIndex((item) => item.clientId === payload.clientId);

                if (optimisticIndex !== -1) {
                  const next = [...current];
                  next[optimisticIndex] = {
                    ...normalized,
                    localAttachment: next[optimisticIndex].localAttachment
                  };
                  return next;
                }
              }

              if (current.some((item) => item.id === payload.id)) {
                return current;
              }

              return [...current, normalized];
            });

            if (payload.fromUserId === peer.id) {
              setIsPeerTyping(false);
              clearPeerTypingTimeout();
              void chatService.markConversationRead(peer.id);
            }
          } catch (_error) {
            return;
          }
        };
      } catch (_error) {
        if (!isCancelled) {
          setIsSocketReady(false);
        }
      }
    };

    void connectSocket();

    return () => {
      isCancelled = true;
      stopTyping();
      currentSocket?.close();
      socketRef.current = null;
      setIsSocketReady(false);
      setIsPeerTyping(false);
      clearPeerTypingTimeout();
    };
  }, [peer, setMessages, userId]);

  useEffect(() => {
    setIsPeerTyping(false);
    clearPeerTypingTimeout();
  }, [peer?.id]);

  useEffect(() => {
    const trimmedDraft = draft.trim();

    if (!peer || !isSocketReady || !trimmedDraft) {
      stopTyping();
      return;
    }

    if (!hasEmittedTypingRef.current) {
      emitTyping(true);
      hasEmittedTypingRef.current = true;

      clearTypingHeartbeat();
      typingHeartbeatIntervalRef.current = window.setInterval(() => {
        if (!hasEmittedTypingRef.current) {
          return;
        }

        emitTyping(true);
      }, 2500);
    }

    clearTypingIdleTimeout();
    typingIdleTimeoutRef.current = window.setTimeout(() => {
      stopTyping();
    }, 1200);
  }, [draft, isSocketReady, peer]);

  useEffect(() => {
    return () => {
      stopTyping();
      clearPeerTypingTimeout();
    };
  }, []);

  return {
    isSocketReady,
    isPeerTyping,
    stopTyping,
    sendPrivateMessage
  };
};
