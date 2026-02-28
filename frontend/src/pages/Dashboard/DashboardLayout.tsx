import { useEffect } from 'react';
import { CaretRight, ChatCircle, Scroll, SignOut, SquaresFour, UserCircle } from '@phosphor-icons/react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useChatNotificationStore } from '../../store/chat-notification.store';
import { useViewportHeight } from '../../hooks/useViewportHeight';

export const DashboardLayout = () => {
  useViewportHeight();
  const { logout, user } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const isApplicationsRoute = pathname.startsWith('/dashboard/applications');
  const isChatRoute = pathname.startsWith('/dashboard/chat');
  const isProfileRoute = pathname.startsWith('/dashboard/profile');
  const unreadMessageCount = useChatNotificationStore((state) => state.unreadUserMessageCount);
  const connectNotifications = useChatNotificationStore((state) => state.connect);
  const disconnectNotifications = useChatNotificationStore((state) => state.disconnect);
  const setNotificationContext = useChatNotificationStore((state) => state.setContext);
  const clearUserUnread = useChatNotificationStore((state) => state.clearUserUnread);
  const resetNotifications = useChatNotificationStore((state) => state.reset);

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
      activePeerUserId: null
    });
  }, [isChatRoute, setNotificationContext]);

  useEffect(() => {
    if (isChatRoute) {
      clearUserUnread();
    }
  }, [clearUserUnread, isChatRoute]);

  const handleLogout = async () => {
    await logout();
    resetNotifications();
    navigate('/login', { replace: true });
  };

  return (
    <div className="flex flex-col overflow-hidden bg-dark-bg" style={{ height: 'calc(var(--vh, 1vh) * 100)' }}>
      <nav aria-label="Breadcrumb" className="border-b border-white/10 px-4 py-2.5 sm:px-6 lg:px-8">
        <ol className="flex items-center gap-1.5 text-xs text-zinc-400">
          <li>
            <Link
              to="/"
              className="rounded px-1 py-0.5 transition-colors hover:text-zinc-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-500"
            >
              Home
            </Link>
          </li>
          <li aria-hidden className="text-zinc-600">
            <CaretRight size={10} weight="bold" />
          </li>
          {isApplicationsRoute ? (
            <>
              <li>
                <Link
                  to="/dashboard"
                  className="rounded px-1 py-0.5 transition-colors hover:text-zinc-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-500"
                >
                  Dashboard
                </Link>
              </li>
              <li aria-hidden className="text-zinc-600">
                <CaretRight size={10} weight="bold" />
              </li>
              <li aria-current="page" className="font-medium text-zinc-100">
                My Applications
              </li>
            </>
          ) : isChatRoute ? (
            <>
              <li>
                <Link
                  to="/dashboard"
                  className="rounded px-1 py-0.5 transition-colors hover:text-zinc-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-500"
                >
                  Dashboard
                </Link>
              </li>
              <li aria-hidden className="text-zinc-600">
                <CaretRight size={10} weight="bold" />
              </li>
              <li aria-current="page" className="font-medium text-zinc-100">
                Chat
              </li>
            </>
          ) : isProfileRoute ? (
            <>
              <li>
                <Link
                  to="/dashboard"
                  className="rounded px-1 py-0.5 transition-colors hover:text-zinc-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-500"
                >
                  Dashboard
                </Link>
              </li>
              <li aria-hidden className="text-zinc-600">
                <CaretRight size={10} weight="bold" />
              </li>
              <li aria-current="page" className="font-medium text-zinc-100">
                Profile
              </li>
            </>
          ) : (
            <li aria-current="page" className="font-medium text-zinc-100">
              Dashboard
            </li>
          )}
        </ol>
      </nav>

      <div className="flex min-h-0 flex-1">
        <aside className="flex w-16 flex-col items-center border-r-2 border-white/10 bg-dark-card py-4">
          <nav className="flex flex-col items-center gap-1">
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
              <SquaresFour size={28} weight="regular" />
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
              <ChatCircle size={28} weight="regular" />
              {unreadMessageCount > 0 ? (
                <span className="absolute right-2 top-2 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold leading-none text-white">
                  {unreadMessageCount > 99 ? '99+' : unreadMessageCount}
                </span>
              ) : null}
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
              <Scroll size={28} weight="regular" />
            </NavLink>

            <NavLink
              to="/dashboard/profile"
              className={({ isActive }) =>
                `group relative flex items-center justify-center rounded-lg border-l-2 p-3 transition-colors ${
                  isActive
                    ? 'border-brand-500 bg-white/5 text-white'
                    : 'border-transparent text-zinc-500 hover:text-zinc-200'
                }`
              }
              aria-label="Profile"
            >
              <UserCircle size={28} weight="regular" />
            </NavLink>
          </nav>

          <button
            onClick={handleLogout}
            className="mt-auto mb-8 rounded-lg p-3 text-zinc-500 transition-colors hover:text-zinc-200"
            aria-label="Logout"
          >
            <SignOut size={28} weight="regular" />
          </button>
        </aside>

        <main className="flex min-h-0 flex-1 overflow-hidden">
          <section className="h-full w-full">
            <Outlet />
          </section>
        </main>
      </div>
    </div>
  );
};
