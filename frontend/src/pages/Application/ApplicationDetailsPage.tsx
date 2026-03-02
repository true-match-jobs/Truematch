import { useState } from 'react';
import { Question, X } from '@phosphor-icons/react';
import { useParams } from 'react-router-dom';
import {
  APPLICATION_STATUS,
  type ApplicationStatus
} from '../../../../shared/applicationStatus';
import { ApplicationProgressModal } from '../../components/application/ApplicationProgressModal';
import { Footer } from '../../components/layout/Footer';
import { Navbar } from '../../components/layout/Navbar';
import { useDashboardData } from '../../hooks/useDashboardData';
import { applicationService } from '../../services/application.service';
import type { Application, ApplicationDocumentType } from '../../types/user';

const APPLICATION_DETAILS = {
  'app-001': {
    applicationStatus: APPLICATION_STATUS.UNDER_REVIEW,
    universityName: 'University of Manchester',
    degree: 'MSc Data Science',
    applicationSummary: {
      applicationId: 'APP-001',
      universityName: 'University of Manchester',
      universityCountry: 'United Kingdom',
      courseName: 'Data Science',
      degreeType: 'MSc',
      studyMode: 'Full-time',
      intake: 'September 2026',
      currentApplicationStatus: 'Under review',
      assignedAdmissionOfficer: 'TBD',
      offerType: 'Conditional',
      offerDate: 'Pending',
      countrySpecificOfferDocumentLabel: 'CAS',
      countrySpecificOfferDocumentValue: 'Pending'
    },
    documents: [
      { documentName: 'International Passport', documentUploaded: 'my_passport.pdf' },
      { documentName: 'Academic Transcript(s)', documentUploaded: 'my_academic_transcript.pdf' },
      { documentName: 'Degree Certificate(s)', documentUploaded: 'my_degree_certificate.pdf' },
      { documentName: 'IELTS/TOEFL Certificate', documentUploaded: 'my_ielts_result.pdf' },
      { documentName: 'Statement of Purpose (SOP)', documentUploaded: 'my_sop.pdf' },
      { documentName: 'CV', documentUploaded: 'my_cv.pdf' },
      { documentName: 'Reference Letter(s)', documentUploaded: 'my_reference_letter.pdf' },
      { documentName: 'Portfolio', documentUploaded: 'portfolio.pdf' },
      { documentName: 'Application Fee Receipt', documentUploaded: 'application_fee_receipt.pdf' }
    ],
    financialInformation: [
      { documentName: 'Proof of Funds', documentUploaded: 'proof_of_funds.pdf' }
    ]
  }
};

type DocumentFieldConfig = {
  documentType: ApplicationDocumentType;
  documentName: string;
  field: keyof Pick<
    Application,
    | 'internationalPassportUrl'
    | 'academicTranscriptsUrl'
    | 'degreeCertificatesUrl'
    | 'ieltsToeflCertificateUrl'
    | 'statementOfPurposeUrl'
    | 'curriculumVitaeUrl'
    | 'referenceLettersUrl'
    | 'portfolioUrl'
    | 'applicationFeeReceiptUrl'
    | 'proofOfFundsUrl'
  >;
};

const DOCUMENT_FIELDS: DocumentFieldConfig[] = [
  { documentType: 'internationalPassport', documentName: 'International Passport', field: 'internationalPassportUrl' },
  { documentType: 'academicTranscripts', documentName: 'Academic Transcript(s)', field: 'academicTranscriptsUrl' },
  { documentType: 'degreeCertificates', documentName: 'Degree Certificate(s)', field: 'degreeCertificatesUrl' },
  { documentType: 'ieltsToeflCertificate', documentName: 'IELTS/TOEFL Certificate', field: 'ieltsToeflCertificateUrl' },
  { documentType: 'statementOfPurpose', documentName: 'Statement of Purpose (SOP)', field: 'statementOfPurposeUrl' },
  { documentType: 'curriculumVitae', documentName: 'CV', field: 'curriculumVitaeUrl' },
  { documentType: 'referenceLetters', documentName: 'Reference Letter(s)', field: 'referenceLettersUrl' },
  { documentType: 'portfolio', documentName: 'Portfolio', field: 'portfolioUrl' },
  { documentType: 'applicationFeeReceipt', documentName: 'Application Fee Receipt', field: 'applicationFeeReceiptUrl' }
];

const FINANCIAL_FIELDS: DocumentFieldConfig[] = [
  { documentType: 'proofOfFunds', documentName: 'Proof of Funds', field: 'proofOfFundsUrl' }
];

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

const renderDocumentLabel = (documentName: string) => documentName;

const formatApplicationStatus = (value: ApplicationStatus) => value.toLowerCase().replace(/_/g, ' ');

const getCountrySpecificOfferDocument = (application: Application) => {
  const normalizedCountry = application.universityCountry?.trim().toLowerCase();

  if (normalizedCountry === 'united kingdom') {
    return {
      label: 'CAS',
      value: application.ukCasStatus || 'Pending'
    };
  }

  if (normalizedCountry === 'australia') {
    return {
      label: 'CoE',
      value: application.australiaCoeStatus || 'Pending'
    };
  }

  if (normalizedCountry === 'united states') {
    return {
      label: 'I-20',
      value: application.usaI20Status || 'Pending'
    };
  }

  if (normalizedCountry === 'canada') {
    return {
      label: 'LOA',
      value: application.canadaLoaStatus || 'Pending'
    };
  }

  return null;
};

const mapApplicationToDetails = (application: Application, assignedAdmissionOfficerName: string) => {
  const countrySpecificOfferDocument = getCountrySpecificOfferDocument(application);

  return {
    applicationStatus: application.applicationStatus,
    universityName: application.universityName || 'Work Application',
    degree: application.degreeType || application.skillOrProfession || 'Application',
    applicationSummary: {
      applicationId: application.id,
      universityName: application.universityName || 'N/A',
      universityCountry: application.universityCountry || 'N/A',
      courseName: application.courseName || application.skillOrProfession || 'N/A',
      degreeType: application.degreeType || 'N/A',
      studyMode: application.studyMode || 'N/A',
      intake: application.intake || 'N/A',
      currentApplicationStatus: formatApplicationStatus(application.applicationStatus),
      assignedAdmissionOfficer: assignedAdmissionOfficerName,
      offerType: 'Pending',
      offerDate: 'Pending',
      countrySpecificOfferDocumentLabel: countrySpecificOfferDocument?.label ?? null,
      countrySpecificOfferDocumentValue: countrySpecificOfferDocument?.value ?? null
    },
    documents: [] as Array<{ documentName: string; documentUploaded: string }>,
    financialInformation: [] as Array<{ documentName: string; documentUploaded: string }>
  };
};

export const ApplicationDetailsPage = () => {
  const [isTrackerOpen, setIsTrackerOpen] = useState(false);
  const [isOfferInfoOpen, setIsOfferInfoOpen] = useState(false);
  const [isUploading, setIsUploading] = useState<ApplicationDocumentType | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const { profile, isLoading: loading, refreshDashboardData } = useDashboardData();
  const { applicationId } = useParams();
  const liveApplication =
    profile?.applications.find((application) => application.id === applicationId) ??
    (profile?.application?.id === applicationId ? (profile?.application ?? null) : null);

  const mockApplication = applicationId ? APPLICATION_DETAILS[applicationId as keyof typeof APPLICATION_DETAILS] : undefined;
  const mappedLiveApplication =
    liveApplication && applicationId && liveApplication.id === applicationId
      ? mapApplicationToDetails(liveApplication, profile?.assignedAdmin?.fullName ?? 'Unassigned')
      : undefined;
  const application = mockApplication ?? mappedLiveApplication;
  const isLiveApplicationDetails = Boolean(liveApplication && applicationId && liveApplication.id === applicationId);
  const canTrackApplication = !liveApplication || liveApplication.applicationType === 'study_scholarship';
  const universityCountryValue = liveApplication?.universityCountry ?? application?.applicationSummary.universityCountry;
  const normalizedUniversityCountry = universityCountryValue?.trim().toLowerCase();
  const isCountryCanada = normalizedUniversityCountry === 'canada';
  const isCountryUnitedStates = normalizedUniversityCountry === 'united states';
  const shouldHideOfferFields = liveApplication
    ? liveApplication.shouldShowOfferFields === false
    : isCountryCanada;
  const shouldShowOfferTypeInfo =
    normalizedUniversityCountry === 'united kingdom' || normalizedUniversityCountry === 'australia';
  const offerTypeLabel = liveApplication?.offerTypeLabel ?? (isCountryUnitedStates ? 'Admission Letter' : 'Offer Type');
  const offerDateLabel = liveApplication?.offerDateLabel ?? (isCountryUnitedStates ? 'Admission Letter Date' : 'Offer Date');
  const documentFields = DOCUMENT_FIELDS;
  const applicationDocuments = application?.documents ?? [];
  const displayedDocuments = applicationDocuments;

  const handleOpenTracker = async () => {
    if (!canTrackApplication) {
      return;
    }

    setIsTrackerOpen(true);

    if (!isLiveApplicationDetails || !liveApplication) {
      return;
    }

    try {
      await applicationService.markTrackerViewed(liveApplication.id);
      await refreshDashboardData();
    } catch (_error) {
      return;
    }
  };

  const handleDocumentUpload = async (documentType: ApplicationDocumentType, file: File) => {
    if (!liveApplication) {
      return;
    }

    try {
      setUploadError(null);
      setIsUploading(documentType);
      await applicationService.uploadDocument(liveApplication.id, documentType, file);
      await refreshDashboardData();
    } catch (_error) {
      setUploadError('Unable to upload document. Please upload a PDF or image file and try again.');
    } finally {
      setIsUploading(null);
    }
  };

  if (!application) {
    return (
      <div className="flex min-h-screen flex-col bg-dark-bg">
        <Navbar />

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl rounded-xl border border-white/10 bg-dark-card p-6">
            <h1 className="text-lg font-semibold text-zinc-100">Application not found</h1>
            <p className="mt-2 text-sm text-zinc-400">
              {loading ? 'Loading your application data...' : 'This application could not be located.'}
            </p>
          </div>
        </main>

        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-dark-bg">
      <Navbar />

      <main className="flex-1">
        <div className="mx-auto max-w-5xl px-5 py-6 sm:px-6">
          <h1 className="text-lg font-semibold text-zinc-100">{application.universityName} — {application.degree}</h1>
          <p className="mt-1 text-sm text-zinc-400">View and manage your application details, documents, and financial information.</p>
          {canTrackApplication ? (
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => void handleOpenTracker()}
                className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-dark-bg"
              >
                View tracker
              </button>
            </div>
          ) : null}
        </div>

        <div className="mx-auto max-w-5xl divide-y divide-white/10">
          <section>
            <div className="px-5 py-4 sm:px-6">
              <h2 className="text-base font-semibold uppercase tracking-wide text-zinc-100">Application Summary</h2>
            </div>
            <div className="grid gap-4 px-5 py-5 sm:grid-cols-2 sm:px-6">
              <div>
                <p className="text-xs uppercase tracking-wide text-zinc-500">Application ID</p>
                <p className="mt-1 text-sm font-medium text-zinc-200">{application.applicationSummary.applicationId}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-zinc-500">University Name</p>
                <p className="mt-1 text-sm font-medium text-zinc-200">{application.applicationSummary.universityName}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-zinc-500">University Country</p>
                <p className="mt-1 text-sm font-medium text-zinc-200">{application.applicationSummary.universityCountry}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-zinc-500">Course Name</p>
                <p className="mt-1 text-sm font-medium text-zinc-200">{application.applicationSummary.courseName}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-zinc-500">Degree Type</p>
                <p className="mt-1 text-sm font-medium text-zinc-200">{application.applicationSummary.degreeType}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-zinc-500">Study Mode</p>
                <p className="mt-1 text-sm font-medium text-zinc-200">{application.applicationSummary.studyMode}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-zinc-500">Intake</p>
                <p className="mt-1 text-sm font-medium text-zinc-200">{application.applicationSummary.intake}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-zinc-500">Current Application Status</p>
                <p className="mt-1 text-sm font-medium text-zinc-200">{application.applicationSummary.currentApplicationStatus}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-zinc-500">Assigned Admission Officer</p>
                <p className="mt-1 text-sm font-medium text-zinc-200">{application.applicationSummary.assignedAdmissionOfficer}</p>
              </div>
              {!shouldHideOfferFields ? (
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-zinc-500">{offerTypeLabel}</p>
                    <p className="mt-1 text-sm font-medium text-zinc-200">{application.applicationSummary.offerType}</p>
                  </div>
                  {shouldShowOfferTypeInfo ? (
                    <button
                      type="button"
                      onClick={() => setIsOfferInfoOpen(true)}
                      title="Learn more about offer types"
                      className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-yellow-400/20 text-yellow-300 transition-colors hover:bg-yellow-400/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400"
                    >
                      <Question size={14} weight="bold" />
                    </button>
                  ) : null}
                </div>
              ) : null}
              {!shouldHideOfferFields ? (
                <div>
                  <p className="text-xs uppercase tracking-wide text-zinc-500">{offerDateLabel}</p>
                  <p className="mt-1 text-sm font-medium text-zinc-200">{application.applicationSummary.offerDate}</p>
                </div>
              ) : null}
              {application.applicationSummary.countrySpecificOfferDocumentLabel ? (
                <div>
                  <p className="text-xs uppercase tracking-wide text-zinc-500">
                    {application.applicationSummary.countrySpecificOfferDocumentLabel}
                  </p>
                  <p className="mt-1 text-sm font-medium text-zinc-200">
                    {application.applicationSummary.countrySpecificOfferDocumentValue}
                  </p>
                </div>
              ) : null}
            </div>
          </section>

          <section>
            <div className="px-5 py-4 sm:px-6">
              <h2 className="text-base font-semibold uppercase tracking-wide text-zinc-100">Documents</h2>
            </div>
            {uploadError ? (
              <div className="px-5 sm:px-6">
                <p className="rounded-lg bg-rose-500/10 px-4 py-2.5 text-sm text-rose-400">{uploadError}</p>
              </div>
            ) : null}
            <div className="grid gap-4 px-5 py-5 sm:grid-cols-2 sm:px-6">
              {isLiveApplicationDetails && liveApplication
                ? documentFields.map((document) => {
                    const uploadedFileValue = liveApplication[document.field];

                    return (
                      <div key={document.documentType} className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-xs uppercase tracking-wide text-zinc-100">{renderDocumentLabel(document.documentName)}</p>
                          <p className="mt-1 truncate text-sm font-medium text-zinc-500">{formatDocumentValue(uploadedFileValue)}</p>
                        </div>

                        <label className="mt-0.5 shrink-0">
                          <input
                            type="file"
                            accept=".pdf,image/*"
                            className="sr-only"
                            onChange={(event) => {
                              const selectedFile = event.target.files?.[0];
                              if (selectedFile) {
                                void handleDocumentUpload(document.documentType, selectedFile);
                              }
                              event.currentTarget.value = '';
                            }}
                            disabled={Boolean(isUploading)}
                          />
                          <span className="inline-flex cursor-pointer items-center rounded-md bg-brand-600 px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-brand-500">
                            {isUploading === document.documentType
                              ? 'Uploading...'
                              : uploadedFileValue
                                ? 'Update'
                                : 'Upload'}
                          </span>
                        </label>
                      </div>
                    );
                  })
                : displayedDocuments.map((document) => (
                    <div key={document.documentName} className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs uppercase tracking-wide text-zinc-100">{renderDocumentLabel(document.documentName)}</p>
                        <p className="mt-1 truncate text-sm font-medium text-zinc-500">{document.documentUploaded}</p>
                      </div>
                      <button
                        type="button"
                        className="mt-0.5 shrink-0 rounded-md bg-brand-600 px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-brand-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-dark-bg"
                      >
                        {document.documentUploaded ? 'Update' : 'Upload'}
                      </button>
                    </div>
                  ))}
            </div>
          </section>

          <section>
            <div className="px-5 py-4 sm:px-6">
              <h2 className="text-base font-semibold uppercase tracking-wide text-zinc-100">Financial Information</h2>
            </div>
            <div className="grid gap-4 px-5 py-5 sm:grid-cols-2 sm:px-6">
              {isLiveApplicationDetails && liveApplication
                ? FINANCIAL_FIELDS.map((document) => {
                    const uploadedFileValue = liveApplication[document.field];

                    return (
                      <div key={document.documentType} className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-xs uppercase tracking-wide text-zinc-100">{document.documentName}</p>
                          <p className="mt-1 truncate text-sm font-medium text-zinc-500">{formatDocumentValue(uploadedFileValue)}</p>
                        </div>

                        <label className="mt-0.5 shrink-0">
                          <input
                            type="file"
                            accept=".pdf,image/*"
                            className="sr-only"
                            onChange={(event) => {
                              const selectedFile = event.target.files?.[0];
                              if (selectedFile) {
                                void handleDocumentUpload(document.documentType, selectedFile);
                              }
                              event.currentTarget.value = '';
                            }}
                            disabled={Boolean(isUploading)}
                          />
                          <span className="inline-flex cursor-pointer items-center rounded-md bg-brand-600 px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-brand-500">
                            {isUploading === document.documentType
                              ? 'Uploading...'
                              : uploadedFileValue
                                ? 'Update'
                                : 'Upload'}
                          </span>
                        </label>
                      </div>
                    );
                  })
                : application.financialInformation.map((document) => (
                    <div key={document.documentName} className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs uppercase tracking-wide text-zinc-100">{document.documentName}</p>
                        <p className="mt-1 truncate text-sm font-medium text-zinc-500">{document.documentUploaded}</p>
                      </div>
                      <button
                        type="button"
                        className="mt-0.5 shrink-0 rounded-md bg-brand-600 px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-brand-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-dark-bg"
                      >
                        {document.documentUploaded ? 'Update' : 'Upload'}
                      </button>
                    </div>
                  ))}
            </div>
          </section>
        </div>
      </main>

      {canTrackApplication ? (
        <ApplicationProgressModal
          isOpen={isTrackerOpen}
          onClose={() => setIsTrackerOpen(false)}
          applicationStatus={application.applicationStatus}
          universityName={application.applicationSummary.universityName}
          universityCountry={universityCountryValue}
        />
      ) : null}

      {isOfferInfoOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="offer-info-title"
          onClick={() => setIsOfferInfoOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-xl border border-yellow-300/50 bg-yellow-100 p-5 text-zinc-900 shadow-lg sm:p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <h3 id="offer-info-title" className="text-base font-semibold">
                What is an Offer?
              </h3>
              <button
                type="button"
                onClick={() => setIsOfferInfoOpen(false)}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-yellow-300/80 text-zinc-800 transition-colors hover:bg-yellow-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500"
                aria-label="Close offer information"
              >
                <X size={14} weight="bold" />
              </button>
            </div>
            <p className="mt-3 text-sm leading-relaxed">
              An offer is the university's formal response to your application. After you apply, the university reviews your qualifications, academic history, and supporting documents. If they are satisfied, they issue an offer — this is an invitation for you to accept a place on the course you applied for.
            </p>
            <p className="mt-2 text-sm leading-relaxed">
              Offers can be <strong>unconditional</strong> (you have met all requirements) or <strong>conditional</strong> (you still need to meet certain conditions, such as achieving a required grade or submitting additional documents). The offer is provided by the university and issued directly to you, the student applicant.
            </p>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};
