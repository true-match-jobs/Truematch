import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { EmptyState } from '../../components/ui/EmptyState';
import { RelativeTime } from '../../components/ui/RelativeTime';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { useAuth } from '../../hooks/useAuth';
import { chatService } from '../../services/chat.service';
import { notificationService, type NotificationItem } from '../../services/notification.service';
import { buildInitialAvatarUrl, buildSystemAvatarUrl } from '../../utils/avatar';

export const UserNotificationsPage = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isClearing, setIsClearing] = useState(false);
  const handleClearAll = async () => {
    setIsClearing(true);
    try {
      await notificationService.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() })));
    } finally {
      setIsClearing(false);
    }
  };

  if (user?.role !== 'USER') {
    return <Navigate to="/admin/dashboard" replace />;
  }

  useEffect(() => {
    let isCancelled = false;

    const loadNotifications = async () => {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const nextNotifications = await notificationService.getMine();

        if (isCancelled) {
          return;
        }

        setNotifications(nextNotifications);
      } catch (_error) {
        if (isCancelled) {
          return;
        }

        setNotifications([]);
        setErrorMessage('Unable to load notifications right now.');
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadNotifications();

    return () => {
      isCancelled = true;
    };
  }, []);

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

              return [incomingNotification, ...currentNotifications];
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
    </div>
  );
};
