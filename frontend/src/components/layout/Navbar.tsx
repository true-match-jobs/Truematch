import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export const Navbar = () => {
  const { pathname } = useLocation();
  const { user } = useAuth();

  const isDashboardRoute = pathname.startsWith('/dashboard');
  const firstName = user?.fullName.trim().split(/\s+/)[0] ?? 'User';
  const avatarSeed = user?.fullName || user?.id || 'guest';
  const avatarUrl = `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(avatarSeed)}`;
  const loginTarget = user ? (user.role === 'ADMIN' ? '/admin/dashboard' : '/dashboard') : '/login';

  return (
    <header className="bg-dark-bg glass-border-b">
      <nav className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {isDashboardRoute ? (
          <div className="flex items-center gap-3 text-white">
            <img src={avatarUrl} alt={`${firstName} avatar`} className="h-9 w-9 rounded-full border border-white/15 bg-dark-card" />
            <span className="text-sm font-medium text-zinc-100">{firstName}</span>
          </div>
        ) : (
          <Link to="/" className="text-lg font-semibold text-white">
            Truematch
          </Link>
        )}

        {!isDashboardRoute && (
          <div className="flex items-center gap-3">
            <Link
              to={loginTarget}
              className="inline-flex items-center justify-center rounded-lg border-2 border-white/40 bg-transparent px-4 py-2 text-sm font-medium text-white transition-all duration-200 hover:bg-white/5"
            >
              Login
            </Link>
          </div>
        )}
      </nav>
    </header>
  );
};
