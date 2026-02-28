import { FilePdf, PaperPlaneTilt, Paperclip, X } from '@phosphor-icons/react';
import { FormEvent, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { PdfPreview } from '../../components/chat/PdfPreview';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import {
  chatService,
  decodeAttachmentMessageContent,
  encodeAttachmentMessageContent,
  type ChatMessage,
  type ChatUser
} from '../../services/chat.service';
import { useChatNotificationStore } from '../../store/chat-notification.store';

const MAX_COMPOSER_HEIGHT = 112;

type PendingComposerAttachment = {
  file: File;
  name: string;
  mimeType: string;
  localUrl: string;
};

export const DashboardChatPage = () => {
  const { user } = useAuth();
  const { conversationId } = useParams<{ conversationId: string }>();
  const [draft, setDraft] = useState('');
  const [peer, setPeer] = useState<ChatUser | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [pendingAttachment, setPendingAttachment] = useState<PendingComposerAttachment | null>(null);
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);
  const [isLoadingConversation, setIsLoadingConversation] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSocketReady, setIsSocketReady] = useState(false);
  const [previewImage, setPreviewImage] = useState<{ url: string; name: string } | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const clearAdminUnreadForUser = useChatNotificationStore((state) => state.clearAdminUnreadForUser);

  const requestedPeerUserId = useMemo(() => {
    if (user?.role === 'ADMIN') {
      return conversationId;
    }

    return undefined;
  }, [conversationId, user?.role]);

  const formatTime = (value: string) => {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return '';
    }

    return new Intl.DateTimeFormat(undefined, {
      hour: 'numeric',
      minute: '2-digit'
    }).format(date);
  };

  useLayoutEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) {
      return;
    }

    textarea.style.height = '0px';
    const nextHeight = Math.min(textarea.scrollHeight, MAX_COMPOSER_HEIGHT);
    textarea.style.height = `${nextHeight}px`;
    textarea.style.overflowY = textarea.scrollHeight > MAX_COMPOSER_HEIGHT ? 'auto' : 'hidden';
  }, [draft]);

  useEffect(() => {
    let isCancelled = false;

    const loadConversation = async () => {
      if (!user) {
        return;
      }

      setIsLoadingConversation(true);
      setErrorMessage(null);

      try {
        const resolvedPeer = await chatService.getPeer(requestedPeerUserId);
        const history = await chatService.getMessages(resolvedPeer.id);
        await chatService.markConversationRead(resolvedPeer.id);

        if (isCancelled) {
          return;
        }

        setPeer(resolvedPeer);
        setMessages(history);

        if (user.role === 'ADMIN') {
          clearAdminUnreadForUser(resolvedPeer.id);
        }
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
  }, [clearAdminUnreadForUser, requestedPeerUserId, user]);

  useEffect(() => {
    if (!user || !peer) {
      return;
    }

    const socket = chatService.createSocket();
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
        const payload = JSON.parse(event.data as string) as ChatMessage & { type?: string };

        if (payload.type !== 'private_message') {
          return;
        }

        const participants = [payload.fromUserId, payload.toUserId];

        if (!participants.includes(user.id) || !participants.includes(peer.id)) {
          return;
        }

        setMessages((current) => {
          if (current.some((item) => item.id === payload.id)) {
            return current;
          }

          return [...current, payload];
        });
      } catch (_error) {
        return;
      }
    };

    return () => {
      socket.close();
      socketRef.current = null;
      setIsSocketReady(false);
    };
  }, [peer, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ block: 'end' });
  }, [messages]);

  useEffect(() => {
    return () => {
      if (pendingAttachment?.localUrl) {
        URL.revokeObjectURL(pendingAttachment.localUrl);
      }
    };
  }, [pendingAttachment]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!peer || !socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      return;
    }

    const nextContent = draft.trim();

    if (!nextContent && !pendingAttachment) {
      return;
    }

    let outboundContent = nextContent;

    if (pendingAttachment) {
      try {
        setErrorMessage(null);
        setIsUploadingAttachment(true);

        const uploadedAttachment = await chatService.uploadAttachment(pendingAttachment.file);
        outboundContent = encodeAttachmentMessageContent(uploadedAttachment, nextContent || undefined);
      } catch (_error) {
        setErrorMessage('Unable to upload attachment right now.');
        return;
      } finally {
        setIsUploadingAttachment(false);
      }
    }

    socketRef.current.send(
      JSON.stringify({
        type: 'private_message',
        toUserId: peer.id,
        content: outboundContent
      })
    );

    setDraft('');
    if (pendingAttachment?.localUrl) {
      URL.revokeObjectURL(pendingAttachment.localUrl);
    }
    setPendingAttachment(null);
  };

  const handleFileSelection = (event: React.ChangeEvent<HTMLInputElement>) => {
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

  return (
    <section className="flex h-full min-h-0 flex-col">
      <header className="border-b border-white/10">
        <div className="px-3 py-3">
          <h2 className="flex items-center gap-2.5 text-base font-semibold text-zinc-100">
            <img
              src={`https://api.dicebear.com/9.x/avataaars/svg?seed=${peer?.id ?? 'chat-peer'}`}
              alt={`${peer?.fullName ?? 'Chat partner'} avatar`}
              className="h-8 w-8 rounded-full bg-dark-card"
            />
            <span>{peer?.fullName ?? (isLoadingConversation ? 'Loading...' : 'Chat')}</span>
          </h2>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-3 pt-3 pb-6">
        <div className="flex min-h-full flex-col justify-end gap-4">
          {isLoadingConversation ? <LoadingSpinner className="py-10" /> : null}
          {!isLoadingConversation && errorMessage ? <p className="text-sm text-rose-400">{errorMessage}</p> : null}

          {!isLoadingConversation && !errorMessage && !messages.length ? (
            <p className="text-sm text-zinc-400">No messages yet. Say hello.</p>
          ) : null}

          {messages.map((message) => {
            const isMine = message.fromUserId === user?.id;
            const decodedAttachment = decodeAttachmentMessageContent(message.content);
            const attachmentDownloadUrl = decodedAttachment
              ? decodedAttachment.attachment.downloadUrl || decodedAttachment.attachment.url
              : null;
            const messageText = decodedAttachment?.text ?? (!decodedAttachment ? message.content : '');

            if (isMine) {
              return (
                <div key={message.id} className="flex justify-end">
                  <div className="w-fit max-w-[85%] rounded-2xl rounded-br-md bg-brand-600 px-4 py-3 text-sm text-white sm:max-w-[32rem]">
                    {decodedAttachment ? (
                      <div className="space-y-2">
                        {decodedAttachment.attachment.mimeType.startsWith('image/') ? (
                          <img
                            src={decodedAttachment.attachment.url}
                            alt={decodedAttachment.attachment.name}
                            className="max-h-56 w-full cursor-zoom-in rounded-lg object-cover"
                            onClick={() =>
                              setPreviewImage({
                                url: decodedAttachment.attachment.url,
                                name: decodedAttachment.attachment.name
                              })
                            }
                          />
                        ) : (
                          <a
                            href={attachmentDownloadUrl || decodedAttachment.attachment.url}
                            download={decodedAttachment.attachment.name}
                            className="block overflow-hidden rounded-lg border border-white/20 bg-white/10"
                          >
                            <PdfPreview previewUrl={decodedAttachment.attachment.previewUrl} className="bg-zinc-900" />
                            <p className="truncate px-2.5 py-2 text-xs font-medium text-white">
                              {decodedAttachment.attachment.name}
                            </p>
                          </a>
                        )}
                        {messageText ? <p>{messageText}</p> : null}
                      </div>
                    ) : (
                      messageText
                    )}
                    <p className="mt-1 text-right text-[10px] leading-none text-white/60">{formatTime(message.createdAt)}</p>
                  </div>
                </div>
              );
            }

            return (
              <div key={message.id} className="flex items-start gap-3">
                <img
                  src={`https://api.dicebear.com/9.x/avataaars/svg?seed=${peer?.id ?? 'chat-peer'}`}
                  alt={`${peer?.fullName ?? 'Chat partner'} avatar`}
                  className="mt-6 h-9 w-9 flex-shrink-0 rounded-full bg-dark-card"
                />
                <div className="w-fit max-w-[calc(100%-3.75rem)] sm:max-w-[30rem]">
                  <p className="mb-1.5 text-sm font-medium text-white">{peer?.fullName ?? 'Chat partner'}</p>
                  <div className="rounded-2xl rounded-tl-md bg-zinc-700 px-4 py-3 text-sm text-zinc-100">
                    {decodedAttachment ? (
                      <div className="space-y-2">
                        {decodedAttachment.attachment.mimeType.startsWith('image/') ? (
                          <img
                            src={decodedAttachment.attachment.url}
                            alt={decodedAttachment.attachment.name}
                            className="max-h-56 w-full cursor-zoom-in rounded-lg object-cover"
                            onClick={() =>
                              setPreviewImage({
                                url: decodedAttachment.attachment.url,
                                name: decodedAttachment.attachment.name
                              })
                            }
                          />
                        ) : (
                          <a
                            href={attachmentDownloadUrl || decodedAttachment.attachment.url}
                            download={decodedAttachment.attachment.name}
                            className="block overflow-hidden rounded-lg border border-white/15 bg-black/20"
                          >
                            <PdfPreview previewUrl={decodedAttachment.attachment.previewUrl} className="bg-zinc-900" />
                            <p className="truncate px-2.5 py-2 text-xs font-medium text-zinc-100">
                              {decodedAttachment.attachment.name}
                            </p>
                          </a>
                        )}
                        {messageText ? <p>{messageText}</p> : null}
                      </div>
                    ) : (
                      messageText
                    )}
                    <p className="mt-1 text-right text-[10px] leading-none text-zinc-400">{formatTime(message.createdAt)}</p>
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="px-3 pt-3 pb-[calc(2rem+env(safe-area-inset-bottom))]">
        <form onSubmit={handleSubmit} className="relative">
          <div className="rounded-2xl border border-white/10 bg-dark-surface">
            {pendingAttachment ? (
              <div className="border-b border-white/10 p-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    {pendingAttachment.mimeType.startsWith('image/') ? (
                      <img
                        src={pendingAttachment.localUrl}
                        alt={pendingAttachment.name}
                        className="max-h-32 w-full rounded-md object-cover"
                      />
                    ) : (
                      <div className="flex h-20 w-full items-center justify-center rounded-md border border-white/10 bg-black/20">
                        <FilePdf size={44} weight="fill" className="text-rose-400" aria-hidden="true" />
                      </div>
                    )}
                    <p className="mt-1 truncate text-xs text-zinc-300">{pendingAttachment.name}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (pendingAttachment.localUrl) {
                        URL.revokeObjectURL(pendingAttachment.localUrl);
                      }
                      setPendingAttachment(null);
                    }}
                    className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded text-zinc-400 hover:text-zinc-200"
                    aria-label="Remove attachment"
                  >
                    <X size={14} weight="bold" />
                  </button>
                </div>
              </div>
            ) : null}

            <textarea
              ref={textareaRef}
              rows={1}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Type your message..."
              className="min-h-11 w-full resize-none bg-transparent py-3 pl-12 pr-12 text-sm leading-6 text-zinc-100 placeholder:text-zinc-500 focus:outline-none"
              style={{ maxHeight: `${MAX_COMPOSER_HEIGHT}px` }}
            />
          </div>

          <label
            htmlFor="chat-file-upload"
            className="absolute bottom-2 left-2 inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-zinc-300 transition-colors hover:text-white"
            aria-label="Upload file"
          >
            <input
              id="chat-file-upload"
              type="file"
              accept="image/*,.pdf,application/pdf"
              className="sr-only"
              onChange={(event) => void handleFileSelection(event)}
              disabled={isUploadingAttachment}
            />
            <Paperclip size={18} weight="bold" />
          </label>

          <button
            type="submit"
            aria-label="Send message"
            disabled={(!draft.trim() && !pendingAttachment) || !isSocketReady || !peer || isUploadingAttachment}
            className="absolute bottom-2 right-2 inline-flex h-8 w-8 items-center justify-center rounded-full text-zinc-300 transition-colors hover:text-white disabled:text-zinc-600"
          >
            <PaperPlaneTilt size={18} weight="fill" />
          </button>
        </form>
      </div>

      {previewImage ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 px-4 py-4"
          role="dialog"
          aria-modal="true"
          aria-label="Image preview"
          onClick={() => setPreviewImage(null)}
        >
          <button
            type="button"
            onClick={() => setPreviewImage(null)}
            className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white transition-colors hover:bg-black/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
            aria-label="Close image preview"
          >
            <X size={18} weight="bold" />
          </button>

          <img
            src={previewImage.url}
            alt={previewImage.name}
            className="h-auto w-auto max-h-[95vh] max-w-[95vw] object-contain"
            onClick={(event) => event.stopPropagation()}
          />
        </div>
      ) : null}
    </section>
  );
};
