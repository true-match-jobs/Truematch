import { useEffect } from 'react';
import { ChatCircle, HouseLine, SignOut, UserCircle } from '@phosphor-icons/react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
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
  const setNotificationContext = useChatNotificationStore((state) => state.setContext);
  const hydrateUnreadSummary = useChatNotificationStore((state) => state.hydrateUnreadSummary);
  const resetNotifications = useChatNotificationStore((state) => state.reset);

  const activePeerUserId = pathname.startsWith('/admin/dashboard/chat/')
    ? pathname.replace('/admin/dashboard/chat/', '').split('/')[0] || null
    : null;

  useEffect(() => {
    if (user?.role !== 'ADMIN') {
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
              to="/admin/dashboard"
              end
              className={({ isActive }) =>
                `group relative flex items-center justify-center border-l-4 p-3 transition-colors ${
                  isActive
                    ? 'rounded-none border-brand-500 text-white'
                    : 'rounded-lg border-transparent text-zinc-500 hover:text-zinc-200'
                }`
              }
              aria-label="Admin home"
            >
              <HouseLine size={28} weight="regular" />
            </NavLink>

            <NavLink
              to="/admin/dashboard/chat"
              className={({ isActive }) =>
                `group relative flex items-center justify-center border-l-4 p-3 transition-colors ${
                  isActive
                    ? 'rounded-none border-brand-500 text-white'
                    : 'rounded-lg border-transparent text-zinc-500 hover:text-zinc-200'
                }`
              }
              aria-label="Admin chat"
            >
              <ChatCircle size={28} weight="regular" />
              {unreadAdminUserIds.length > 0 ? (
                <span className="absolute right-2 top-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-600 px-1.5 text-[10px] font-semibold leading-none text-white">
                  {unreadAdminUserIds.length > 99 ? '99+' : unreadAdminUserIds.length}
                </span>
              ) : null}
            </NavLink>
          </nav>

          <div className="mb-4 mt-auto flex flex-col items-center gap-1">
            <NavLink
              to="/admin/dashboard/profile"
              className={({ isActive }) =>
                `group relative flex items-center justify-center border-l-4 p-3 transition-colors ${
                  isActive
                    ? 'rounded-none border-brand-500 text-white'
                    : 'rounded-lg border-transparent text-zinc-500 hover:text-zinc-200'
                }`
              }
              aria-label="Admin profile"
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
