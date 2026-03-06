import { useEffect, useState } from 'react';
import { Bell, ChatCircle, FileText, HouseLine, Plus, SignOut, UserCircle, Wallet } from '@phosphor-icons/react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Navbar } from '../../components/layout/Navbar';
import { useAuth } from '../../hooks/useAuth';
import { useChatNotificationStore } from '../../store/chat-notification.store';
import { useViewportHeight } from '../../hooks/useViewportHeight';
import { notificationService } from '../../services/notification.service';
import { chatService } from '../../services/chat.service';

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
    <div className="flex flex-col overflow-hidden bg-dark-bg" style={{ height: 'calc(var(--vh, 1vh) * 100)' }}>
      <Navbar />

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <aside className="relative z-20 flex w-fit flex-col items-center border-r-2 border-white/10 bg-dark-card px-0 pt-4 pb-4">
          <nav className="flex flex-col items-center gap-1">
          <NavLink
            to="/dashboard"
            end
            className={({ isActive }) =>
              `group relative flex items-center justify-center border-l-4 p-3 transition-colors ${
                isActive
                  ? 'rounded-none border-brand-500 text-white'
                  : 'rounded-lg border-transparent text-zinc-500 hover:text-zinc-200'
              }`
            }
            aria-label="Home"
          >
            <HouseLine size={28} weight="regular" />
          </NavLink>

          <NavLink
            to="/dashboard/applications"
            className={({ isActive }) =>
              `group relative flex items-center justify-center border-l-4 p-3 transition-colors ${
                isActive
                  ? 'rounded-none border-brand-500 text-white'
                  : 'rounded-lg border-transparent text-zinc-500 hover:text-zinc-200'
              }`
            }
            aria-label="My applications"
          >
            <FileText size={28} weight="regular" />
          </NavLink>

          <NavLink
            to="/dashboard/chat"
            className={({ isActive }) =>
              `group relative flex items-center justify-center border-l-4 p-3 transition-colors ${
                isActive
                  ? 'rounded-none border-brand-500 text-white'
                  : 'rounded-lg border-transparent text-zinc-500 hover:text-zinc-200'
              }`
            }
            aria-label="Chat"
          >
            <ChatCircle size={28} weight="regular" />
            {unreadMessageCount > 0 ? (
              <span className="absolute right-2 top-2 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold leading-none text-white">
                {unreadMessageCount > 99 ? '99+' : unreadMessageCount}
              </span>
            ) : null}
          </NavLink>

          <NavLink
            to="/dashboard/wallet"
            className={({ isActive }) =>
              `group relative flex items-center justify-center border-l-4 p-3 transition-colors ${
                isActive
                  ? 'rounded-none border-brand-500 text-white'
                  : 'rounded-lg border-transparent text-zinc-500 hover:text-zinc-200'
              }`
            }
            aria-label="MyWallet"
          >
            <Wallet size={28} weight="regular" />
          </NavLink>

          <NavLink
            to="/dashboard/notifications"
            className={({ isActive }) =>
              `group relative flex items-center justify-center border-l-4 p-3 transition-colors ${
                isActive
                  ? 'rounded-none border-brand-500 text-white'
                  : 'rounded-lg border-transparent text-zinc-500 hover:text-zinc-200'
              }`
            }
            aria-label="Notifications"
          >
            <Bell size={28} weight="regular" />
            {unreadNotificationCount > 0 ? (
              <span className="absolute right-2 top-2 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold leading-none text-white">
                {unreadNotificationCount > 99 ? '99+' : unreadNotificationCount}
              </span>
            ) : null}
          </NavLink>

          <NavLink
            to="/apply"
            className="group relative flex items-center justify-center rounded-lg border-l-4 border-transparent p-3 text-white transition-colors hover:text-white"
            aria-label="Apply"
          >
            <Plus size={28} weight="regular" />
          </NavLink>
          </nav>

          <div className="mb-4 mt-auto flex flex-col items-center gap-1">
            <NavLink
              to="/dashboard/profile"
              className={({ isActive }) =>
                    `group relative flex items-center justify-center border-l-4 p-3 transition-colors ${
                  isActive
                      ? 'rounded-none border-brand-500 text-white'
                      : 'rounded-lg border-transparent text-zinc-500 hover:text-zinc-200'
                }`
              }
              aria-label="Profile"
            >
              <UserCircle size={28} weight="regular" />
            </NavLink>

            <button
              onClick={handleLogout}
              className="mt-10 rounded-lg p-3 text-red-500 transition-colors hover:text-red-400"
              aria-label="Logout"
            >
              <SignOut size={28} weight="regular" />
            </button>
          </div>
        </aside>

        <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <section className="h-full w-full">
            <Outlet />
          </section>
        </main>
      </div>
    </div>
  );
};
