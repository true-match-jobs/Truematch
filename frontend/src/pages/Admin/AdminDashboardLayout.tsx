import { useEffect } from 'react';
import { CaretRight, ChatCircle, SignOut, SquaresFour, UserCircle } from '@phosphor-icons/react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Navbar } from '../../components/layout/Navbar';
import { useAuth } from '../../hooks/useAuth';
import { useChatNotificationStore } from '../../store/chat-notification.store';
import { useViewportHeight } from '../../hooks/useViewportHeight';

export const AdminDashboardLayout = () => {
  useViewportHeight();
  const { logout, user } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const isChatRoute = pathname.startsWith('/admin/dashboard/chat');
  const unreadAdminUserIds = useChatNotificationStore((state) => state.unreadAdminUserIds);
  const connectNotifications = useChatNotificationStore((state) => state.connect);
  const disconnectNotifications = useChatNotificationStore((state) => state.disconnect);
  const setNotificationContext = useChatNotificationStore((state) => state.setContext);
  const resetNotifications = useChatNotificationStore((state) => state.reset);

  const activePeerUserId = pathname.startsWith('/admin/dashboard/chat/')
    ? pathname.replace('/admin/dashboard/chat/', '').split('/')[0] || null
    : null;

  useEffect(() => {
    if (!user || user.role !== 'ADMIN') {
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

  const handleLogout = async () => {
    await logout();
    resetNotifications();
    navigate('/login', { replace: true });
  };

  return (
    <div className="flex flex-col overflow-hidden bg-dark-bg" style={{ height: 'calc(var(--vh, 1vh) * 100)' }}>
      {isChatRoute ? (
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
            <li>
              <Link
                to="/admin/dashboard"
                className="rounded px-1 py-0.5 transition-colors hover:text-zinc-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-500"
              >
                Admin Dashboard
              </Link>
            </li>
            <li aria-hidden className="text-zinc-600">
              <CaretRight size={10} weight="bold" />
            </li>
            <li aria-current="page" className="font-medium text-zinc-100">
              Chat
            </li>
          </ol>
        </nav>
      ) : (
        <Navbar />
      )}

      <div className="flex min-h-0 flex-1">
        <aside className="flex w-16 flex-col items-center border-r-2 border-white/10 bg-dark-card py-4">
          <nav className="flex flex-col items-center gap-1">
            <NavLink
              to="/admin/dashboard"
              end
              className={({ isActive }) =>
                `group relative flex items-center justify-center rounded-lg border-l-2 p-3 transition-colors ${
                  isActive
                    ? 'border-brand-500 bg-white/5 text-white'
                    : 'border-transparent text-zinc-500 hover:text-zinc-200'
                }`
              }
              aria-label="Admin home"
            >
              <SquaresFour size={28} weight="regular" />
            </NavLink>

            <NavLink
              to="/admin/dashboard/chat"
              className={({ isActive }) =>
                `group relative flex items-center justify-center rounded-lg border-l-2 p-3 transition-colors ${
                  isActive
                    ? 'border-brand-500 bg-white/5 text-white'
                    : 'border-transparent text-zinc-500 hover:text-zinc-200'
                }`
              }
              aria-label="Admin chat"
            >
              <ChatCircle size={28} weight="regular" />
              {unreadAdminUserIds.length > 0 ? (
                <span className="absolute right-2 top-2 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold leading-none text-white">
                  {unreadAdminUserIds.length > 99 ? '99+' : unreadAdminUserIds.length}
                </span>
              ) : null}
            </NavLink>

            <NavLink
              to="/admin/dashboard/profile"
              className={({ isActive }) =>
                `group relative flex items-center justify-center rounded-lg border-l-2 p-3 transition-colors ${
                  isActive
                    ? 'border-brand-500 bg-white/5 text-white'
                    : 'border-transparent text-zinc-500 hover:text-zinc-200'
                }`
              }
              aria-label="Admin profile"
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