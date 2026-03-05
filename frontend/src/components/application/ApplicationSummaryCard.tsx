import { Check, CopySimple, Trash } from '@phosphor-icons/react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

type ApplicationSummaryCardData = {
  id: string;
  applicationType: 'study_scholarship' | 'work_employment';
  universityName: string | null;
  courseName: string | null;
  skillOrProfession: string | null;
  workCountry?: string | null;
  intake: string | null;
  createdAt: string;
};

type ApplicationSummaryCardProps = {
  application: ApplicationSummaryCardData;
  className?: string;
  linkTo?: string;
  showCopyApplicationId?: boolean;
  applicantFullName?: string;
  showNewBadge?: boolean;
  showDeleteAction?: boolean;
  onDeleteClick?: () => void;
};

const formatDate = (value: string) =>
  new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(new Date(value));

export const ApplicationSummaryCard = ({
  application,
  className = 'mt-4 max-w-2xl',
  linkTo,
  showCopyApplicationId = true,
  applicantFullName,
  showNewBadge = false,
  showDeleteAction = false,
  onDeleteClick
}: ApplicationSummaryCardProps) => {
  const [isCopied, setIsCopied] = useState(false);
  const isStudyApplication = application.applicationType === 'study_scholarship';
  const cardTitle = isStudyApplication
    ? application.universityName || 'Work Application'
    : application.skillOrProfession || 'Work Application';
  const cardDescription = isStudyApplication
    ? application.courseName || application.skillOrProfession || 'N/A'
    : application.workCountry || 'N/A';

  const preventRowNavigation = (event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

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

  const handleDeleteClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    onDeleteClick?.();
  };

  const content = (
    <>
      <div className="flex items-start justify-between gap-3">
        {showCopyApplicationId && isStudyApplication ? (
          <div
            className="inline-flex max-w-full items-center gap-2 rounded-full bg-white/5 px-2.5 py-1 text-xs font-medium text-zinc-300"
            onClick={preventRowNavigation}
          >
            <span className="text-zinc-400">ID:</span>
            <span className="max-w-[190px] truncate text-zinc-200 sm:max-w-[280px]">{application.id}</span>
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
        ) : applicantFullName ? (
          <div className="inline-flex items-center gap-2">
            <p className="text-sm font-medium text-zinc-300">{applicantFullName}</p>
            {showNewBadge ? (
              <span className="inline-flex items-center rounded-full border border-brand-500/40 bg-brand-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand-300">
                New
              </span>
            ) : null}
          </div>
        ) : null}
      </div>

      <div>
        <h3 className="mt-3 text-lg font-semibold text-zinc-100">{cardTitle}</h3>
        <p className="mt-1 text-sm text-zinc-400">{cardDescription}</p>
      </div>

      <div className="mt-5 border-t border-white/10 pt-4">
        {isStudyApplication ? (
          <p className="text-sm font-medium">
            <span className="text-zinc-500">INTAKE:</span> <span className="text-zinc-200">{application.intake || 'N/A'}</span>
          </p>
        ) : null}
        <p className="mt-2 text-sm font-medium">
          <span className="text-zinc-500">CREATED:</span> <span className="text-zinc-200">{formatDate(application.createdAt)}</span>
        </p>

        {showDeleteAction ? (
          <div className="mt-3">
            <button
              type="button"
              onClick={handleDeleteClick}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-red-400 transition-colors hover:text-red-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
              aria-label="Delete application"
              title="Delete application"
            >
              <Trash size={18} weight="bold" />
            </button>
          </div>
        ) : null}
      </div>
    </>
  );

  if (!linkTo) {
    return <article className={`block rounded-xl border border-white/10 bg-dark-card p-5 sm:p-6 ${className}`}>{content}</article>;
  }

  return (
    <Link to={linkTo} className={`block rounded-xl border border-white/10 bg-dark-card p-5 transition-colors hover:border-white/20 sm:p-6 ${className}`}>
      {content}
    </Link>
  );
};
