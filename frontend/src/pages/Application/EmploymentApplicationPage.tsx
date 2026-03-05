import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Footer } from '../../components/layout/Footer';
import { Navbar } from '../../components/layout/Navbar';
import { Breadcrumbs } from '../../components/ui/Breadcrumbs';
import { useDashboardData } from '../../hooks/useDashboardData';
import { applicationService } from '../../services/application.service';
import type { Application, ApplicationDocumentType } from '../../types/user';

type DocumentFieldConfig = {
  documentType: ApplicationDocumentType;
  documentName: string;
  field: keyof Pick<Application, 'internationalPassportUrl' | 'curriculumVitaeUrl'>;
};

const DOCUMENT_FIELDS: DocumentFieldConfig[] = [
  { documentType: 'internationalPassport', documentName: 'International Passport', field: 'internationalPassportUrl' },
  { documentType: 'curriculumVitae', documentName: 'CV', field: 'curriculumVitaeUrl' }
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

export const EmploymentApplicationPage = () => {
  const [isUploading, setIsUploading] = useState<ApplicationDocumentType | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const { profile, isLoading: loading, refreshDashboardData } = useDashboardData();
  const { applicationId } = useParams();
  const liveApplication =
    profile?.applications.find((application) => application.id === applicationId) ??
    (profile?.application?.id === applicationId ? (profile?.application ?? null) : null);

  const isLiveEmploymentApplication = Boolean(
    liveApplication &&
      applicationId &&
      liveApplication.id === applicationId &&
      liveApplication.applicationType === 'work_employment'
  );

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

  if (!isLiveEmploymentApplication || !liveApplication) {
    return (
      <div className="flex min-h-screen flex-col bg-dark-bg">
        <Navbar />

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl rounded-xl border border-white/10 bg-dark-card p-6">
            <h1 className="text-xl font-semibold tracking-tight text-zinc-100">Application not found</h1>
            <p className="mt-2 text-sm text-zinc-400">
              {loading
                ? 'Loading your application data...'
                : 'This employment application could not be located.'}
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
        <div className="mx-auto max-w-5xl px-5 py-4 sm:px-6">
          <Breadcrumbs
            items={[
              { label: 'Dashboard', href: '/dashboard' },
              { label: 'Applications', href: '/dashboard/applications' },
              { label: 'Details' }
            ]}
          />
          <h1 className="mt-4 text-xl font-semibold tracking-tight text-zinc-100">Work Application — {liveApplication.skillOrProfession || 'N/A'}</h1>
          <p className="mt-1 text-sm text-zinc-400">
            View and manage your employment application details and supporting documents.
          </p>
        </div>

        <div className="mx-auto max-w-5xl divide-y divide-white/10">
          <section>
            <div className="px-5 py-4 sm:px-6">
              <h2 className="text-base font-semibold uppercase tracking-wide text-zinc-100">Application Summary</h2>
            </div>
            <div className="grid gap-4 px-5 py-5 sm:grid-cols-2 sm:px-6">
              <div>
                <p className="text-xs uppercase tracking-wide text-zinc-500">Full Name</p>
                <p className="mt-1 text-sm font-medium text-zinc-200">{profile?.fullName || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-zinc-500">Date of Birth</p>
                <p className="mt-1 text-sm font-medium text-zinc-200">{profile?.dateOfBirth || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-zinc-500">Gender</p>
                <p className="mt-1 text-sm font-medium text-zinc-200">{profile?.gender || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-zinc-500">Phone Number</p>
                <p className="mt-1 text-sm font-medium text-zinc-200">
                  {profile?.countryCode && profile?.phoneNumber
                    ? `${profile.countryCode}${profile.phoneNumber}`
                    : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-zinc-500">Nationality</p>
                <p className="mt-1 text-sm font-medium text-zinc-200">{profile?.nationality || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-zinc-500">Country of Residence</p>
                <p className="mt-1 text-sm font-medium text-zinc-200">{profile?.countryOfResidence || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-zinc-500">State or Province</p>
                <p className="mt-1 text-sm font-medium text-zinc-200">{profile?.stateOrProvince || 'N/A'}</p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-xs uppercase tracking-wide text-zinc-500">Residential Address</p>
                <p className="mt-1 text-sm font-medium text-zinc-200">{profile?.residentialAddress || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-zinc-500">Job Title</p>
                <p className="mt-1 text-sm font-medium text-zinc-200">{liveApplication.skillOrProfession || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-zinc-500">Where do you want to work?</p>
                <p className="mt-1 text-sm font-medium text-zinc-200">{liveApplication.workCountry || 'N/A'}</p>
              </div>
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
              {DOCUMENT_FIELDS.map((document) => {
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
              })}
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
};
