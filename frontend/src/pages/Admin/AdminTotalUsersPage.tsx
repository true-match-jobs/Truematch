import { X } from '@phosphor-icons/react';
import { useEffect, useState } from 'react';
import { Footer } from '../../components/layout/Footer';
import { Navbar } from '../../components/layout/Navbar';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { Snackbar } from '../../components/ui/Snackbar';
import { adminUserService, type AdminUserListItem } from '../../services/admin-user.service';

const DELETE_SUCCESS_SNACKBAR_DURATION_MS = 4200;

const formatDate = (value: string) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'N/A';
  }

  return date.toLocaleDateString();
};

export const AdminTotalUsersPage = () => {
  const [users, setUsers] = useState<AdminUserListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteErrorMessage, setDeleteErrorMessage] = useState<string | null>(null);
  const [showDeleteSuccessSnackbar, setShowDeleteSuccessSnackbar] = useState(false);

  const selectedUser = selectedUserId ? users.find((user) => user.id === selectedUserId) ?? null : null;

  useEffect(() => {
    let isCancelled = false;

    const loadUsers = async () => {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const result = await adminUserService.getAll();

        if (isCancelled) {
          return;
        }

        setUsers(result);
      } catch (_error) {
        if (isCancelled) {
          return;
        }

        setUsers([]);
        setErrorMessage('Unable to load users right now.');
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadUsers();

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
    if (!selectedUser) {
      return;
    }

    try {
      setIsDeleting(true);
      setDeleteErrorMessage(null);
      await adminUserService.deleteById(selectedUser.id);
      setSelectedUserId(null);
      setShowDeleteSuccessSnackbar(true);
      setUsers((previousUsers) => previousUsers.filter((user) => user.id !== selectedUser.id));
    } catch (_error) {
      setDeleteErrorMessage('Unable to block user right now. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-dark-bg">
      <Navbar />

      <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl rounded-xl border border-white/10 bg-dark-card p-6">
          <h1 className="text-lg font-semibold text-zinc-100">Total Users</h1>
          <p className="mt-2 text-sm text-zinc-400">Review basic user information and block users when needed.</p>

          {isLoading ? <LoadingSpinner className="py-8" /> : null}

          {!isLoading && errorMessage ? <p className="mt-4 text-sm text-rose-400">{errorMessage}</p> : null}

          {!isLoading && !errorMessage && users.length === 0 ? (
            <p className="mt-4 text-sm text-zinc-400">No users found.</p>
          ) : null}

          {!isLoading && !errorMessage && users.length > 0 ? (
            <div className="mt-6 space-y-4">
              {users.map((user) => (
                <article key={user.id} className="rounded-xl border border-white/10 bg-dark-surface p-4">
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-zinc-500">Full Name</p>
                      <p className="mt-1 text-sm font-medium text-zinc-200">{user.fullName}</p>
                    </div>

                    <div>
                      <p className="text-xs uppercase tracking-wide text-zinc-500">Email</p>
                      <p className="mt-1 text-sm font-medium text-zinc-200">{user.email}</p>
                    </div>

                    <div>
                      <p className="text-xs uppercase tracking-wide text-zinc-500">Applications</p>
                      <p className="mt-1 text-sm font-medium text-zinc-200">{user.applicationsCount}</p>
                    </div>

                    <div>
                      <p className="text-xs uppercase tracking-wide text-zinc-500">Joined</p>
                      <p className="mt-1 text-sm font-medium text-zinc-200">{formatDate(user.createdAt)}</p>
                    </div>

                    <div>
                      <p className="text-xs uppercase tracking-wide text-zinc-500">Email Verification</p>
                      <p className="mt-1 text-sm font-medium text-zinc-200">{user.emailVerifiedAt ? 'Verified' : 'Not verified'}</p>
                    </div>

                    <div>
                      <p className="text-xs uppercase tracking-wide text-zinc-500">Dashboard Visited</p>
                      <p className="mt-1 text-sm font-medium text-zinc-200">{user.hasVisitedDashboard ? 'Yes' : 'No'}</p>
                    </div>
                  </div>

                  <div className="mt-4 border-t border-white/10 pt-4">
                    <button
                      type="button"
                      onClick={() => setSelectedUserId(user.id)}
                      className="rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-red-500"
                    >
                      Block user
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : null}
        </div>
      </main>

      {selectedUser ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-user-title"
          onClick={() => setSelectedUserId(null)}
        >
          <div className="w-full max-w-md rounded-xl bg-zinc-800 p-5 shadow-lg sm:p-6" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-start justify-between gap-3">
              <h3 id="delete-user-title" className="text-base font-semibold text-zinc-100">
                Block user?
              </h3>
              <button
                type="button"
                onClick={() => setSelectedUserId(null)}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-zinc-400 transition-colors hover:text-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                aria-label="Close block user confirmation"
              >
                <X size={14} weight="bold" />
              </button>
            </div>

            <p className="mt-3 text-sm text-zinc-300">
              Are you sure you want to block this user? This will permanently delete the user and all associated applications.
            </p>

            {deleteErrorMessage ? <p className="mt-3 text-sm text-rose-400">{deleteErrorMessage}</p> : null}

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedUserId(null)}
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
                {isDeleting ? 'Blocking...' : 'Block user'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <Snackbar message="User blocked successfully" visible={showDeleteSuccessSnackbar} position="bottom-center" />
      <Footer />
    </div>
  );
};
