import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { chatService, type AdminConversation } from '../../services/chat.service';

export const AdminDashboardConversationsPage = () => {
  const [conversations, setConversations] = useState<AdminConversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const timestampFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(undefined, {
        hour: 'numeric',
        minute: '2-digit'
      }),
    []
  );

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

  const formatTimestamp = (value: string) => {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return '';
    }

    return timestampFormatter.format(date);
  };

  return (
    <section className="flex h-full min-h-0 flex-col px-3 pt-5 pb-3">
      <h2 className="text-base font-semibold text-zinc-100">Conversations</h2>

      <div className="mt-4 min-h-0 flex-1 overflow-y-auto">
        {isLoading ? <LoadingSpinner className="py-10" /> : null}
        {!isLoading && errorMessage ? <p className="px-3 py-2 text-sm text-rose-400">{errorMessage}</p> : null}
        {!isLoading && !errorMessage && !conversations.length ? (
          <p className="px-3 py-2 text-sm text-zinc-400">No conversations yet.</p>
        ) : null}

        <ul>
          {conversations.map((conversation) => (
            <li key={conversation.user.id}>
              <Link
                to={`/admin/dashboard/chat/${conversation.user.id}`}
                className="flex items-center gap-3 px-3 py-3 transition-colors hover:bg-white/5"
              >
                <img
                  src={`https://api.dicebear.com/9.x/avataaars/svg?seed=${conversation.user.id}`}
                  alt={`${conversation.user.fullName} avatar`}
                  className="h-11 w-11 rounded-full bg-dark-surface"
                />

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
                    <p className="min-w-0 flex-1 truncate text-xs text-zinc-400">{conversation.lastMessagePreview}</p>
                    <time className="shrink-0 text-xs text-zinc-400">{formatTimestamp(conversation.lastMessageAt)}</time>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};
