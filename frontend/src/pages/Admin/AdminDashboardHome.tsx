import { ArrowRight } from '@phosphor-icons/react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { applicationService, type AdminApplicationListItem } from '../../services/application.service';
import { adminUserService } from '../../services/admin-user.service';

const ADMIN_HOME_CACHE_TTL_MS = 60_000;

let adminHomeCache: {
  applications: AdminApplicationListItem[];
  totalUsers: number;
  cachedAt: number;
} | null = null;

const getCachedAdminHomeData = (): {
  applications: AdminApplicationListItem[];
  totalUsers: number;
} | null => {
  if (!adminHomeCache) {
    return null;
  }

  const isFresh = Date.now() - adminHomeCache.cachedAt < ADMIN_HOME_CACHE_TTL_MS;

  if (!isFresh) {
    return null;
  }

  return {
    applications: adminHomeCache.applications,
    totalUsers: adminHomeCache.totalUsers
  };
};

const setCachedAdminHomeData = (applications: AdminApplicationListItem[], totalUsers: number): void => {
  adminHomeCache = {
    applications,
    totalUsers,
    cachedAt: Date.now()
  };
};

export const AdminDashboardHome = () => {
  const cachedData = getCachedAdminHomeData();
  const [applications, setApplications] = useState<AdminApplicationListItem[]>(cachedData?.applications ?? []);
  const [totalUsers, setTotalUsers] = useState(cachedData?.totalUsers ?? 0);
  const [isSummaryLoading, setIsSummaryLoading] = useState(!cachedData);

  useEffect(() => {
    let isCancelled = false;

    const loadApplications = async () => {
      setIsSummaryLoading((current) => current || !cachedData);

      try {
        const [applicationsResult, usersResult] = await Promise.all([
          applicationService.getAllForAdmin(),
          adminUserService.getAll()
        ]);

        if (isCancelled) {
          return;
        }

        setCachedAdminHomeData(applicationsResult, usersResult.length);
        setApplications(applicationsResult);
        setTotalUsers(usersResult.length);
      } catch (_error) {
        if (isCancelled) {
          return;
        }

        setApplications([]);
        setTotalUsers(0);
      } finally {
        if (!isCancelled) {
          setIsSummaryLoading(false);
        }
      }
    };

    void loadApplications();

    return () => {
      isCancelled = true;
    };
  }, []);

  return (
    <div className="h-full overflow-y-auto px-3 py-5 pb-3 sm:px-5">
      <div className="space-y-6">
        <section className="mb-12 px-1 py-1 sm:mb-14">
          <p className="text-sm text-zinc-400">Monitor submitted applications and user activity from this dashboard.</p>
        </section>

        <section>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-300">Quick Summary</h3>
          <div className="mt-3 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <article className="glass-border rounded-xl bg-dark-card p-5">
              <p className="text-sm text-zinc-400">Total Applications</p>
              <div className="mt-3 min-h-8 flex items-center">
                {isSummaryLoading ? (
                  <span
                    className="inline-flex h-5 w-5 animate-spin rounded-full border-2 border-zinc-500/40 border-t-zinc-200"
                    aria-label="Loading total applications"
                  />
                ) : (
                  <p className="text-2xl font-semibold text-zinc-100">{applications.length}</p>
                )}
              </div>
              <div className="mt-4 flex justify-end">
                <Link
                  to="/admin/dashboard/applications"
                  className="inline-flex items-center gap-1 text-sm font-medium text-brand-400 transition-colors hover:text-brand-300"
                >
                  View
                  <ArrowRight size={14} weight="bold" />
                </Link>
              </div>
            </article>

            <article className="glass-border rounded-xl bg-dark-card p-5">
              <p className="text-sm text-zinc-400">Total Users</p>
              <div className="mt-3 min-h-8 flex items-center">
                {isSummaryLoading ? (
                  <span
                    className="inline-flex h-5 w-5 animate-spin rounded-full border-2 border-zinc-500/40 border-t-zinc-200"
                    aria-label="Loading total users"
                  />
                ) : (
                  <p className="text-2xl font-semibold text-zinc-100">{totalUsers}</p>
                )}
              </div>
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
      </div>
    </div>
  );
};