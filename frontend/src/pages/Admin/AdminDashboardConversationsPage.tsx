import { Trash, X } from '@phosphor-icons/react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { RelativeTime } from '../../components/ui/RelativeTime';
import { useAuth } from '../../hooks/useAuth';
import { chatService, type AdminConversation } from '../../services/chat.service';
import { useChatNotificationStore } from '../../store/chat-notification.store';
import { buildInitialAvatarUrl } from '../../utils/avatar';

const ADMIN_CONVERSATIONS_CACHE_TTL_MS = 60_000;

let adminConversationsCache: {
  conversations: AdminConversation[];
  cachedAt: number;
} | null = null;

const getCachedAdminConversations = (): AdminConversation[] | null => {
  if (!adminConversationsCache) {
    return null;
  }

  const isFresh = Date.now() - adminConversationsCache.cachedAt < ADMIN_CONVERSATIONS_CACHE_TTL_MS;

  return isFresh ? adminConversationsCache.conversations : null;
};

const setCachedAdminConversations = (conversations: AdminConversation[]): void => {
  adminConversationsCache = {
    conversations,
    cachedAt: Date.now()
  };
};

export const AdminDashboardConversationsPage = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<AdminConversation[]>(() => getCachedAdminConversations() ?? []);
  const [isLoading, setIsLoading] = useState(() => !getCachedAdminConversations());
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedConversationUserIds, setSelectedConversationUserIds] = useState<string[]>([]);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteErrorMessage, setDeleteErrorMessage] = useState<string | null>(null);
  const presenceByUserId = useChatNotificationStore((state) => state.presenceByUserId);
  const subscribeToPresence = useChatNotificationStore((state) => state.subscribeToPresence);

  const sortedConversations = useMemo(() => {
    return conversations
      .map((conversation, index) => ({
        conversation,
        index,
        isOnline: Boolean(presenceByUserId[conversation.user.id])
      }))
      .sort((left, right) => {
        if (left.isOnline !== right.isOnline) {
          return left.isOnline ? -1 : 1;
        }

        return left.index - right.index;
      })
      .map((entry) => entry.conversation);
  }, [conversations, presenceByUserId]);

  useEffect(() => {
    let isCancelled = false;

    const loadConversations = async (showLoading = false) => {
      if (showLoading) {
        setIsLoading(true);
      }

      setErrorMessage(null);

      try {
        const nextConversations = await chatService.getAdminConversations();

        if (isCancelled) {
          return;
        }

        setCachedAdminConversations(nextConversations);
        setConversations(nextConversations);
        setSelectedConversationUserIds((currentSelectedIds) =>
          currentSelectedIds.filter((selectedId) =>
            nextConversations.some((conversation) => conversation.user.id === selectedId)
          )
        );
      } catch (_error) {
        if (isCancelled) {
          return;
        }

        setConversations([]);
        setErrorMessage('Unable to load conversations right now.');
      } finally {
        if (!isCancelled && showLoading) {
          setIsLoading(false);
        }
      }
    };

    void loadConversations(!getCachedAdminConversations());
    const intervalId = window.setInterval(() => {
      void loadConversations(false);
    }, 5000);

    return () => {
      isCancelled = true;
      window.clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    const conversationUserIds = Array.from(new Set(conversations.map((conversation) => conversation.user.id)));

    if (!conversationUserIds.length) {
      subscribeToPresence([]);
      return;
    }

    subscribeToPresence(conversationUserIds);
  }, [conversations, subscribeToPresence]);

  const selectedCount = selectedConversationUserIds.length;

  const toggleConversationSelection = (userId: string) => {
    setDeleteErrorMessage(null);
    setSelectedConversationUserIds((currentSelectedIds) => {
      if (currentSelectedIds.includes(userId)) {
        return currentSelectedIds.filter((currentId) => currentId !== userId);
      }

      return [...currentSelectedIds, userId];
    });
  };

  const closeSelectionMode = () => {
    if (isDeleting) {
      return;
    }

    setIsSelectionMode(false);
    setSelectedConversationUserIds([]);
    setDeleteErrorMessage(null);
  };

  const handleConfirmDeleteSelected = async () => {
    if (!selectedConversationUserIds.length) {
      return;
    }

    try {
      setIsDeleting(true);
      setDeleteErrorMessage(null);
      await chatService.clearAdminConversations(selectedConversationUserIds);

      setConversations((currentConversations) => {
        const nextConversations = currentConversations.filter(
          (conversation) => !selectedConversationUserIds.includes(conversation.user.id)
        );

        setCachedAdminConversations(nextConversations);

        return nextConversations;
      });

      setSelectedConversationUserIds([]);
      setIsDeleteModalOpen(false);
      setIsSelectionMode(false);
    } catch (_error) {
      setDeleteErrorMessage('Unable to clear selected conversations right now.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <section className="flex h-full min-h-0 flex-col pt-5 pb-3">
      <div className="flex items-center justify-between px-3">
        <h2 className="text-xl font-semibold tracking-tight text-zinc-100">Conversations</h2>
        <div className="flex items-center gap-2">
          {isSelectionMode ? (
            <button
              type="button"
              onClick={closeSelectionMode}
              disabled={isDeleting}
              className="rounded-md border border-white/10 px-2.5 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:border-white/20 disabled:cursor-not-allowed disabled:text-zinc-500"
            >
              Cancel
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => {
              if (!conversations.length) {
                return;
              }

              setDeleteErrorMessage(null);
              setIsSelectionMode(true);
            }}
            disabled={isLoading || !conversations.length || isDeleting}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-red-400 transition-colors hover:text-red-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 disabled:cursor-not-allowed disabled:text-zinc-500"
            aria-label="Select conversations to clear"
            title="Clear conversations"
          >
            <Trash size={18} weight="bold" />
          </button>
        </div>
      </div>

      {isSelectionMode ? (
        <div className="mt-2 flex items-center justify-between px-3">
          <p className="text-xs text-zinc-400">
            {selectedCount > 0
              ? `${selectedCount} conversation${selectedCount > 1 ? 's' : ''} selected`
              : 'Select conversation previews to clear from your list'}
          </p>
          <button
            type="button"
            onClick={() => setIsDeleteModalOpen(true)}
            disabled={selectedCount === 0 || isDeleting}
            className="text-xs font-medium text-red-400 transition-colors hover:text-red-300 disabled:cursor-not-allowed disabled:text-zinc-500"
          >
            Delete selected
          </button>
        </div>
      ) : null}

      <div className="mt-4 min-h-0 flex-1 overflow-y-auto">
        {isLoading ? <LoadingSpinner className="py-10" /> : null}
        {!isLoading && errorMessage ? <p className="px-3 py-2 text-sm text-rose-400">{errorMessage}</p> : null}
        {!isLoading && !errorMessage && !conversations.length ? (
          <p className="px-3 py-2 text-sm text-zinc-400">No conversations yet.</p>
        ) : null}

        <ul>
          {sortedConversations.map((conversation) => {
            const isUserOnline = Boolean(presenceByUserId[conversation.user.id]);
            const isLastMessageFromAdmin = conversation.lastMessageFromUserId === user?.id;
            const previewText = isLastMessageFromAdmin
              ? `You: ${conversation.lastMessagePreview}`
              : conversation.lastMessagePreview;
            const isSelected = selectedConversationUserIds.includes(conversation.user.id);

            if (isSelectionMode) {
              return (
                <li key={conversation.user.id}>
                  <button
                    type="button"
                    onClick={() => toggleConversationSelection(conversation.user.id)}
                    className={`flex w-full items-center gap-3 px-3 py-3 text-left transition-colors ${
                      isSelected ? 'bg-white/10' : 'hover:bg-white/5'
                    }`}
                  >
                    <span
                      className={`inline-flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                        isSelected
                          ? 'border-red-400 bg-red-500/20 text-red-300'
                          : 'border-white/25 text-transparent'
                      }`}
                      aria-hidden
                    >
                      ✓
                    </span>

                    <div className="relative">
                      <img
                        src={buildInitialAvatarUrl({
                          fullName: conversation.user.fullName,
                          email: conversation.user.email,
                          id: conversation.user.id,
                          fallback: 'User',
                          size: 44
                        })}
                        alt={`${conversation.user.fullName} avatar`}
                        className="h-11 w-11 rounded-full bg-dark-surface"
                      />
                      <span
                        className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border border-dark-bg ${
                          isUserOnline ? 'bg-emerald-400' : 'bg-zinc-500'
                        }`}
                        aria-hidden
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="min-w-0 flex-1 truncate text-sm font-medium text-zinc-100">{conversation.user.fullName}</p>
                        <RelativeTime value={conversation.lastMessageAt} className="shrink-0 text-xs text-zinc-400" />
                      </div>

                      <div className="mt-0.5 flex items-center gap-2">
                        <p className="min-w-0 flex-1 truncate text-sm text-zinc-300">{previewText}</p>
                        {conversation.unreadMessageCount > 0 ? (
                          <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-600 px-1.5 text-[10px] font-semibold leading-none text-white">
                            {conversation.unreadMessageCount > 99 ? '99+' : conversation.unreadMessageCount}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </button>
                </li>
              );
            }

            return (
              <li key={conversation.user.id}>
                <Link
                  to={`/chat/${conversation.user.id}`}
                  className="flex items-center gap-3 px-3 py-3 transition-colors hover:bg-white/5"
                >
                  <div className="relative">
                    <img
                      src={buildInitialAvatarUrl({
                        fullName: conversation.user.fullName,
                        email: conversation.user.email,
                        id: conversation.user.id,
                        fallback: 'User',
                        size: 44
                      })}
                      alt={`${conversation.user.fullName} avatar`}
                      className="h-11 w-11 rounded-full bg-dark-surface"
                    />
                    <span
                      className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border border-dark-bg ${
                        isUserOnline ? 'bg-emerald-400' : 'bg-zinc-500'
                      }`}
                      aria-hidden
                    />
                  </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="min-w-0 flex-1 truncate text-sm font-medium text-zinc-100">{conversation.user.fullName}</p>
                    <RelativeTime value={conversation.lastMessageAt} className="shrink-0 text-xs text-zinc-400" />
                  </div>

                  <div className="mt-0.5 flex items-center gap-2">
                    <p className="min-w-0 flex-1 truncate text-sm text-zinc-300">{previewText}</p>
                    {conversation.unreadMessageCount > 0 ? (
                      <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-600 px-1.5 text-[10px] font-semibold leading-none text-white">
                        {conversation.unreadMessageCount > 99 ? '99+' : conversation.unreadMessageCount}
                      </span>
                    ) : null}
                  </div>
                </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      {isDeleteModalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="clear-conversations-title"
          onClick={() => {
            if (!isDeleting) {
              setIsDeleteModalOpen(false);
            }
          }}
        >
          <div
            className="w-full max-w-md rounded-xl border border-white/10 bg-dark-card p-5 shadow-lg sm:p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <h3 id="clear-conversations-title" className="text-base font-semibold text-zinc-100">
                Delete selected conversations?
              </h3>
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={isDeleting}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-zinc-400 transition-colors hover:text-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 disabled:cursor-not-allowed"
                aria-label="Close delete confirmation"
              >
                <X size={14} weight="bold" />
              </button>
            </div>

            <p className="mt-3 text-sm text-zinc-300">
              This removes the selected conversation previews from your admin list only. Users and chat messages remain unchanged.
            </p>

            {deleteErrorMessage ? <p className="mt-3 text-sm text-rose-400">{deleteErrorMessage}</p> : null}

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={isDeleting}
                className="rounded-md border border-white/10 px-3 py-2 text-sm font-medium text-zinc-200 transition-colors hover:border-white/20 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleConfirmDeleteSelected()}
                disabled={isDeleting || selectedCount === 0}
                className="rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-red-500 disabled:cursor-not-allowed"
              >
                {isDeleting ? 'Deleting...' : `Delete ${selectedCount > 1 ? 'conversations' : 'conversation'}`}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
};
