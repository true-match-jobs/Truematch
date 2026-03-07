import { useEffect } from 'react';
import { useChatNotificationStore } from '../../store/chat-notification.store';
import type { User } from '../../types/user';

type ProtectedSocketConnectorProps = {
  user: User | null;
  isAuthenticated: boolean;
};

export const ProtectedSocketConnector = ({ user, isAuthenticated }: ProtectedSocketConnectorProps) => {
  const connectNotifications = useChatNotificationStore((state) => state.connect);
  const disconnectNotifications = useChatNotificationStore((state) => state.disconnect);

  useEffect(() => {
    if (!isAuthenticated || !user?.id || !user.role || !user.email) {
      return;
    }

    connectNotifications(user);

    return () => {
      disconnectNotifications();
    };
  }, [
    connectNotifications,
    disconnectNotifications,
    isAuthenticated,
    user?.email,
    user?.fullName,
    user?.hasVisitedDashboard,
    user?.id,
    user?.role
  ]);

  return null;
};
