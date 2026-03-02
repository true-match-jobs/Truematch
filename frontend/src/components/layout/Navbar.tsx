import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export const Navbar = () => {
  const logoUrl = '/logos/logo-tm.png';
  const { pathname } = useLocation();
  const { user } = useAuth();

  const isHomePage = pathname === '/';
  const loginTarget = user ? (user.role === 'ADMIN' ? '/admin/dashboard' : '/dashboard') : '/login';

  return (
    <header className="bg-dark-bg glass-border-b">
      <nav className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {
          <Link to="/" aria-label="Truematch home" className="inline-flex items-center">
            <img src={logoUrl} alt="Truematch logo" className="h-10 w-auto" />
          </Link>
        }

        {isHomePage && (
          <div className="flex items-center gap-3">
            <Link
              to={loginTarget}
              className="inline-flex items-center justify-center rounded-lg border border-white/40 bg-transparent px-4 py-2 text-sm font-medium text-white transition-all duration-200 hover:bg-white/5"
            >
              {user ? 'Dashboard' : 'Login'}
            </Link>
          </div>
        )}
      </nav>
    </header>
  );
};
