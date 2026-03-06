import { X } from '@phosphor-icons/react';
import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { SNACKBAR_AUTO_DISMISS_DELAY_MS } from '../../constants/snackbar';
import { EmptyState } from '../../components/ui/EmptyState';
import { RelativeTime } from '../../components/ui/RelativeTime';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { Snackbar } from '../../components/ui/Snackbar';
import { useAuth } from '../../hooks/useAuth';
import { chatService } from '../../services/chat.service';
import { notificationService, type NotificationItem } from '../../services/notification.service';
import { buildInitialAvatarUrl, buildSystemAvatarUrl } from '../../utils/avatar';

const USER_NOTIFICATIONS_CACHE_TTL_MS = 60_000;

let userNotificationsCache: {
  notifications: NotificationItem[];
  cachedAt: number;
} | null = null;

const getCachedUserNotifications = (): NotificationItem[] | null => {
  if (!userNotificationsCache) {
    return null;
  }

  const isFresh = Date.now() - userNotificationsCache.cachedAt < USER_NOTIFICATIONS_CACHE_TTL_MS;

  return isFresh ? userNotificationsCache.notifications : null;
};

const setCachedUserNotifications = (notifications: NotificationItem[]): void => {
  userNotificationsCache = {
    notifications,
    cachedAt: Date.now()
  };
};

export const UserNotificationsPage = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => getCachedUserNotifications() ?? []);
  const [isLoading, setIsLoading] = useState(() => !getCachedUserNotifications());
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isClearing, setIsClearing] = useState(false);
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [clearErrorMessage, setClearErrorMessage] = useState<string | null>(null);
  const [showClearSuccessSnackbar, setShowClearSuccessSnackbar] = useState(false);

  const handleClearAll = async () => {
    if (!notifications.length || isClearing) {
      return;
    }

    setIsClearing(true);
    setClearErrorMessage(null);

    try {
      await notificationService.clearAll();
      setNotifications([]);
      setCachedUserNotifications([]);
      setErrorMessage(null);
      setIsClearModalOpen(false);
      setShowClearSuccessSnackbar(true);
    } catch (_error) {
      setErrorMessage('Unable to clear notifications right now.');
      setClearErrorMessage('Unable to clear notifications right now.');
    } finally {
      setIsClearing(false);
    }
  };

  if (user?.role !== 'USER') {
    return <Navigate to="/admin/dashboard" replace />;
  }

  useEffect(() => {
    let isCancelled = false;

    const loadNotifications = async (showLoading = false) => {
      if (showLoading) {
        setIsLoading(true);
      }

      setErrorMessage(null);

      try {
        const nextNotifications = await notificationService.getMine();

        if (isCancelled) {
          return;
        }

        setCachedUserNotifications(nextNotifications);
        setNotifications(nextNotifications);
      } catch (_error) {
        if (isCancelled) {
          return;
        }

        setNotifications([]);
        setErrorMessage('Unable to load notifications right now.');
      } finally {
        if (!isCancelled) {
          if (showLoading) {
            setIsLoading(false);
          }
        }
      }
    };

    void loadNotifications(!getCachedUserNotifications());

    return () => {
      isCancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!showClearSuccessSnackbar) {
      return;
    }

    const timer = window.setTimeout(() => {
      setShowClearSuccessSnackbar(false);
    }, SNACKBAR_AUTO_DISMISS_DELAY_MS);

    return () => {
      window.clearTimeout(timer);
    };
  }, [showClearSuccessSnackbar]);

  useEffect(() => {
    let isCancelled = false;
    let socket: WebSocket | null = null;

    const connectSocket = async () => {
      try {
        socket = await chatService.createSocket();

        if (isCancelled) {
          socket.close();
          return;
        }

        socket.onmessage = (event) => {
          try {
            const payload = JSON.parse(event.data as string) as {
              type?: string;
              notification?: NotificationItem;
            };

            if (payload.type !== 'notification' || !payload.notification) {
              return;
            }

            const incomingNotification = payload.notification;

            setNotifications((currentNotifications) => {
              if (currentNotifications.some((item) => item.id === incomingNotification.id)) {
                return currentNotifications;
              }

              const nextNotifications = [incomingNotification, ...currentNotifications];
              setCachedUserNotifications(nextNotifications);

              return nextNotifications;
            });
          } catch (_error) {
            return;
          }
        };
      } catch (_error) {
        return;
      }
    };

    void connectSocket();

    return () => {
      isCancelled = true;
      socket?.close();
    };
  }, []);

  return (
    <div className="flex h-full min-h-0 flex-col bg-dark-bg">

      <main className="flex-1 min-h-0 overflow-y-auto pt-5 pb-[calc(7rem+env(safe-area-inset-bottom))]">
        <div className="flex items-center justify-between px-3">
          <h2 className="text-xl font-semibold tracking-tight text-zinc-100">Notifications</h2>
          <button
            type="button"
            onClick={() => {
              setClearErrorMessage(null);
              setIsClearModalOpen(true);
            }}
            disabled={isLoading || isClearing || notifications.length === 0}
            className="text-sm font-medium text-red-400 transition-colors hover:text-red-300 disabled:cursor-not-allowed disabled:text-zinc-500"
          >
            Clear all
          </button>
        </div>

        {isLoading ? (
          <div className="mt-4 flex min-h-[60vh] items-center justify-center">
            <LoadingSpinner />
          </div>
        ) : null}
        {!isLoading && errorMessage ? <p className="mt-4 text-sm text-rose-400">{errorMessage}</p> : null}
        {!isLoading && !errorMessage && !notifications.length ? (
          <div className="mt-4 flex min-h-[60vh] items-center justify-center">
            <EmptyState title="No notifications" description="No notifications yet." className="text-left" />
          </div>
        ) : null}

        {!isLoading && !errorMessage && notifications.length ? (
          <div className="mt-4 max-w-4xl divide-y divide-white/10 pb-10">
            {notifications.map((notification) => {
              const senderFullName = notification.sender?.fullName ?? 'System';
              const senderAvatarUrl = notification.sender
                ? notification.sender.profilePhotoUrl ??
                  buildInitialAvatarUrl({
                    fullName: notification.sender.fullName,
                    email: notification.sender.email,
                    id: notification.sender.id,
                    fallback: 'Admin',
                    size: 40
                  })
                : buildInitialAvatarUrl({
                    fullName: 'System',
                    email: 'system@truematch.local',
                    id: 'system',
                    fallback: 'System',
                    size: 40
                  });

              const resolvedSenderAvatarUrl = notification.messageType === 'SYSTEM_MESSAGE' ? buildSystemAvatarUrl(40) : senderAvatarUrl;
              const isUnread = !notification.readAt;

              return (
                <article key={notification.id}>
                  <Link
                    to={`/notifications/${notification.id}`}
                      className={`block px-3 py-4 transition-colors hover:bg-white/5 ${
                        isUnread ? 'bg-dark-card' : ''
                      }`}
                  >
                    <div className="grid grid-cols-[2.5rem_1fr] grid-rows-2 gap-x-3">
                      <img
                        src={resolvedSenderAvatarUrl}
                        alt={`${senderFullName} avatar`}
                        className="h-10 w-10 rounded-full bg-dark-surface row-span-2"
                      />
                      <div className="flex items-center">
                        <p className="text-sm font-semibold text-zinc-100 mr-2">{senderFullName}</p>
                        <RelativeTime value={notification.createdAt} className="text-xs text-zinc-400" />
                      </div>
                      <div className="col-start-2 row-start-2">
                        <p className="mt-1 text-sm text-zinc-300 whitespace-break-spaces break-words [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical] overflow-hidden">
                          {notification.message}
                        </p>
                      </div>
                    </div>
                  </Link>
                </article>
              );
            })}
          </div>
        ) : null}
      </main>

      {isClearModalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="clear-notifications-title"
          onClick={() => {
            if (!isClearing) {
              setIsClearModalOpen(false);
            }
          }}
        >
          <div
            className="w-full max-w-md rounded-xl border border-white/10 bg-dark-card p-5 shadow-lg sm:p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <h3 id="clear-notifications-title" className="text-base font-semibold text-zinc-100">
                Clear notifications?
              </h3>
              <button
                type="button"
                onClick={() => setIsClearModalOpen(false)}
                disabled={isClearing}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-zinc-400 transition-colors hover:text-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 disabled:cursor-not-allowed"
                aria-label="Close clear notifications confirmation"
              >
                <X size={14} weight="bold" />
              </button>
            </div>

            <p className="mt-3 text-sm text-zinc-300">
              Are you sure you want to clear all notifications? This action cannot be undone.
            </p>

            {clearErrorMessage ? <p className="mt-3 text-sm text-rose-400">{clearErrorMessage}</p> : null}

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsClearModalOpen(false)}
                disabled={isClearing}
                className="rounded-md border border-white/10 px-3 py-2 text-sm font-medium text-zinc-200 transition-colors hover:border-white/20 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleClearAll()}
                disabled={isClearing}
                className="rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-red-500 disabled:cursor-not-allowed"
              >
                {isClearing ? 'Clearing...' : 'Clear all'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <Snackbar
        message="Notifications cleared successfully"
        visible={showClearSuccessSnackbar}
        position="bottom-center"
      />
    </div>
  );
};
