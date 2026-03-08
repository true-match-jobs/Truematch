import { ArrowRight, Check, CopySimple, RadioButton } from '@phosphor-icons/react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Footer } from '../../components/layout/Footer';
import { Navbar } from '../../components/layout/Navbar';
import { Breadcrumbs } from '../../components/ui/Breadcrumbs';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { Snackbar } from '../../components/ui/Snackbar';
import { SNACKBAR_AUTO_DISMISS_DELAY_MS } from '../../constants/snackbar';
import { applicationService, type AdminApplicationDetails } from '../../services/application.service';
import { APPLICATION_STATUS, type ApplicationStatus } from '../../../../shared/applicationStatus';

const STATUS_ORDER = [
  APPLICATION_STATUS.APPLICATION_PENDING,
  APPLICATION_STATUS.SUBMITTED_TO_UNIVERSITY,
  APPLICATION_STATUS.UNDER_REVIEW,
  APPLICATION_STATUS.OFFER_ISSUED
] as const;

const ADMIN_PROGRESS_OPTIONS: ReadonlyArray<{
  label: string;
  value: (typeof STATUS_ORDER)[number];
}> = [
  { label: 'Submitted to University', value: APPLICATION_STATUS.SUBMITTED_TO_UNIVERSITY },
  { label: 'Under Review', value: APPLICATION_STATUS.UNDER_REVIEW },
  { label: 'Offer Issued', value: APPLICATION_STATUS.OFFER_ISSUED }
];

const formatApplicationType = (value: string) => {
  if (value === 'study_scholarship') {
    return 'Study Scholarship';
  }

  if (value === 'work_employment') {
    return 'Work Employment';
  }

  return value
    .replace(/[_-]+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const formatDocumentValue = (value: string | null) => {
  if (!value) {
    return 'Not uploaded';
  }

  try {
    const url = new URL(value);
    const segments = url.pathname.split('/').filter(Boolean);
    const fileName = segments[segments.length - 1];
    return decodeURIComponent(fileName ?? value);
  } catch (_error) {
    return value;
  }
};

const MAX_EMAIL_DISPLAY_LENGTH = 26;

const truncateText = (value: string, maxLength: number) => {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength)}...`;
};

export const AdminApplicationDetailsPage = () => {
  const { applicationId } = useParams();
  const [application, setApplication] = useState<AdminApplicationDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusUpdateError, setStatusUpdateError] = useState<string | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [showStatusSuccessToast, setShowStatusSuccessToast] = useState(false);
  const [copiedUserEmail, setCopiedUserEmail] = useState<string | null>(null);
  const [copiedApplicationId, setCopiedApplicationId] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    const loadApplicationDetails = async () => {
      if (!applicationId) {
        setErrorMessage('Application id is required.');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setErrorMessage(null);

      try {
        const result = await applicationService.getByIdForAdmin(applicationId);

        if (isCancelled) {
          return;
        }

        setApplication(result);
      } catch (error) {
        if (isCancelled) {
          return;
        }

        const apiStatus =
          typeof error === 'object' && error !== null && 'response' in error
            ? (error as { response?: { status?: number } }).response?.status
            : undefined;
        const apiMessage =
          typeof error === 'object' && error !== null && 'response' in error
            ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
            : undefined;

        setApplication(null);
        setErrorMessage(apiStatus === 404 ? 'Application not found.' : apiMessage || 'Unable to load application details.');
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadApplicationDetails();

    return () => {
      isCancelled = true;
    };
  }, [applicationId]);

  useEffect(() => {
    if (!showStatusSuccessToast) {
      return;
    }

    const timer = window.setTimeout(() => {
      setShowStatusSuccessToast(false);
    }, SNACKBAR_AUTO_DISMISS_DELAY_MS);

    return () => {
      window.clearTimeout(timer);
    };
  }, [showStatusSuccessToast]);

  const handleStatusChange = async (nextStatus: ApplicationStatus) => {
    if (!application || isUpdatingStatus) {
      return;
    }

    if (application.applicationType !== 'study_scholarship' || !application.applicationStatus) {
      return;
    }

    const previousStatus = application.applicationStatus;
    const currentIndex = STATUS_ORDER.indexOf(application.applicationStatus);
    const nextIndex = STATUS_ORDER.indexOf(nextStatus);

    if (currentIndex === -1 || nextIndex === -1) {
      return;
    }

    if (nextIndex !== currentIndex + 1) {
      return;
    }

    setStatusUpdateError(null);
    setIsUpdatingStatus(true);
    setApplication((previous) => {
      if (!previous) {
        return previous;
      }

      return {
        ...previous,
        applicationStatus: nextStatus
      };
    });

    try {
      await applicationService.updateStatusForAdmin(application.id, nextStatus);

      setApplication((previous) => {
        if (!previous) {
          return previous;
        }

        return {
          ...previous,
          applicationStatus: nextStatus
        };
      });
      setShowStatusSuccessToast(true);
    } catch (_error) {
      setApplication((previous) => {
        if (!previous) {
          return previous;
        }

        return {
          ...previous,
          applicationStatus: previousStatus
        };
      });
      setStatusUpdateError('Failed to update status. Please try again.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleCopyUserEmail = async (event: React.MouseEvent<HTMLButtonElement>, email: string) => {
    event.preventDefault();
    event.stopPropagation();

    try {
      await navigator.clipboard.writeText(email);
      setCopiedUserEmail(email);
      window.setTimeout(() => {
        setCopiedUserEmail(null);
      }, 1400);
    } catch (_error) {
      setCopiedUserEmail(null);
    }
  };

  const handleCopyApplicationId = async (event: React.MouseEvent<HTMLButtonElement>, id: string) => {
    event.preventDefault();
    event.stopPropagation();

    try {
      await navigator.clipboard.writeText(id);
      setCopiedApplicationId(id);
      window.setTimeout(() => {
        setCopiedApplicationId(null);
      }, 1400);
    } catch (_error) {
      setCopiedApplicationId(null);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-dark-bg">
      <Navbar />

      <main className="flex-1 px-4 py-4 sm:px-6 lg:px-8">
        <Snackbar message="Application status updated" visible={showStatusSuccessToast} />

        <div className="mx-auto max-w-4xl">
          <Breadcrumbs
            items={[
              { label: 'Dashboard', href: '/admin/dashboard' },
              { label: 'Applications', href: '/admin/dashboard/applications' },
              { label: 'Details' }
            ]}
          />

          <div className="mt-4 rounded-xl border border-white/10 bg-dark-card p-6">
            {isLoading ? <LoadingSpinner className="py-8" /> : null}

            {!isLoading && errorMessage ? (
              <>
                <h1 className="text-lg font-semibold text-zinc-100">Application not found</h1>
                <p className="mt-2 text-sm text-zinc-400">{errorMessage}</p>
              </>
            ) : null}

            {!isLoading && !errorMessage && application ? (
              <>
                <h1 className="text-lg font-semibold text-zinc-100">Personal Information</h1>

              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                <div>
                  <p className="text-xs uppercase tracking-wide text-zinc-500">Full Name</p>
                  <p className="mt-1 text-sm font-medium text-zinc-200">{application.user.fullName}</p>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wide text-zinc-500">Email</p>
                  <div className="mt-1 inline-flex max-w-full items-center gap-2 text-sm font-medium text-zinc-200">
                    <span className="w-[170px] truncate sm:w-[220px]">
                      {truncateText(application.user.email, MAX_EMAIL_DISPLAY_LENGTH)}
                    </span>
                    <button
                      type="button"
                      onClick={(event) => void handleCopyUserEmail(event, application.user.email)}
                      className="inline-flex h-5 w-5 items-center justify-center rounded text-zinc-400 transition-colors hover:text-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                      aria-label="Copy user email"
                      title="Copy user email"
                    >
                      {copiedUserEmail === application.user.email ? (
                        <Check size={13} weight="bold" />
                      ) : (
                        <CopySimple size={13} weight="bold" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wide text-zinc-500">Country</p>
                  <p className="mt-1 text-sm font-medium text-zinc-200">{application.countryOfResidence}</p>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wide text-zinc-500">Application Type</p>
                  <p className="mt-1 text-sm font-medium text-zinc-200">{formatApplicationType(application.applicationType)}</p>
                </div>

                <div className="sm:col-span-2">
                  <p className="text-xs uppercase tracking-wide text-zinc-500">Application ID</p>
                  <div className="mt-1 inline-flex max-w-full items-center gap-2 rounded-full bg-white/5 px-2.5 py-1 text-xs font-medium text-zinc-300">
                    <span className="text-zinc-400">ID:</span>
                    <span className="max-w-[190px] truncate text-zinc-200 sm:max-w-[280px]">{application.id}</span>
                    <button
                      type="button"
                      onClick={(event) => void handleCopyApplicationId(event, application.id)}
                      className="inline-flex h-5 w-5 items-center justify-center rounded text-zinc-400 transition-colors hover:text-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                      aria-label="Copy application ID"
                      title="Copy application ID"
                    >
                      {copiedApplicationId === application.id ? (
                        <Check size={13} weight="bold" />
                      ) : (
                        <CopySimple size={13} weight="bold" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-start justify-between gap-3 sm:col-span-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs uppercase tracking-wide text-zinc-100">International Passport</p>
                    <p className="mt-1 max-w-full truncate text-sm font-medium text-zinc-500">
                      {formatDocumentValue(application.internationalPassportUrl)}
                    </p>
                  </div>

                  {application.internationalPassportUrl ? (
                    <a
                      href={application.internationalPassportUrl}
                      target="_blank"
                      rel="noreferrer"
                      download
                      className="mt-0.5 shrink-0 rounded-md bg-brand-600 px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-brand-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-dark-bg"
                    >
                      Download
                    </a>
                  ) : null}
                </div>
              </div>

              <div className="mt-6 border-t border-white/10" aria-hidden />

              {application.applicationType === 'study_scholarship' && application.applicationStatus ? (
                <section className="mt-6">
                  <h2 className="text-sm font-semibold text-zinc-100">Application Progress Control</h2>
                  {(() => {
                    const currentStatus = application.applicationStatus;

                    return (
                      <div className="mt-3 space-y-3">
                        {ADMIN_PROGRESS_OPTIONS.map((option) => {
                          const currentIndex = STATUS_ORDER.indexOf(currentStatus);
                          const stageIndex = STATUS_ORDER.indexOf(option.value);
                          const normalizedCurrentIndex = currentIndex >= 0 ? currentIndex : 0;
                          const isCompleted =
                            normalizedCurrentIndex >= 1 && stageIndex >= 1 && stageIndex <= normalizedCurrentIndex;
                          const isCurrent =
                            normalizedCurrentIndex < STATUS_ORDER.length - 1 && stageIndex === normalizedCurrentIndex + 1;
                          const disabled = isUpdatingStatus || !isCurrent;
                          const iconClassName = disabled ? 'text-zinc-500' : 'text-brand-500';

                          return (
                            <label
                              key={option.value}
                              className={`flex items-center gap-3 text-sm ${
                                disabled ? 'cursor-not-allowed text-zinc-500' : 'cursor-pointer text-zinc-200'
                              }`}
                            >
                              <input
                                type="radio"
                                name="applicationProgressControl"
                                value={option.value}
                                checked={false}
                                disabled={disabled}
                                onChange={() => {
                                  void handleStatusChange(option.value);
                                }}
                                className="sr-only"
                              />
                              <RadioButton
                                size={18}
                                weight={isCompleted ? 'fill' : 'regular'}
                                className={iconClassName}
                                aria-hidden
                              />
                              <span>{option.label}</span>
                            </label>
                          );
                        })}
                      </div>
                    );
                  })()}

                  {statusUpdateError ? <p className="mt-2 text-xs text-red-400">{statusUpdateError}</p> : null}
                </section>
              ) : null}

                <div className="mt-4 flex justify-end">
                  <Link
                    to={`/chat/${application.user.id}`}
                    className="inline-flex items-center gap-1 text-sm font-medium text-brand-400 transition-colors hover:text-brand-300"
                  >
                    Go to chat
                    <ArrowRight size={14} weight="bold" />
                  </Link>
                </div>
              </>
            ) : null}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};
