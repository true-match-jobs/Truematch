import { X } from '@phosphor-icons/react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ApplicationSummaryCard } from '../../components/application/ApplicationSummaryCard';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { useDashboardData } from '../../hooks/useDashboardData';

export const DashboardApplicationsPage = () => {
  const { profile, isLoading: loading, errorMessage } = useDashboardData();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const application = profile?.application;

  const handleDeleteConfirm = () => {
    setIsDeleteModalOpen(false);
  };

  return (
    <section className="flex h-full min-h-0 flex-col">
      <div className="flex-1 min-h-0 overflow-y-auto px-3 pt-5 pb-3">
        <h2 className="text-base font-semibold text-zinc-100">My applications</h2>

        {loading ? <LoadingSpinner className="mt-4 py-10" /> : null}
        {errorMessage ? <p className="mt-4 text-sm text-rose-400">{errorMessage}</p> : null}
        {!loading && !errorMessage && !application ? (
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

        {!loading && !errorMessage && application ? (
          <ApplicationSummaryCard
            application={application}
            linkTo={`/applications/${application.id}`}
            className="mt-4 max-w-2xl"
            showDeleteAction
            onDeleteClick={() => setIsDeleteModalOpen(true)}
          />
        ) : null}
      </div>

      {isDeleteModalOpen && application ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-application-title"
          onClick={() => setIsDeleteModalOpen(false)}
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
                onClick={() => setIsDeleteModalOpen(false)}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-zinc-400 transition-colors hover:text-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                aria-label="Close delete confirmation"
              >
                <X size={14} weight="bold" />
              </button>
            </div>

            <p className="mt-3 text-sm text-zinc-300">
              Are you sure you want to delete this application? This action will be connected to backend deletion later.
            </p>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="rounded-md border border-white/10 px-3 py-2 text-sm font-medium text-zinc-200 transition-colors hover:border-white/20"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-red-500"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
};
