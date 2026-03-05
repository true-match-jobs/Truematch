import { useState, type FormEvent } from 'react';
import type { AxiosError } from 'axios';
import { MagnifyingGlass } from '@phosphor-icons/react';
import { Link } from 'react-router-dom';
import type { ApplicationStatus } from '../../../../shared/applicationStatus';
import { ApplicationProgressModal } from '../../components/application/ApplicationProgressModal';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/ui/Button';
import { applicationService } from '../../services/application.service';
import { useDashboardStore } from '../../store/dashboard.store';

export const Hero = () => {
  const { user, isAuthenticated } = useAuth();
  const loadDashboardData = useDashboardStore((state) => state.loadDashboardData);
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
      const tracker = await applicationService.getTrackerStatus(trimmedApplicationId);
      setTrackerStatus(tracker.applicationStatus);
      setTrackerUniversityName(tracker.universityName ?? '');
      setTrackerUniversityCountry(tracker.universityCountry ?? null);
      setIsTrackerOpen(true);

      if (isAuthenticated && user?.role === 'USER') {
        try {
          await applicationService.markTrackerViewed(trimmedApplicationId);
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
      {/* Gradient glow accent */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-brand-600/20 blur-3xl"
      />

      <div className="relative mx-auto flex min-h-[85vh] w-full max-w-6xl flex-col items-center justify-center px-4 text-center sm:px-6 lg:px-8">
        <div className="mb-8 w-full max-w-xl text-left">
          <label htmlFor="application-tracker" className="mb-2 block text-xs font-semibold tracking-wide text-zinc-300">
            Track the status of your study application
          </label>
          <form onSubmit={(event) => void handleTrackerSubmit(event)} className="glass-border relative rounded-xl">
            <input
              id="application-tracker"
              type="search"
              placeholder="Enter your application ID"
              value={applicationId}
              onChange={(event) => setApplicationId(event.target.value)}
              className="w-full rounded-xl border border-transparent bg-transparent py-3 pl-4 pr-24 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition-colors focus:border-white/20"
            />
            <button
              type="submit"
              disabled={isSearching}
              className="absolute right-1 top-1/2 inline-flex h-[calc(100%-0.5rem)] -translate-y-1/2 items-center justify-center gap-1.5 rounded-lg bg-brand-600 px-3 text-xs font-medium text-white transition-colors hover:bg-brand-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60 disabled:cursor-not-allowed disabled:opacity-70"
              aria-label="Search application"
            >
              <MagnifyingGlass size={14} weight="regular" />
              <span>{isSearching ? 'Searching...' : 'Search'}</span>
            </button>
          </form>
          {trackerError ? <p className="mt-2 text-xs text-rose-400">{trackerError}</p> : null}
        </div>

        <h1 className="mx-auto max-w-4xl text-balance text-center text-4xl font-extrabold leading-[1.1] tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl">
          Your trusted platform for{' '}
          <span className="text-gradient-brand">global learners and international job seekers</span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-center text-base leading-relaxed text-zinc-400 sm:text-lg">
          Start your study or work abroad journey in top global destinations with a guided, secure, and efficient process.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link to="/apply">
            <Button className="px-8 py-3 text-sm">Start Your Application</Button>
          </Link>
        </div>
      </div>

      {trackerStatus ? (
        <ApplicationProgressModal
          isOpen={isTrackerOpen}
          onClose={() => setIsTrackerOpen(false)}
          applicationStatus={trackerStatus}
          universityName={trackerUniversityName}
          universityCountry={trackerUniversityCountry}
        />
      ) : null}
    </section>
  );
};
