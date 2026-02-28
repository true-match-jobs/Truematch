import { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { ApplicationSummaryCard } from '../../components/application/ApplicationSummaryCard';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { applicationService, type AdminApplicationListItem } from '../../services/application.service';

export const AdminDashboardHome = () => {
  const { user } = useAuth();
  const firstName = user?.fullName.trim().split(/\s+/)[0] ?? 'Admin';
  const [applications, setApplications] = useState<AdminApplicationListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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

  return (
    <div className="h-full overflow-y-auto px-3 py-5 sm:px-5">
      <div className="space-y-6">
        <section className="mb-12 px-1 py-1 sm:mb-14">
          <h2 className="text-xl font-semibold tracking-tight text-zinc-100">Welcome back, {firstName}</h2>
          <p className="mt-2 text-sm text-zinc-400">Monitor all submitted applications from here.</p>
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
                />
              ))}
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
};