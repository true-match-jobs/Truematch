import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Check, Checks, Clock } from '@phosphor-icons/react';
import { decodeAttachmentMessageContent, type ChatAttachment, type ChatRole, type ChatUser } from '../../services/chat.service';
import { PdfPreview } from './PdfPreview';
import type { ChatUiMessage } from '../../hooks/chat/chat-types';

type ChatMessagesPaneProps = {
  messages: ChatUiMessage[];
  userId?: string;
  userRole?: ChatRole;
  peer: ChatUser | null;
  peerAvatarUrl: string;
  isLoadingConversation: boolean;
  errorMessage: string | null;
  isPeerTyping: boolean;
  downloadingMessageId: string | null;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  onPdfDownload: (messageId: string, attachment: ChatAttachment) => Promise<void>;
  onPreviewImage: (image: { url: string; name: string }) => void;
};

const formatTime = (value: string): string => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit'
  }).format(date);
};

const OwnMessageMeta = ({ message }: { message: ChatUiMessage }) => {
  if (message.deliveryStatus === 'pending') {
    return (
      <div className="mt-1 flex justify-end">
        <Clock size={11} weight="regular" className="text-white/65" aria-label="Sending" />
      </div>
    );
  }

  return (
    <div className="mt-1 flex items-center justify-end gap-1">
      <p className="text-right text-[10px] leading-none text-white/60">{formatTime(message.createdAt)}</p>
      {message.isRead ? (
        <Checks size={11} weight="bold" className="text-white/85" aria-label="Read" />
      ) : (
        <Check size={11} weight="bold" className="text-white/70" aria-label="Sent" />
      )}
    </div>
  );
};

export const ChatMessagesPane = ({
  messages,
  userId,
  userRole,
  peer,
  peerAvatarUrl,
  isLoadingConversation,
  errorMessage,
  isPeerTyping,
  downloadingMessageId,
  messagesEndRef,
  onPdfDownload,
  onPreviewImage
}: ChatMessagesPaneProps) => {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const [loadedImageKeys, setLoadedImageKeys] = useState<Record<string, boolean>>({});
  const [hasInitialBottomPosition, setHasInitialBottomPosition] = useState(false);
  const shouldShowLoadingSpinner = isLoadingConversation && messages.length === 0;
  const shouldHideUntilPositioned = messages.length > 0 && !hasInitialBottomPosition;

  useEffect(() => {
    setHasInitialBottomPosition(false);
  }, [peer?.id]);

  useLayoutEffect(() => {
    if (!messages.length) {
      setHasInitialBottomPosition(true);
      return;
    }

    const container = scrollContainerRef.current;

    if (container) {
      container.scrollTop = container.scrollHeight;
    }

    messagesEndRef.current?.scrollIntoView({ block: 'end' });
    setHasInitialBottomPosition(true);
  }, [messages, messagesEndRef]);

  useEffect(() => {
    const activeKeys = new Set<string>();

    messages.forEach((message) => {
      const decodedAttachment = decodeAttachmentMessageContent(message.content);
      const localAttachment = message.localAttachment;
      const imageUrl = decodedAttachment?.attachment.mimeType.startsWith('image/')
        ? decodedAttachment.attachment.url
        : localAttachment?.mimeType.startsWith('image/')
          ? localAttachment.localUrl
          : null;

      if (imageUrl) {
        activeKeys.add(`${message.id}:${imageUrl}`);
      }
    });

    setLoadedImageKeys((currentState) => {
      const nextState: Record<string, boolean> = {};

      Object.entries(currentState).forEach(([key, isLoaded]) => {
        if (activeKeys.has(key)) {
          nextState[key] = isLoaded;
        }
      });

      return nextState;
    });
  }, [messages]);

  return (
    <div
      ref={scrollContainerRef}
      className={`flex-1 overflow-y-auto px-4 pt-3 pb-6 ${shouldHideUntilPositioned ? 'invisible' : 'visible'}`}
    >
      <div className={shouldShowLoadingSpinner ? 'flex min-h-full items-center justify-center' : 'flex min-h-full flex-col justify-end gap-4'}>
        {shouldShowLoadingSpinner ? <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : null}

        {!shouldShowLoadingSpinner && errorMessage ? <p className="text-sm text-rose-400">{errorMessage}</p> : null}

        {!shouldShowLoadingSpinner && !errorMessage && !messages.length ? (
          <p className="text-sm text-zinc-400">No messages yet. Say hello.</p>
        ) : null}

        {messages.map((message) => {
          const isMine = message.fromUserId === userId;
          const isAdminSender = peer && message.fromUserId === peer.id && peer.role === 'ADMIN';
          const decodedAttachment = decodeAttachmentMessageContent(message.content);
          const localAttachment = message.localAttachment;
          const hasPendingLocalAttachment = Boolean(localAttachment);
          const resolvedAttachment = localAttachment
            ? {
                url: localAttachment.localUrl,
                downloadUrl: localAttachment.localUrl,
                mimeType: localAttachment.mimeType,
                name: localAttachment.name
              }
            : decodedAttachment
              ? decodedAttachment.attachment
              : null;
          const messageText = decodedAttachment?.text ?? (!decodedAttachment ? message.content : '');
          const imageKey = resolvedAttachment?.mimeType.startsWith('image/') ? `${message.id}:${resolvedAttachment.url}` : null;
          const shouldFadeInFinalImage = Boolean(
            imageKey &&
              decodedAttachment &&
              !hasPendingLocalAttachment &&
              message.deliveryStatus === 'pending'
          );
          const imageOpacityClass = shouldFadeInFinalImage
            ? loadedImageKeys[imageKey as string]
              ? 'opacity-100'
              : 'opacity-0'
            : 'opacity-100';

          if (isMine) {
            return (
              <div key={message.id} className="flex justify-end">
                <div
                  className={`w-fit max-w-[85%] rounded-2xl rounded-br-md px-4 py-3 text-sm sm:max-w-[32rem] ${
                    userRole === 'ADMIN' ? 'bg-brand-600 text-white' : 'text-zinc-100'
                  }`}
                  style={userRole !== 'ADMIN' ? { backgroundColor: '#333334' } : {}}
                >
                  {resolvedAttachment ? (
                    <div className="space-y-2">
                      {resolvedAttachment.mimeType.startsWith('image/') ? (
                        <div className="relative w-56 max-w-full">
                          <img
                            src={resolvedAttachment.url}
                            alt={resolvedAttachment.name}
                            className={`h-auto w-full cursor-zoom-in rounded-lg object-cover transition-opacity duration-200 ${imageOpacityClass}`}
                            onLoad={() => {
                              if (imageKey) {
                                setLoadedImageKeys((currentState) => ({
                                  ...currentState,
                                  [imageKey]: true
                                }));
                              }
                            }}
                            onClick={() => {
                              if (!hasPendingLocalAttachment) {
                                onPreviewImage({
                                  url: resolvedAttachment.url,
                                  name: resolvedAttachment.name
                                });
                              }
                            }}
                          />
                          {hasPendingLocalAttachment ? (
                            <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-lg bg-black/25">
                              <span
                                className="inline-flex h-6 w-6 animate-spin rounded-full border-2 border-white/80 border-t-transparent"
                                aria-label="Uploading attachment"
                              />
                            </div>
                          ) : null}
                        </div>
                      ) : hasPendingLocalAttachment ? (
                        <div className="relative block w-56 max-w-full overflow-hidden rounded-lg bg-black/20 text-left">
                          <PdfPreview attachment={resolvedAttachment} className="bg-zinc-900" />
                          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/25">
                            <span
                              className="inline-flex h-6 w-6 animate-spin rounded-full border-2 border-white/80 border-t-transparent"
                              aria-label="Uploading attachment"
                            />
                          </div>
                          <p className="truncate px-2.5 py-2 text-xs font-medium text-white">Uploading PDF...</p>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => void onPdfDownload(message.id, resolvedAttachment)}
                          className="block w-56 max-w-full overflow-hidden rounded-lg bg-black/20 text-left"
                        >
                          <PdfPreview attachment={resolvedAttachment} className="bg-zinc-900" />
                          <p className="truncate px-2.5 py-2 text-xs font-medium text-white">
                            {downloadingMessageId === message.id ? 'Downloading PDF...' : resolvedAttachment.name}
                          </p>
                        </button>
                      )}
                      {messageText ? <p className="whitespace-break-spaces break-words">{messageText}</p> : null}
                    </div>
                  ) : (
                    <p className="whitespace-break-spaces break-words">{messageText}</p>
                  )}
                  <OwnMessageMeta message={message} />
                </div>
              </div>
            );
          }

          return (
            <div key={message.id} className="flex items-start gap-3">
              <img
                src={peerAvatarUrl}
                alt={`${peer?.fullName ?? 'Chat partner'} avatar`}
                className="mt-5 h-11 w-11 flex-shrink-0 rounded-full bg-dark-card"
              />
              <div className="w-fit max-w-[calc(100%-3.75rem)] sm:max-w-[30rem]">
                <p className="mb-1.5 text-sm font-medium text-white">{peer?.fullName ?? 'Chat partner'}</p>
                <div
                  className={`rounded-2xl rounded-tl-md px-4 py-3 text-sm ${isAdminSender ? 'bg-brand-600 text-white' : 'text-zinc-100'}`}
                  style={!isAdminSender ? { backgroundColor: '#333334' } : {}}
                >
                  {resolvedAttachment ? (
                    <div className="space-y-2">
                      {resolvedAttachment.mimeType.startsWith('image/') ? (
                        <div className="relative w-56 max-w-full">
                          <img
                            src={resolvedAttachment.url}
                            alt={resolvedAttachment.name}
                            className={`h-auto w-full cursor-zoom-in rounded-lg object-cover transition-opacity duration-200 ${imageOpacityClass}`}
                            onLoad={() => {
                              if (imageKey) {
                                setLoadedImageKeys((currentState) => ({
                                  ...currentState,
                                  [imageKey]: true
                                }));
                              }
                            }}
                            onClick={() => {
                              if (!hasPendingLocalAttachment) {
                                onPreviewImage({
                                  url: resolvedAttachment.url,
                                  name: resolvedAttachment.name
                                });
                              }
                            }}
                          />
                          {hasPendingLocalAttachment ? (
                            <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-lg bg-black/25">
                              <span
                                className="inline-flex h-6 w-6 animate-spin rounded-full border-2 border-white/80 border-t-transparent"
                                aria-label="Uploading attachment"
                              />
                            </div>
                          ) : null}
                        </div>
                      ) : (
                        <div className="relative w-56 max-w-full">
                          <button
                            type="button"
                            onClick={() => {
                              if (!hasPendingLocalAttachment) {
                                void onPdfDownload(message.id, resolvedAttachment);
                              }
                            }}
                            className="block w-full overflow-hidden rounded-lg bg-black/20 text-left"
                            disabled={hasPendingLocalAttachment}
                          >
                            <PdfPreview attachment={resolvedAttachment} className="bg-zinc-900" />
                            <p className="truncate px-2.5 py-2 text-xs font-medium text-zinc-100">
                              {hasPendingLocalAttachment
                                ? 'Uploading PDF...'
                                : downloadingMessageId === message.id
                                  ? 'Downloading PDF...'
                                  : resolvedAttachment.name}
                            </p>
                          </button>
                          {hasPendingLocalAttachment ? (
                            <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-lg bg-black/25">
                              <span
                                className="inline-flex h-6 w-6 animate-spin rounded-full border-2 border-white/80 border-t-transparent"
                                aria-label="Uploading attachment"
                              />
                            </div>
                          ) : null}
                        </div>
                      )}

                      {messageText ? <p className="whitespace-break-spaces break-words">{messageText}</p> : null}
                    </div>
                  ) : (
                    <p className="whitespace-break-spaces break-words">{messageText}</p>
                  )}
                  <p className="mt-1 text-right text-[10px] leading-none text-zinc-400">{formatTime(message.createdAt)}</p>
                </div>
              </div>
            </div>
          );
        })}

        {isPeerTyping && !shouldShowLoadingSpinner && peer ? (
          <div className="flex items-start" role="status" aria-live="polite" aria-label={`${peer.fullName} is typing`}>
            <div className="flex items-center gap-1" aria-hidden>
              <span className="h-2 w-2 rounded-full bg-zinc-100 animate-bounce" style={{ animationDelay: '0ms', animationDuration: '0.9s' }} />
              <span className="h-2 w-2 rounded-full bg-zinc-100 animate-bounce" style={{ animationDelay: '150ms', animationDuration: '0.9s' }} />
              <span className="h-2 w-2 rounded-full bg-zinc-100 animate-bounce" style={{ animationDelay: '300ms', animationDuration: '0.9s' }} />
            </div>
          </div>
        ) : null}

        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};
