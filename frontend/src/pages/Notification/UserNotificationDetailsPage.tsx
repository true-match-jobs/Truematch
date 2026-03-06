import { useEffect, useMemo, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { Breadcrumbs } from '../../components/ui/Breadcrumbs';
import { EmptyState } from '../../components/ui/EmptyState';
import { RelativeTime } from '../../components/ui/RelativeTime';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { Footer } from '../../components/layout/Footer';
import { Navbar } from '../../components/layout/Navbar';
import { useAuth } from '../../hooks/useAuth';
import { notificationService, type NotificationItem } from '../../services/notification.service';
import { buildInitialAvatarUrl, buildSystemAvatarUrl } from '../../utils/avatar';

export const UserNotificationDetailsPage = () => {
  const { user } = useAuth();
  const { notificationId } = useParams<{ notificationId: string }>();
  const [notification, setNotification] = useState<NotificationItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (user?.role !== 'USER') {
    return <Navigate to="/admin/dashboard" replace />;
  }

  useEffect(() => {
    let isCancelled = false;

    const loadNotification = async () => {
      if (!notificationId) {
        setErrorMessage('Notification ID is required.');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setErrorMessage(null);

      try {
        const notifications = await notificationService.getMine();
        await notificationService.markRead(notificationId);

        if (isCancelled) {
          return;
        }

        const matchedNotification = notifications.find((item) => item.id === notificationId) ?? null;
        setNotification(
          matchedNotification
            ? {
                ...matchedNotification,
                readAt: matchedNotification.readAt ?? new Date().toISOString()
              }
            : null
        );
      } catch (_error) {
        if (isCancelled) {
          return;
        }

        setNotification(null);
        setErrorMessage('Unable to load this notification right now.');
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadNotification();

    return () => {
      isCancelled = true;
    };
  }, [notificationId]);

  const notificationMeta = useMemo(() => {
    if (!notification) {
      return null;
    }

    const senderFullName = notification.sender?.fullName ?? 'System';
    const senderAvatarUrl = notification.sender
      ? notification.sender.profilePhotoUrl ??
        buildInitialAvatarUrl({
          fullName: notification.sender.fullName,
          email: notification.sender.email,
          id: notification.sender.id,
          fallback: 'Admin',
          size: 44
        })
      : buildInitialAvatarUrl({
          fullName: 'System',
          email: 'system@truematch.local',
          id: 'system',
          fallback: 'System',
          size: 44
        });

    return {
      senderFullName,
      senderAvatarUrl:
        notification.messageType === 'SYSTEM_MESSAGE'
          ? buildSystemAvatarUrl(44)
          : senderAvatarUrl
    };
  }, [notification]);

  return (
    <div className="flex min-h-screen flex-col bg-dark-bg">
      <Navbar />

      <main className="flex-1 px-4 py-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <Breadcrumbs
            items={[
              { label: 'Dashboard', href: '/dashboard' },
              { label: 'Notifications', href: '/dashboard/notifications' },
              { label: 'Details' }
            ]}
          />

          {isLoading ? (
            <div className="mt-6 flex min-h-[60vh] items-center justify-center">
              <LoadingSpinner />
            </div>
          ) : null}

          {!isLoading && errorMessage ? <p className="mt-6 text-sm text-rose-400">{errorMessage}</p> : null}

          {!isLoading && !errorMessage && !notification ? (
            <div className="mt-6 rounded-xl border border-white/10 bg-dark-card p-6">
              <EmptyState title="Notification not found" description="This notification could not be located." className="text-left" />
            </div>
          ) : null}

          {!isLoading && !errorMessage && notification && notificationMeta ? (
            <article className="mt-4 p-2 sm:p-3">
              <div>
                {/* Row 1: avatar, name, timestamp */}
                <div className="flex items-center gap-3">
                  <img
                    src={notificationMeta.senderAvatarUrl}
                    alt={`${notificationMeta.senderFullName} avatar`}
                    className="h-11 w-11 rounded-full bg-dark-surface"
                  />
                  <p className="text-sm font-semibold text-zinc-100 mr-2">{notificationMeta.senderFullName}</p>
                  <RelativeTime value={notification.createdAt} className="text-xs text-zinc-400" />
                </div>
                {/* Row 2: message */}
                <p className="mt-2 text-base text-zinc-300 whitespace-break-spaces break-words">
                  {notification.message}
                </p>
              </div>
            </article>
          ) : null}
        </div>
      </main>

      <Footer />
    </div>
  );
};
