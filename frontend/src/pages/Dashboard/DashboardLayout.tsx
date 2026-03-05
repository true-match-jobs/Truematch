import { useEffect, useMemo, useState } from 'react';
import { Bell, ChatCircle, FileText, HouseLine, Plus, SignOut, Wallet } from '@phosphor-icons/react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChatHeader } from '../../components/chat/ChatHeader';
import { useAuth } from '../../hooks/useAuth';
import { useChatNotificationStore } from '../../store/chat-notification.store';
import { useViewportHeight } from '../../hooks/useViewportHeight';
import { notificationService } from '../../services/notification.service';
import { chatService } from '../../services/chat.service';
import { buildInitialAvatarUrl } from '../../utils/avatar';

export const DashboardLayout = () => {
  useViewportHeight();
  const { logout, user } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const isChatRoute = pathname.startsWith('/dashboard/chat');
  const isDashboardHomeRoute = pathname === '/dashboard';
  const activePeerUserId = pathname.startsWith('/dashboard/chat/') ? pathname.replace('/dashboard/chat/', '').split('/')[0] || null : null;
  const unreadMessageCount = useChatNotificationStore((state) => state.unreadUserMessageCount);
  const connectNotifications = useChatNotificationStore((state) => state.connect);
  const disconnectNotifications = useChatNotificationStore((state) => state.disconnect);
  const setNotificationContext = useChatNotificationStore((state) => state.setContext);
  const clearUserUnread = useChatNotificationStore((state) => state.clearUserUnread);
  const resetNotifications = useChatNotificationStore((state) => state.reset);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [showHomeWelcomeMessage, setShowHomeWelcomeMessage] = useState(false);
  const [homeWelcomeMessageText, setHomeWelcomeMessageText] = useState('');
  const [isHomeWelcomeReady, setIsHomeWelcomeReady] = useState(!isDashboardHomeRoute);

  const userFirstName = user?.fullName?.trim().split(/\s+/)[0] ?? 'Applicant';

  const userAvatarUrl = useMemo(
    () =>
      buildInitialAvatarUrl({
        fullName: user?.fullName,
        email: user?.email,
        id: user?.id,
        fallback: 'Dashboard',
        size: 36
      }),
    [user?.email, user?.fullName, user?.id]
  );

  useEffect(() => {
    if (!user || user.role !== 'USER') {
      return;
    }

    connectNotifications(user);

    return () => {
      disconnectNotifications();
    };
  }, [connectNotifications, disconnectNotifications, user]);

  useEffect(() => {
    setNotificationContext({
      isOnChatTab: isChatRoute,
      activePeerUserId
    });
  }, [activePeerUserId, isChatRoute, setNotificationContext]);

  useEffect(() => {
    if (activePeerUserId) {
      clearUserUnread();
    }
  }, [activePeerUserId, clearUserUnread]);

  useEffect(() => {
    if (user?.role !== 'USER') {
      setUnreadNotificationCount(0);
      return;
    }

    let isCancelled = false;

    const loadUnreadCount = async () => {
      try {
        const count = await notificationService.getMyUnreadCount();

        if (isCancelled) {
          return;
        }

        setUnreadNotificationCount(count);
      } catch (_error) {
        if (!isCancelled) {
          setUnreadNotificationCount(0);
        }
      }
    };

    void loadUnreadCount();

    return () => {
      isCancelled = true;
    };
  }, [user?.role]);

  useEffect(() => {
    // Removed logic that clears notification badge when visiting notification tab
    // Badge should only clear when a notification is opened
  }, [pathname, user?.role]);

  useEffect(() => {
    if (user?.role !== 'USER') {
      return;
    }

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
            const payload = JSON.parse(event.data as string) as { type?: string };

            if (payload.type !== 'notification' || pathname === '/dashboard/notifications') {
              return;
            }

            setUnreadNotificationCount((currentCount) => currentCount + 1);
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
  }, [pathname, user?.role]);

  useEffect(() => {
    if (!isDashboardHomeRoute) {
      setShowHomeWelcomeMessage(false);
      setIsHomeWelcomeReady(true);
      return;
    }

    if (typeof window === 'undefined' || !user?.id || user.role !== 'USER') {
      setShowHomeWelcomeMessage(false);
      setIsHomeWelcomeReady(true);
      return;
    }

    setIsHomeWelcomeReady(false);

    const today = new Date();
    const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const seenTodayKey = `truematch.dashboard.welcome.seen.${user.id}.${todayKey}`;
    const firstEverKey = `truematch.dashboard.welcome.first-ever.${user.id}`;
    const hasSeenToday = window.localStorage.getItem(seenTodayKey) === '1';
    const hasSeenFirstEver = window.localStorage.getItem(firstEverKey) === '1';

    if (hasSeenToday) {
      setShowHomeWelcomeMessage(false);
      setIsHomeWelcomeReady(true);
      return;
    }

    setHomeWelcomeMessageText(hasSeenFirstEver ? `Welcome back, ${userFirstName}!` : `Welcome, ${userFirstName}!`);
    setShowHomeWelcomeMessage(true);
    window.localStorage.setItem(seenTodayKey, '1');

    if (!hasSeenFirstEver) {
      window.localStorage.setItem(firstEverKey, '1');
    }

    setIsHomeWelcomeReady(true);

    const timer = window.setTimeout(() => {
      setShowHomeWelcomeMessage(false);
    }, 3200);

    return () => {
      window.clearTimeout(timer);
    };
  }, [isDashboardHomeRoute, user?.id, user?.role, userFirstName]);

  const handleLogout = async () => {
    await logout();
    resetNotifications();
    navigate('/login', { replace: true });
  };

  return (
    <div className="flex overflow-hidden bg-dark-bg" style={{ height: 'calc(var(--vh, 1vh) * 100)' }}>
      <aside className="relative z-20 flex w-fit flex-col items-center border-r-2 border-white/10 bg-dark-card px-0 pt-2 pb-4">
        <nav className="flex flex-col items-center gap-1">
          <Link
            to="/"
            className="group relative mb-4 flex items-center justify-center rounded-lg border-l-2 border-transparent p-3 transition-colors hover:bg-white/5"
            aria-label="Truematch homepage"
          >
            <img src="/logos/logo-tm.png" alt="Truematch logo" className="size-10 object-contain" />
          </Link>

          <NavLink
            to="/dashboard"
            end
            className={({ isActive }) =>
              `group relative flex items-center justify-center rounded-lg border-l-2 p-3 transition-colors ${
                isActive
                  ? 'border-brand-500 bg-white/5 text-white'
                  : 'border-transparent text-zinc-500 hover:text-zinc-200'
              }`
            }
            aria-label="Home"
          >
            <HouseLine size={26} weight="regular" />
          </NavLink>

          <NavLink
            to="/dashboard/applications"
            className={({ isActive }) =>
              `group relative flex items-center justify-center rounded-lg border-l-2 p-3 transition-colors ${
                isActive
                  ? 'border-brand-500 bg-white/5 text-white'
                  : 'border-transparent text-zinc-500 hover:text-zinc-200'
              }`
            }
            aria-label="My applications"
          >
            <FileText size={26} weight="regular" />
          </NavLink>

          <NavLink
            to="/dashboard/chat"
            className={({ isActive }) =>
              `group relative flex items-center justify-center rounded-lg border-l-2 p-3 transition-colors ${
                isActive
                  ? 'border-brand-500 bg-white/5 text-white'
                  : 'border-transparent text-zinc-500 hover:text-zinc-200'
              }`
            }
            aria-label="Chat"
          >
            <ChatCircle size={26} weight="regular" />
            {unreadMessageCount > 0 ? (
              <span className="absolute right-2 top-2 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold leading-none text-white">
                {unreadMessageCount > 99 ? '99+' : unreadMessageCount}
              </span>
            ) : null}
          </NavLink>

          <NavLink
            to="/dashboard/wallet"
            className={({ isActive }) =>
              `group relative flex items-center justify-center rounded-lg border-l-2 p-3 transition-colors ${
                isActive
                  ? 'border-brand-500 bg-white/5 text-white'
                  : 'border-transparent text-zinc-500 hover:text-zinc-200'
              }`
            }
            aria-label="MyWallet"
          >
            <Wallet size={26} weight="regular" />
          </NavLink>

          <NavLink
            to="/dashboard/notifications"
            className={({ isActive }) =>
              `group relative flex items-center justify-center rounded-lg border-l-2 p-3 transition-colors ${
                isActive
                  ? 'border-brand-500 bg-white/5 text-white'
                  : 'border-transparent text-zinc-500 hover:text-zinc-200'
              }`
            }
            aria-label="Notifications"
          >
            <Bell size={26} weight="regular" />
            {unreadNotificationCount > 0 ? (
              <span className="absolute right-2 top-2 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold leading-none text-white">
                {unreadNotificationCount > 99 ? '99+' : unreadNotificationCount}
              </span>
            ) : null}
          </NavLink>

          <NavLink
            to="/apply"
            className="group relative flex items-center justify-center rounded-lg border-l-2 border-transparent p-3 text-white transition-colors hover:text-white"
            aria-label="Apply"
          >
            <Plus size={26} weight="regular" />
          </NavLink>
        </nav>

        <div className="mb-8 mt-auto flex flex-col items-center gap-1">
          <button
            onClick={handleLogout}
            className="mt-10 rounded-lg p-3 text-red-500 transition-colors hover:text-red-400"
            aria-label="Logout"
          >
            <SignOut size={26} weight="regular" />
          </button>
        </div>
      </aside>

      <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <ChatHeader
          avatarUrl={userAvatarUrl}
          avatarAlt={`${user?.fullName ?? 'User'} avatar`}
          title={isChatRoute ? "Chat" : isDashboardHomeRoute ? userFirstName : "Dashboard"}
          isOnline
          showIdentityText={false}
          avatarAlign="right"
          onAvatarClick={() => navigate('/dashboard/profile')}
          // Ensure avatar size consistency
          // The ChatHeader component uses h-10 w-10 for avatar by default
        />

        <section className="h-full w-full">
          <Outlet />
        </section>
      </main>
    </div>
  );
};
