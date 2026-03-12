import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import type { ReactNode } from 'react';

type NavbarProps = {
  leftContent?: ReactNode;
  centerContent?: ReactNode;
};

export const Navbar = ({ leftContent, centerContent }: NavbarProps) => {
  const logoUrl = '/logos/logo-tm.png';
  const { pathname } = useLocation();
  const { user } = useAuth();

  const isHomePage = pathname === '/';
  const loginTarget = user ? (user.role === 'ADMIN' ? '/admin/dashboard' : '/dashboard') : '/login';

  return (
    <header className="bg-dark-bg glass-border-b">
      <nav className="relative mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <Link to="/" aria-label="Truematch home" className="inline-flex items-center">
            <img src={logoUrl} alt="Truematch logo" className="h-10 w-auto" />
          </Link>
          {leftContent ? <div className="min-w-0">{leftContent}</div> : null}
        </div>

        {centerContent ? (
          <div className="pointer-events-none absolute left-1/2 top-1/2 w-[min(62vw,34rem)] -translate-x-1/2 -translate-y-1/2 text-center">
            <div className="truncate">{centerContent}</div>
          </div>
        ) : null}

        {isHomePage ? (
          <div className="flex items-center gap-3">
            <Link
              to={loginTarget}
              className="inline-flex items-center justify-center rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-sm font-medium text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.15),0_1px_3px_rgba(0,0,0,0.4)] backdrop-blur-sm transition-all duration-200 hover:bg-white/10 hover:border-white/30"
            >
              {user ? 'Dashboard' : 'Login'}
            </Link>
          </div>
        ) : null}
      </nav>
    </header>
  );
};
