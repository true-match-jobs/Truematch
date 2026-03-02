import { ArrowRight, X } from '@phosphor-icons/react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { ApplicationSummaryCard } from '../../components/application/ApplicationSummaryCard';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { Snackbar } from '../../components/ui/Snackbar';
import { applicationService, type AdminApplicationListItem } from '../../services/application.service';
import { adminUserService } from '../../services/admin-user.service';

const DELETE_SUCCESS_SNACKBAR_DURATION_MS = 4200;

export const AdminDashboardHome = () => {
  const { user } = useAuth();
  const firstName = user?.fullName.trim().split(/\s+/)[0] ?? 'Admin';
  const [applications, setApplications] = useState<AdminApplicationListItem[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
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
        const [applicationsResult, usersResult] = await Promise.all([
          applicationService.getAllForAdmin(),
          adminUserService.getAll()
        ]);

        if (isCancelled) {
          return;
        }

        setApplications(applicationsResult);
        setTotalUsers(usersResult.length);
      } catch (_error) {
        if (isCancelled) {
          return;
        }

        setApplications([]);
        setTotalUsers(0);
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
    }, DELETE_SUCCESS_SNACKBAR_DURATION_MS);

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
    <div className="h-full overflow-y-auto px-3 py-5 sm:px-5">
      <div className="space-y-6">
        <section className="mb-12 px-1 py-1 sm:mb-14">
          <h2 className="text-xl font-semibold tracking-tight text-zinc-100">Welcome back, {firstName}</h2>
          <p className="mt-2 text-sm text-zinc-400">Monitor all submitted applications from here.</p>
        </section>

        <section>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-300">Quick Summary</h3>
          <div className="mt-3 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <article className="glass-border rounded-xl bg-dark-card p-5">
              <p className="text-sm text-zinc-400">Total Applications</p>
              <p className="mt-3 text-2xl font-semibold text-zinc-100">{applications.length}</p>
            </article>

            <article className="glass-border rounded-xl bg-dark-card p-5">
              <p className="text-sm text-zinc-400">Total Users</p>
              <p className="mt-3 text-2xl font-semibold text-zinc-100">{totalUsers}</p>
              <div className="mt-4 flex justify-end">
                <Link
                  to="/admin/dashboard/users"
                  className="inline-flex items-center gap-1 text-sm font-medium text-brand-400 transition-colors hover:text-brand-300"
                >
                  View
                  <ArrowRight size={14} weight="bold" />
                </Link>
              </div>
            </article>
          </div>
        </section>

        <section>
          <h3 className="text-base font-semibold text-zinc-100">All Applications</h3>

          {isLoading ? <LoadingSpinner className="py-10" /> : null}
          {!isLoading && errorMessage ? <p className="mt-4 text-sm text-rose-400">{errorMessage}</p> : null}
          {!isLoading && !errorMessage && !applications.length ? (
            <p className="mt-4 text-sm text-zinc-400">No applications found.</p>
          ) : null}

          {!isLoading && !errorMessage && applications.length ? (
            <div className="space-y-4">
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
        </section>
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
    </div>
  );
};