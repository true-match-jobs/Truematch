import { X } from '@phosphor-icons/react';
import {
  APPLICATION_STATUS,
  STATUS_STEPS,
  type ApplicationStatus
} from '../../../../shared/applicationStatus';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  applicationStatus: ApplicationStatus;
  universityName: string;
  universityCountry?: string | null;
};

const STATUS_LABELS: Record<ApplicationStatus, string> = {
  [APPLICATION_STATUS.APPLICATION_PENDING]: 'Application Pending',
  [APPLICATION_STATUS.SUBMITTED_TO_UNIVERSITY]: 'Submitted to University',
  [APPLICATION_STATUS.UNDER_REVIEW]: 'Under Review',
  [APPLICATION_STATUS.OFFER_ISSUED]: 'Offer Issued'
};

const getOfferIssuedLabelByCountry = (universityCountry?: string | null) => {
  const normalizedCountry = universityCountry?.trim().toLowerCase();

  if (normalizedCountry === 'united states') {
    return 'Admission Letter';
  }

  if (normalizedCountry === 'canada') {
    return 'Letter of Acceptance (LOA)';
  }

  if (normalizedCountry === 'united kingdom' || normalizedCountry === 'australia') {
    return 'Offer Letter';
  }

  return STATUS_LABELS[APPLICATION_STATUS.OFFER_ISSUED];
};

const getStatusLabel = (step: ApplicationStatus, universityCountry?: string | null) => {
  if (step === APPLICATION_STATUS.OFFER_ISSUED) {
    return getOfferIssuedLabelByCountry(universityCountry);
  }

  return STATUS_LABELS[step];
};

const getCompletedStageDescription = (step: ApplicationStatus, universityName: string): string => {
  switch (step) {
    case APPLICATION_STATUS.APPLICATION_PENDING:
      return `Your application has been received and is being prepared for submission to ${universityName}.`;
    case APPLICATION_STATUS.SUBMITTED_TO_UNIVERSITY:
      return `Your application has been submitted to ${universityName}.`;
    case APPLICATION_STATUS.UNDER_REVIEW:
      return `${universityName} is currently reviewing your application.`;
    case APPLICATION_STATUS.OFFER_ISSUED:
      return `${universityName} has issued your offer.`;
    default:
      return '';
  }
};

export const ApplicationProgressModal = ({ isOpen, onClose, applicationStatus, universityName, universityCountry }: Props) => {
  if (!isOpen) {
    return null;
  }

  const currentIndex = STATUS_STEPS.indexOf(applicationStatus);
  const resolvedCompletedIndex = currentIndex >= 0 ? currentIndex : 0;
  const nextCurrentIndex = resolvedCompletedIndex + 1;
  const isFinalStageReached = resolvedCompletedIndex >= STATUS_STEPS.length - 1;
  const resolvedUniversityName = universityName.trim();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="application-progress-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-xl border border-white/10 bg-dark-card p-5 sm:p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 id="application-progress-title" className="text-base font-semibold text-zinc-100">
              Application Progress
            </h3>
            <p className="mt-1 text-sm text-zinc-400">Track your current application stage.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-zinc-400 transition-colors hover:bg-white/15 hover:text-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
            aria-label="Close tracker"
          >
            <X size={16} weight="bold" />
          </button>
        </div>

        <div className="mt-5">
          {STATUS_STEPS.map((step, index) => {
            const isCompleted = isFinalStageReached ? true : index <= resolvedCompletedIndex;
            const isCurrent = isFinalStageReached ? false : index === nextCurrentIndex;
            const description = isCompleted ? 'Completed' : isCurrent ? 'Current stage' : 'Pending';
            const isLast = index === STATUS_STEPS.length - 1;

            return (
              <div key={step} className={`relative flex gap-3 ${isLast ? '' : 'pb-6'}`}>
                <div className="relative flex w-7 shrink-0 justify-center">
                  <div
                    className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                      isCompleted ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'
                    }`}
                  >
                    {index + 1}
                  </div>
                  {!isLast ? <div className="absolute -bottom-6 left-1/2 top-7 w-px -translate-x-1/2 bg-white/15" /> : null}
                </div>
                <div className="pt-0.5">
                  <p className="text-sm font-medium text-zinc-100">{getStatusLabel(step, universityCountry)}</p>
                  <p className="mt-0.5 text-xs uppercase tracking-wide text-zinc-400">{description}</p>
                  {isCompleted ? (
                    <p className="mt-1 text-xs text-zinc-400">{getCompletedStageDescription(step, resolvedUniversityName)}</p>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};