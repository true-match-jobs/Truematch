import { useEffect, useState } from 'react';
import { Bell, ChatCircle, FileText, HouseLine, Plus, SignOut, UserCircle, Wallet } from '@phosphor-icons/react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Navbar } from '../../components/layout/Navbar';
import { useAuth } from '../../hooks/useAuth';
import { useChatNotificationStore } from '../../store/chat-notification.store';
import { useViewportHeight } from '../../hooks/useViewportHeight';
import { notificationService } from '../../services/notification.service';
import { chatService } from '../../services/chat.service';

const HOME_WELCOME_REVEAL_DELAY_MS = 1250;
const HOME_WELCOME_REVEAL_DURATION_S = 1.15;
const HOME_WELCOME_VISIBLE_MS = 5_000;
const HOME_WELCOME_HIDE_DURATION_S = 0.7;

export const DashboardLayout = () => {
  useViewportHeight();
  const { logout, user } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const isChatRoute = pathname.startsWith('/dashboard/chat');
  const isDashboardHomeRoute = pathname === '/dashboard';
  const activePeerUserId = pathname.startsWith('/dashboard/chat/') ? pathname.replace('/dashboard/chat/', '').split('/')[0] || null : null;
  const unreadMessageCount = useChatNotificationStore((state) => state.unreadUserMessageCount);
  const setNotificationContext = useChatNotificationStore((state) => state.setContext);
  const clearUserUnread = useChatNotificationStore((state) => state.clearUserUnread);
  const hydrateUnreadSummary = useChatNotificationStore((state) => state.hydrateUnreadSummary);
  const resetNotifications = useChatNotificationStore((state) => state.reset);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [homeWelcomeMessageText, setHomeWelcomeMessageText] = useState('');
  const [isHomeWelcomeReady, setIsHomeWelcomeReady] = useState(false);

  const userFirstName = user?.fullName?.trim().split(/\s+/)[0] ?? 'Applicant';

  useEffect(() => {
    if (user?.role !== 'USER') {
      return;
    }

    void hydrateUnreadSummary();
  }, [hydrateUnreadSummary, pathname, user?.role]);

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
    if (!isDashboardHomeRoute || user?.role !== 'USER' || !user.id) {
      setHomeWelcomeMessageText('');
      setIsHomeWelcomeReady(false);
      return;
    }

    const today = new Date();
    const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const seenTodayKey = `truematch.dashboard.welcome.seen.${user.id}.${todayKey}`;
    const hasSeenToday = window.localStorage.getItem(seenTodayKey) === '1';

    if (hasSeenToday) {
      setHomeWelcomeMessageText('');
      setIsHomeWelcomeReady(false);
      return;
    }

    setHomeWelcomeMessageText(user.hasVisitedDashboard ? `Welcome back, ${userFirstName}!` : `Welcome, ${userFirstName}!`);
    window.localStorage.setItem(seenTodayKey, '1');
    setIsHomeWelcomeReady(false);

    // Delay reveal until the page has rendered, then reveal gradually.
    let firstFrameId = 0;
    let secondFrameId = 0;
    let revealTimerId: number | null = null;
    let hideTimerId: number | null = null;

    firstFrameId = window.requestAnimationFrame(() => {
      secondFrameId = window.requestAnimationFrame(() => {
        revealTimerId = window.setTimeout(() => {
          setIsHomeWelcomeReady(true);

          hideTimerId = window.setTimeout(() => {
            setIsHomeWelcomeReady(false);
          }, HOME_WELCOME_VISIBLE_MS);
        }, HOME_WELCOME_REVEAL_DELAY_MS);
      });
    });

    return () => {
      window.cancelAnimationFrame(firstFrameId);
      window.cancelAnimationFrame(secondFrameId);

      if (revealTimerId !== null) {
        window.clearTimeout(revealTimerId);
      }

      if (hideTimerId !== null) {
        window.clearTimeout(hideTimerId);
      }
    };
  }, [isDashboardHomeRoute, user?.hasVisitedDashboard, user?.id, user?.role, userFirstName]);

  const homeWelcomeMessage = (
    <AnimatePresence>
      {isDashboardHomeRoute && isHomeWelcomeReady && homeWelcomeMessageText ? (
        <motion.div
          key={homeWelcomeMessageText}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{
            opacity: 0,
            y: -8,
            transition: {
              duration: HOME_WELCOME_HIDE_DURATION_S,
              ease: [0.4, 0, 0.2, 1]
            }
          }}
          transition={{
            opacity: { duration: HOME_WELCOME_REVEAL_DURATION_S, ease: [0.16, 1, 0.3, 1] },
            y: { duration: HOME_WELCOME_REVEAL_DURATION_S, ease: [0.16, 1, 0.3, 1] }
          }}
          className="truncate"
        >
          <p className="truncate text-sm font-medium text-zinc-100">{homeWelcomeMessageText}</p>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );

  const handleLogout = async () => {
    await logout();
    resetNotifications();
    navigate('/login', { replace: true });
  };

  return (
    <div className="flex flex-col overflow-hidden bg-dark-bg" style={{ height: 'calc(var(--vh, 1vh) * 100)' }}>
      <Navbar centerContent={homeWelcomeMessage} />

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
                <span className="absolute right-2 top-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-600 px-1.5 text-[10px] font-semibold leading-none text-white">
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
                <span className="absolute right-2 top-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-600 px-1.5 text-[10px] font-semibold leading-none text-white">
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
              className="rounded-lg p-3 text-red-500 transition-colors hover:text-red-400"
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
