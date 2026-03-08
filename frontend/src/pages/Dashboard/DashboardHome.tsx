import { useEffect, useMemo, useState } from 'react';
import { useDashboardData } from '../../hooks/useDashboardData';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowRight } from '@phosphor-icons/react';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { authService } from '../../services/auth.service';
import { useChatNotificationStore } from '../../store/chat-notification.store';
import { useDashboardStore } from '../../store/dashboard.store';
import { buildInitialAvatarUrl } from '../../utils/avatar';

export const DashboardHome = () => {
  const { profile, isLoading: loading, errorMessage, refreshDashboardData } = useDashboardData();
  const [copiedApplicationId, setCopiedApplicationId] = useState<string | null>(null);
  const navigate = useNavigate();

  const applications = profile?.applications ?? (profile?.application ? [profile.application] : []);
  const recentApplications = applications.slice(0, 3);
  const summaryItems = useMemo(
    () => [
      { label: 'Total Applications', value: applications.length },
      { label: 'Applications In Progress', value: applications.length },
      { label: 'Offers Received', value: 0 }
    ],
    [applications.length]
  );
  const isSummaryLoading = loading && !profile;

  const getApplicationDetailsPath = (applicationId: string, applicationType: string) =>
    applicationType === 'work_employment' ? `/applications/${applicationId}/employment` : `/applications/${applicationId}`;
  const assignedAdmin = profile?.assignedAdmin;
  const presenceByUserId = useChatNotificationStore((state) => state.presenceByUserId);
  const subscribeToPresence = useChatNotificationStore((state) => state.subscribeToPresence);
  const isAssignedAdminOnline = assignedAdmin?.id ? Boolean(presenceByUserId[assignedAdmin.id]) : false;

  const handleCopyApplicationId = async (event: React.MouseEvent<HTMLButtonElement>, applicationId: string) => {
    event.preventDefault();
    event.stopPropagation();

    try {
      await navigator.clipboard.writeText(applicationId);
      setCopiedApplicationId(applicationId);
      window.setTimeout(() => {
        setCopiedApplicationId(null);
      }, 1400);
    } catch (_error) {
      setCopiedApplicationId(null);
    }
  };

  const preventRowNavigation = (event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  useEffect(() => {
    if (!profile || profile.hasVisitedDashboard) {
      return;
    }

    let isSubscribed = true;

    const persistDashboardVisit = async () => {
      try {
        await authService.markMeDashboardVisited();

        if (!isSubscribed) {
          return;
        }

        useDashboardStore.setState((state) => ({
          ...state,
          profile: state.profile
            ? {
                ...state.profile,
                hasVisitedDashboard: true
              }
            : state.profile
        }));
      } catch (_error) {}
    };

    void persistDashboardVisit();

    return () => {
      isSubscribed = false;
    };
  }, [profile]);

  useEffect(() => {
    const assignedAdminId = assignedAdmin?.id;


    return subscribeToPresence(assignedAdminId ? [assignedAdminId] : []);
  }, [assignedAdmin?.id, subscribeToPresence]);

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

  const handleGoToChat = () => {
    if (assignedAdmin?.id) {
      navigate(`/chat/${assignedAdmin.id}`);
    } else {
      navigate('/dashboard/chat');
    }
  };

  return (
    <div className="h-full overflow-y-auto px-3 pt-5 pb-[calc(7rem+env(safe-area-inset-bottom))] sm:px-5">
      <div className="min-h-[3.25rem]">
        <p className="text-sm text-zinc-400">Track your applications, updates, and next steps from one place.</p>
      </div>
      <div className="mt-10 pb-10">

        <section>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-300">Quick Summary</h3>
          <div className="mt-3 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {summaryItems.map((item) => (
              <article key={item.label} className="glass-border rounded-xl bg-dark-card p-5">
                <p className="text-sm text-zinc-400">{item.label}</p>
                <div className="mt-3 min-h-8 flex items-center">
                  {isSummaryLoading ? (
                    <span
                      className="inline-flex h-5 w-5 animate-spin rounded-full border-2 border-zinc-500/40 border-t-zinc-200"
                      aria-label={`Loading ${item.label.toLowerCase()}`}
                    />
                  ) : (
                    <p className="text-2xl font-semibold text-zinc-100">{item.value}</p>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>

        <div className="mt-12 grid gap-4 xl:grid-cols-3">
          <section className="glass-border min-w-0 rounded-xl bg-dark-card p-5">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-300">Recent Applications</h3>
            {loading && !profile ? <LoadingSpinner className="mt-4 py-10" /> : null}
            {errorMessage ? <p className="mt-4 text-sm text-rose-400">{errorMessage}</p> : null}
            {!loading && !errorMessage && recentApplications.length === 0 ? (
              <div className="mt-4 rounded-xl border border-white/10 bg-transparent p-4">
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
            {!loading && !errorMessage && recentApplications.length > 0 ? (
              <ul className="mt-4 space-y-3">
                {recentApplications.map((application) => {
                  const isStudyApplication = application.applicationType === 'study_scholarship';
                  const cardTitle = isStudyApplication
                    ? application.universityName || 'Work Application'
                    : application.skillOrProfession || 'Work Application';
                  const cardSubtitle = isStudyApplication
                    ? application.courseName || application.skillOrProfession || 'N/A'
                    : application.workCountry || 'N/A';

                  return (
                    <li
                      key={application.id}
                      className="rounded-xl border border-white/10 bg-transparent p-4"
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-zinc-100">{cardTitle}</p>
                          <p className="mt-1 text-sm text-zinc-400">{cardSubtitle}</p>
                          {application.createdAt && (
                            <p className="mt-1 text-xs text-zinc-500">Submitted on {new Date(application.createdAt).toLocaleDateString()}</p>
                          )}
                        </div>
                        <div className="flex w-full sm:w-auto justify-end">
                          <Link
                            to={getApplicationDetailsPath(application.id, application.applicationType)}
                            className="inline-flex items-center gap-1 text-sm font-medium text-brand-400 transition-colors hover:text-brand-300"
                          >
                            View
                            <ArrowRight size={14} weight="bold" />
                          </Link>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : null}
          </section>
        </div>

        <div className="mt-12 grid gap-4 lg:grid-cols-2">
          <section className="glass-border rounded-xl bg-dark-card p-5">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-300">Assigned Agent</h3>
            <div className="mt-4 flex flex-col items-end">
              <div className="flex w-full items-center gap-3">
                <div className="relative">
                  <img
                    src={
                      assignedAdmin?.profilePhotoUrl ??
                      buildInitialAvatarUrl({
                        fullName: assignedAdmin?.fullName,
                        email: assignedAdmin?.email,
                        id: assignedAdmin?.id,
                        fallback: 'Advisor',
                        size: 40
                      })
                    }
                    alt={`${assignedAdmin?.fullName ?? 'Assigned agent'} avatar`}
                    className="h-10 w-10 rounded-full bg-dark-surface"
                  />
                  <span
                    className={`absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border border-dark-card ${
                      isAssignedAdminOnline ? 'bg-emerald-400' : 'bg-zinc-500'
                    }`}
                    aria-hidden
                  />
                </div>
                <div>
                  <p className="text-base font-semibold text-zinc-100">{assignedAdmin?.fullName ?? 'Assigned agent pending'}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleGoToChat}
                className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-brand-400 transition-colors hover:text-brand-300"
              >
                Go to Chat
                <ArrowRight size={14} weight="bold" />
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
