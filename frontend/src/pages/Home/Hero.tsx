import { Suspense, lazy, useState, type FormEvent } from 'react';
import type { AxiosError } from 'axios';
import { MagnifyingGlass } from '@phosphor-icons/react';
import { Link } from 'react-router-dom';
import type { ApplicationStatus } from '../../../../shared/applicationStatus';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/ui/Button';

const ApplicationProgressModal = lazy(() =>
  import('../../components/application/ApplicationProgressModal').then((module) => ({
    default: module.ApplicationProgressModal
  }))
);

export const Hero = () => {
  const { user, isAuthenticated } = useAuth();
  const [applicationId, setApplicationId] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [trackerError, setTrackerError] = useState<string | null>(null);
  const [trackerStatus, setTrackerStatus] = useState<ApplicationStatus | null>(null);
  const [trackerUniversityName, setTrackerUniversityName] = useState<string>('');
  const [trackerUniversityCountry, setTrackerUniversityCountry] = useState<string | null>(null);
  const [isTrackerOpen, setIsTrackerOpen] = useState(false);

  const handleTrackerSearch = async () => {
    const trimmedApplicationId = applicationId.trim();

    if (!trimmedApplicationId) {
      setTrackerError('Enter your application ID to track progress.');
      return;
    }

    try {
      setTrackerError(null);
      setIsSearching(true);

      const { applicationService } = await import('../../services/application.service');
      const tracker = await applicationService.getTrackerStatus(trimmedApplicationId);

      setTrackerStatus(tracker.applicationStatus);
      setTrackerUniversityName(tracker.universityName ?? '');
      setTrackerUniversityCountry(tracker.universityCountry ?? null);
      setIsTrackerOpen(true);

      if (isAuthenticated && user?.role === 'USER') {
        try {
          await applicationService.markTrackerViewed(trimmedApplicationId);
          const { useDashboardStore } = await import('../../store/dashboard.store');
          const loadDashboardData = useDashboardStore.getState().loadDashboardData;
          await loadDashboardData(true, false);
        } catch (_error) {
          return;
        }
      }
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      const backendMessage = axiosError.response?.data?.message;

      if (backendMessage === 'Tracker is available for study applications only') {
        setTrackerError('Tracking is available for study applications only.');
      } else {
        setTrackerError('Application not found. Please check the ID and try again.');
      }
    } finally {
      setIsSearching(false);
    }
  };

  const handleTrackerSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await handleTrackerSearch();
  };

  return (
    <section className="relative overflow-hidden bg-dark-bg">

      {/* ── Grid texture overlay ── */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          backgroundImage: `
            linear-gradient(rgba(39,39,42,0.4) 1px, transparent 1px),
            linear-gradient(90deg, rgba(39,39,42,0.4) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />

      {/* ── Top violet glow blob ── */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 left-1/2 z-0 h-[480px] w-[700px] -translate-x-1/2 rounded-full blur-3xl"
        style={{ background: 'radial-gradient(ellipse, rgba(139,92,246,0.18) 0%, transparent 70%)' }}
      />

      {/* ── Secondary accent glow (bottom-left) ── */}
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-1/3 -left-32 z-0 h-[320px] w-[320px] rounded-full blur-3xl"
        style={{ background: 'radial-gradient(ellipse, rgba(109,40,217,0.1) 0%, transparent 70%)' }}
      />

      {/* ── Fade into next section ── */}
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-0 left-0 right-0 z-10 h-48"
        style={{ background: 'linear-gradient(to bottom, transparent, #09090b)' }}
      />

      {/* ── Main content ── */}
      <div className="relative z-10 mx-auto flex min-h-[88vh] w-full max-w-6xl flex-col items-center justify-center px-4 text-center sm:px-6 lg:px-8">

        {/* Badge */}
        <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-brand-500/30 bg-brand-500/10 px-4 py-1.5 text-xs font-medium tracking-wide text-brand-300">
          <span className="h-1.5 w-1.5 rounded-full bg-brand-400 shadow-[0_0_6px_2px_rgba(167,139,250,0.6)]" />
          Trusted by global learners worldwide
        </div>

        {/* Headline */}
        <h1 className="mx-auto max-w-4xl text-balance text-center text-4xl font-extrabold leading-[1.1] tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl">
          Your trusted platform for{' '}
          <span className="text-gradient-brand">global learners and international job seekers</span>
        </h1>

        {/* Subtext */}
        <p className="mx-auto mt-6 max-w-2xl text-center text-base leading-relaxed text-zinc-400 sm:text-lg">
          Start your study or work abroad journey in top global destinations with a guided, secure, and efficient process.
        </p>

        {/* CTA */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link to="/apply">
            <Button className="px-8 py-3 text-sm">Start Your Application</Button>
          </Link>
        </div>

        {/* Application Tracker */}
        <div className="mt-16 w-full max-w-xl text-left">
          <label
            htmlFor="application-tracker"
            className="mb-2 block text-xs font-semibold uppercase tracking-widest text-zinc-500"
          >
            Track your application
          </label>
          <form
            onSubmit={(event) => void handleTrackerSubmit(event)}
            className="relative rounded-xl border border-zinc-800 bg-zinc-900/60 backdrop-blur-sm transition-colors focus-within:border-brand-500/50"
          >
            <input
              id="application-tracker"
              type="search"
              placeholder="Enter your application ID"
              value={applicationId}
              onChange={(event) => setApplicationId(event.target.value)}
              className="w-full rounded-xl border border-transparent bg-transparent py-3.5 pl-4 pr-28 text-sm text-zinc-100 placeholder-zinc-600 outline-none"
            />
            <button
              type="submit"
              disabled={isSearching}
              className="absolute right-1.5 top-1/2 inline-flex h-[calc(100%-12px)] -translate-y-1/2 items-center justify-center gap-1.5 rounded-lg bg-brand-600 px-4 text-xs font-semibold text-white transition-colors hover:bg-brand-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60 disabled:cursor-not-allowed disabled:opacity-60"
              aria-label="Search application"
            >
              <MagnifyingGlass size={13} weight="bold" />
              <span>{isSearching ? 'Searching...' : 'Search'}</span>
            </button>
          </form>
          {trackerError ? (
            <p className="mt-2 flex items-center gap-1.5 text-xs text-rose-400">
              <span className="inline-block h-1 w-1 rounded-full bg-rose-400" />
              {trackerError}
            </p>
          ) : null}
        </div>

      </div>

      {trackerStatus ? (
        <Suspense fallback={null}>
          <ApplicationProgressModal
            isOpen={isTrackerOpen}
            onClose={() => setIsTrackerOpen(false)}
            applicationStatus={trackerStatus}
            universityName={trackerUniversityName}
            universityCountry={trackerUniversityCountry}
          />
        </Suspense>
      ) : null}
    </section>
  );
};
                
