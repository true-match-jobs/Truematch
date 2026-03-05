import { X } from '@phosphor-icons/react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ApplicationSummaryCard } from '../../components/application/ApplicationSummaryCard';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { Snackbar } from '../../components/ui/Snackbar';
import { SNACKBAR_AUTO_DISMISS_DELAY_MS } from '../../constants/snackbar';
import { useDashboardData } from '../../hooks/useDashboardData';
import { applicationService } from '../../services/application.service';

export const DashboardApplicationsPage = () => {
  const { profile, isLoading: loading, errorMessage, refreshDashboardData } = useDashboardData();
  const [selectedApplicationId, setSelectedApplicationId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteErrorMessage, setDeleteErrorMessage] = useState<string | null>(null);
  const [showDeleteSuccessSnackbar, setShowDeleteSuccessSnackbar] = useState(false);

  const applications = profile?.applications ?? (profile?.application ? [profile.application] : []);
  const selectedApplication = selectedApplicationId
    ? applications.find((application) => application.id === selectedApplicationId) ?? null
    : null;

  useEffect(() => {
    if (!showDeleteSuccessSnackbar) {
      return;
    }

    const timer = window.setTimeout(() => {
      setShowDeleteSuccessSnackbar(false);
    }, SNACKBAR_AUTO_DISMISS_DELAY_MS);

    return () => {
      window.clearTimeout(timer);
    };
  }, [showDeleteSuccessSnackbar]);

  const handleDeleteConfirm = async () => {
    if (!selectedApplication) {
      return;
    }

    try {
      setIsDeleting(true);
      setDeleteErrorMessage(null);
      await applicationService.deleteById(selectedApplication.id);
      setSelectedApplicationId(null);
      setShowDeleteSuccessSnackbar(true);
      await refreshDashboardData();
    } catch (_error) {
      setDeleteErrorMessage('Unable to delete application right now. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <section className="flex h-full min-h-0 flex-col">
      <div className="flex-1 min-h-0 overflow-y-auto px-3 pt-5 pb-[calc(7rem+env(safe-area-inset-bottom))]">
        <h2 className="text-xl font-semibold tracking-tight text-zinc-100">My applications</h2>

        {loading ? <LoadingSpinner className="mt-4 py-10" /> : null}
        {errorMessage ? <p className="mt-4 text-sm text-rose-400">{errorMessage}</p> : null}
        {!loading && !errorMessage && applications.length === 0 ? (
          <div className="mt-4 max-w-2xl rounded-xl border border-white/10 bg-dark-card p-5 sm:p-6">
            <p className="text-sm text-zinc-300">You have not submitted any application yet.</p>
            <Link
              to="/apply"
              className="mt-3 inline-flex items-center rounded-lg border border-white/10 px-3 py-2 text-sm font-medium text-zinc-100 transition-colors hover:border-white/20"
            >
              Start your application
            </Link>
          </div>
        ) : null}

        {!loading && !errorMessage && applications.length > 0 ? (
          <div className="mt-4 space-y-3 pb-10">
            {applications.map((application) => {
              const applicationDetailsPath =
                application.applicationType === 'work_employment'
                  ? `/applications/${application.id}/employment`
                  : `/applications/${application.id}`;

              return (
                <ApplicationSummaryCard
                  key={application.id}
                  application={application}
                  linkTo={applicationDetailsPath}
                  className="max-w-2xl"
                  showDeleteAction
                  onDeleteClick={() => setSelectedApplicationId(application.id)}
                />
              );
            })}
          </div>
        ) : null}
      </div>

      {selectedApplication ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-application-title"
          onClick={() => setSelectedApplicationId(null)}
        >
          <div
            className="w-full max-w-md rounded-xl bg-zinc-800 p-5 shadow-lg sm:p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <h3 id="delete-application-title" className="text-base font-semibold text-zinc-100">
                Delete application?
              </h3>
              <button
                type="button"
                onClick={() => setSelectedApplicationId(null)}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-zinc-400 transition-colors hover:text-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                aria-label="Close delete confirmation"
              >
                <X size={14} weight="bold" />
              </button>
            </div>

            <p className="mt-3 text-sm text-zinc-300">
              Are you sure you want to delete this application? This action cannot be undone.
            </p>

            {deleteErrorMessage ? <p className="mt-3 text-sm text-rose-400">{deleteErrorMessage}</p> : null}

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedApplicationId(null)}
                disabled={isDeleting}
                className="rounded-md border border-white/10 px-3 py-2 text-sm font-medium text-zinc-200 transition-colors hover:border-white/20"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleDeleteConfirm()}
                disabled={isDeleting}
                className="rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-red-500"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <Snackbar
        message="Application deleted successfully"
        visible={showDeleteSuccessSnackbar}
        position="bottom-center"
      />
    </section>
  );
};
