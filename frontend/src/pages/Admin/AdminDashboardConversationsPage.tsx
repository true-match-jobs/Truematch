import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { RelativeTime } from '../../components/ui/RelativeTime';
import { useAuth } from '../../hooks/useAuth';
import { chatService, type AdminConversation } from '../../services/chat.service';
import { useChatNotificationStore } from '../../store/chat-notification.store';
import { buildInitialAvatarUrl } from '../../utils/avatar';

export const AdminDashboardConversationsPage = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<AdminConversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
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

        setConversations(nextConversations);
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

    void loadConversations(true);
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

  return (
    <section className="flex h-full min-h-0 flex-col pt-5 pb-3">
      <h2 className="px-3 text-xl font-semibold tracking-tight text-zinc-100">Conversations</h2>

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
                    {conversation.unreadMessageCount > 0 ? (
                      <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-semibold leading-none text-white">
                        {conversation.unreadMessageCount > 99 ? '99+' : conversation.unreadMessageCount}
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-0.5 flex items-center gap-2">
                    <p className="min-w-0 flex-1 truncate text-xs text-zinc-400">{previewText}</p>
                    <RelativeTime value={conversation.lastMessageAt} className="shrink-0 text-xs text-zinc-400" />
                  </div>
                </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
};
