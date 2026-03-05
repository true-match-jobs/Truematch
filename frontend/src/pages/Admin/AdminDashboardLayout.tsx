import { useEffect, useMemo } from 'react';
import { ChatCircle, HouseLine, SignOut } from '@phosphor-icons/react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { ChatHeader } from '../../components/chat/ChatHeader';
import { useAuth } from '../../hooks/useAuth';
import { useChatNotificationStore } from '../../store/chat-notification.store';
import { useViewportHeight } from '../../hooks/useViewportHeight';
import { buildInitialAvatarUrl } from '../../utils/avatar';

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

  const fallbackAvatarUrl = useMemo(
    () =>
      buildInitialAvatarUrl({
        fullName: user?.fullName,
        email: user?.email,
        id: user?.id,
        fallback: 'Admin',
        size: 36
      }),
    [user?.email, user?.fullName, user?.id]
  );
  const adminProfileAvatarUrl = user?.profilePhotoUrl || fallbackAvatarUrl;

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
            <HouseLine size={26} weight="regular" />
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
            <ChatCircle size={26} weight="regular" />
            {unreadAdminUserIds.length > 0 ? (
              <span className="absolute right-2 top-2 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold leading-none text-white">
                {unreadAdminUserIds.length > 99 ? '99+' : unreadAdminUserIds.length}
              </span>
            ) : null}
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
          avatarUrl={adminProfileAvatarUrl}
          avatarAlt={`${user?.fullName ?? 'Admin'} avatar`}
          title={isChatRoute ? "Admin Chat" : "Admin Dashboard"}
          isOnline
          showIdentityText={false}
          avatarAlign="right"
          onAvatarClick={() => navigate('/admin/dashboard/profile')}
        />

        <section className="h-full w-full">
          <Outlet />
        </section>
      </main>
    </div>
  );
};
