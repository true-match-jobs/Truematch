import { X } from '@phosphor-icons/react';
import { useEffect, useState } from 'react';
import { Footer } from '../../components/layout/Footer';
import { Navbar } from '../../components/layout/Navbar';
import { ApplicationSummaryCard } from '../../components/application/ApplicationSummaryCard';
import { Breadcrumbs } from '../../components/ui/Breadcrumbs';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { Snackbar } from '../../components/ui/Snackbar';
import { SNACKBAR_AUTO_DISMISS_DELAY_MS } from '../../constants/snackbar';
import { applicationService, type AdminApplicationListItem } from '../../services/application.service';

export const AdminAllApplicationsPage = () => {
  const [applications, setApplications] = useState<AdminApplicationListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedApplicationId, setSelectedApplicationId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteErrorMessage, setDeleteErrorMessage] = useState<string | null>(null);
  const [showDeleteSuccessSnackbar, setShowDeleteSuccessSnackbar] = useState(false);

  const selectedApplication = selectedApplicationId
    ? applications.find((application) => application.id === selectedApplicationId) ?? null
    : null;

  useEffect(() => {
    let isCancelled = false;

    const loadApplications = async () => {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const result = await applicationService.getAllForAdmin();

        if (isCancelled) {
          return;
        }

        setApplications(result);
      } catch (_error) {
        if (isCancelled) {
          return;
        }

        setApplications([]);
        setErrorMessage('Unable to load applications right now.');
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadApplications();

    return () => {
      isCancelled = true;
    };
  }, []);

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
      await applicationService.deleteByIdForAdmin(selectedApplication.id);
      setSelectedApplicationId(null);
      setShowDeleteSuccessSnackbar(true);
      setApplications((previousApplications) =>
        previousApplications.filter((application) => application.id !== selectedApplication.id)
      );
    } catch (_error) {
      setDeleteErrorMessage('Unable to delete application right now. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-dark-bg">
      <Navbar />

      <main className="flex-1 px-4 py-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <Breadcrumbs
            items={[
              { label: 'Dashboard', href: '/admin/dashboard' },
              { label: 'Applications' }
            ]}
          />

          <div className="mt-4 rounded-xl border border-white/10 bg-dark-card p-6">
            <h1 className="text-lg font-semibold text-zinc-100">All Applications</h1>
            <p className="mt-2 text-sm text-zinc-400">Review submitted applications and remove invalid records when needed.</p>

            {isLoading ? <LoadingSpinner className="py-10" /> : null}
            {!isLoading && errorMessage ? <p className="mt-4 text-sm text-rose-400">{errorMessage}</p> : null}
            {!isLoading && !errorMessage && !applications.length ? (
              <p className="mt-4 text-sm text-zinc-400">No applications found.</p>
            ) : null}

            {!isLoading && !errorMessage && applications.length ? (
              <div className="mt-6 space-y-4">
                {applications.map((application) => (
                  <ApplicationSummaryCard
                    key={application.id}
                    application={application}
                    linkTo={`/admin/applications/${application.id}`}
                    className="max-w-3xl"
                    showCopyApplicationId={false}
                    applicantFullName={application.user.fullName}
                    showNewBadge={!application.hasAdminViewed}
                    showDeleteAction
                    onDeleteClick={() => setSelectedApplicationId(application.id)}
                  />
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </main>

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
      <Footer />
    </div>
  );
};
