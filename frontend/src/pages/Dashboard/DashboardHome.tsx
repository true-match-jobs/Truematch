import { Check, CopySimple } from '@phosphor-icons/react';
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useDashboardData } from '../../hooks/useDashboardData';
import { Link } from 'react-router-dom';
import { ArrowRight } from '@phosphor-icons/react';
import { EmptyState } from '../../components/ui/EmptyState';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';

export const DashboardHome = () => {
  const { user } = useAuth();
  const firstName = user?.fullName.trim().split(/\s+/)[0] ?? 'Applicant';
  const { profile, isLoading: loading, errorMessage, refreshDashboardData } = useDashboardData();
  const [isCopied, setIsCopied] = useState(false);

  const hasApplication = Boolean(profile?.application);
  const shouldShowTrackSubmittedApplication = hasApplication && Boolean(profile?.application?.hasViewedTracker);
  const shouldShowUploadRequiredDocuments = hasApplication && !profile?.hasUploadedPassport;
  const summaryItems = useMemo(
    () => [
      { label: 'Total Applications', value: hasApplication ? 1 : 0 },
      { label: 'Applications In Progress', value: hasApplication ? 1 : 0 },
      { label: 'Offers Received', value: 0 }
    ],
    [hasApplication]
  );

  const nextActions = hasApplication
    ? [
        ...(shouldShowTrackSubmittedApplication ? ['Track your submitted application'] : []),
        ...(shouldShowUploadRequiredDocuments ? ['Upload required document(s).'] : [])
      ]
    : ['Start your application'];

  const application = profile?.application;
  const assignedAdmin = profile?.assignedAdmin;
  const deadlines: Array<{ label: string; date: string }> = [];

  const handleCopyApplicationId = async (event: React.MouseEvent<HTMLButtonElement>, applicationId: string) => {
    event.preventDefault();
    event.stopPropagation();

    try {
      await navigator.clipboard.writeText(applicationId);
      setIsCopied(true);
      window.setTimeout(() => {
        setIsCopied(false);
      }, 1400);
    } catch (_error) {
      setIsCopied(false);
    }
  };

  const preventRowNavigation = (event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  useEffect(() => {
    let intervalId: number | undefined;

    const startPolling = () => {
      if (intervalId !== undefined || document.visibilityState !== 'visible') {
        return;
      }

      intervalId = window.setInterval(() => {
        void refreshDashboardData();
      }, 5000);
    };

    const stopPolling = () => {
      if (intervalId === undefined) {
        return;
      }

      window.clearInterval(intervalId);
      intervalId = undefined;
    };

    const handleFocusRefresh = () => {
      void refreshDashboardData();
    };

    const handleVisibilityRefresh = () => {
      if (document.visibilityState === 'visible') {
        void refreshDashboardData();
        startPolling();
        return;
      }

      stopPolling();
    };

    startPolling();

    window.addEventListener('focus', handleFocusRefresh);
    document.addEventListener('visibilitychange', handleVisibilityRefresh);

    return () => {
      stopPolling();
      window.removeEventListener('focus', handleFocusRefresh);
      document.removeEventListener('visibilitychange', handleVisibilityRefresh);
    };
  }, [refreshDashboardData]);

  return (
    <div className="h-full overflow-y-auto px-3 py-5 sm:px-5">
      <div className="space-y-6">
        <section className="mb-12 px-1 py-1 sm:mb-14">
          <h2 className="text-xl font-semibold tracking-tight text-zinc-100">Welcome back, {firstName}</h2>
          <p className="mt-2 text-sm text-zinc-400">Track your applications and next steps here.</p>
        </section>

        <section>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-300">Quick Summary</h3>
          <div className="mt-3 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {summaryItems.map((item) => (
              <article key={item.label} className="glass-border rounded-xl bg-dark-card p-5">
                <p className="text-sm text-zinc-400">{item.label}</p>
                <p className="mt-3 text-2xl font-semibold text-zinc-100">{item.value}</p>
              </article>
            ))}
          </div>
        </section>

        <div className="grid gap-4 xl:grid-cols-3">
          <section className="glass-border rounded-xl bg-dark-card p-5 xl:col-span-2">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-300">Recent Applications</h3>
            {loading && !profile ? <LoadingSpinner className="mt-4 py-10" /> : null}
            {errorMessage ? <p className="mt-4 text-sm text-rose-400">{errorMessage}</p> : null}
            {!loading && !errorMessage && !application ? (
              <div className="mt-4 rounded-xl border border-white/10 bg-dark-surface p-4">
                <p className="text-sm text-zinc-300">No application submitted yet.</p>
                <Link
                  to="/apply"
                  className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-brand-400 transition-colors hover:text-brand-300"
                >
                  Start application
                  <ArrowRight size={14} weight="bold" />
                </Link>
              </div>
            ) : null}
            {!loading && !errorMessage && application ? (
              <ul className="mt-4 divide-y divide-white/10">
                <li className="flex flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-zinc-100">{application.universityName || 'Work Application'}</p>
                    <p className="mt-1 text-sm text-zinc-400">{application.courseName || application.skillOrProfession || 'N/A'}</p>
                    <div
                      className="mt-2 inline-flex max-w-full items-center gap-2 rounded-full bg-white/5 px-2.5 py-1 text-xs font-medium text-zinc-300"
                      onClick={preventRowNavigation}
                    >
                      <span className="text-zinc-400">ID:</span>
                      <span className="max-w-[150px] truncate text-zinc-200 sm:max-w-[220px]">{application.id}</span>
                      <button
                        type="button"
                        onClick={(event) => void handleCopyApplicationId(event, application.id)}
                        className="inline-flex h-5 w-5 items-center justify-center rounded text-zinc-400 transition-colors hover:text-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                        aria-label="Copy application ID"
                        title="Copy application ID"
                      >
                        {isCopied ? <Check size={13} weight="bold" /> : <CopySimple size={13} weight="bold" />}
                      </button>
                    </div>
                  </div>

                  <Link
                    to={`/applications/${application.id}`}
                    className="inline-flex items-center gap-1 self-end text-sm font-medium text-brand-400 transition-colors hover:text-brand-300 sm:self-auto"
                  >
                    View
                    <ArrowRight size={14} weight="bold" />
                  </Link>
                </li>
              </ul>
            ) : null}
          </section>

          <section className="rounded-xl border border-red-500/20 bg-red-500/10 p-5 backdrop-blur-sm">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-white">Next Action Required</h3>
            {nextActions.length ? (
              <ul className="mt-4 space-y-1">
                {nextActions.map((action) => (
                  <li key={action} className="py-1.5 text-sm text-white">
                    {action}
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState description="No required action at the moment." className="mt-4" />
            )}
          </section>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <section className="glass-border rounded-xl bg-dark-card p-5">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-300">Assigned Officer</h3>
            <div className="mt-4 flex flex-col items-end">
              <div className="flex w-full items-center gap-3">
                <div className="relative">
                  <img
                    src={`https://api.dicebear.com/9.x/avataaars/svg?seed=${assignedAdmin?.id ?? 'advisor'}`}
                    alt={`${assignedAdmin?.fullName ?? 'Assigned officer'} avatar`}
                    className="h-10 w-10 rounded-full bg-dark-surface"
                  />
                  <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border border-dark-card bg-emerald-400" aria-hidden />
                </div>
                <p className="text-base font-semibold text-zinc-100">{assignedAdmin?.fullName ?? 'Assigned officer pending'}</p>
              </div>

              <Link
                to="/dashboard/chat"
                className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-brand-400 transition-colors hover:text-brand-300"
              >
                Go to Chat
                <ArrowRight size={14} weight="bold" />
              </Link>
            </div>
          </section>

          <section className="glass-border rounded-xl bg-dark-card p-5">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-300">Important Deadlines</h3>
            {deadlines.length ? (
              <div className="mt-4 grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                {deadlines.map((deadline) => (
                  <article key={deadline.label} className="rounded-xl border border-white/10 bg-dark-surface p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">{deadline.label}</p>
                    <p className="mt-2 text-sm font-semibold text-zinc-100">{deadline.date}</p>
                  </article>
                ))}
              </div>
            ) : (
              <EmptyState description="No deadlines available yet." className="mt-4" />
            )}
          </section>
        </div>
      </div>
    </div>
  );
};
