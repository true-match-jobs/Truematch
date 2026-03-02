import { PencilSimple } from '@phosphor-icons/react';
import { useEffect, useRef, useState, type ChangeEvent, type KeyboardEvent } from 'react';
import { Footer } from '../../components/layout/Footer';
import { Snackbar } from '../../components/ui/Snackbar';
import { useAuth } from '../../hooks/useAuth';
import { useDashboardData } from '../../hooks/useDashboardData';
import { authService } from '../../services/auth.service';
import type { User, UserWithApplication } from '../../types/user';
import { buildInitialAvatarUrl } from '../../utils/avatar';

type EditableFieldKey =
  | 'fullName'
  | 'emailAddress'
  | 'changePassword';

const PASSWORD_MASK = '••••••••';

const profileFieldApiMap: Partial<Record<EditableFieldKey, keyof NonNullable<Parameters<typeof authService.updateMeProfile>[0]>>> = {
  fullName: 'fullName'
};

const toDisplayValue = (value: string | null | undefined) => {
  const trimmedValue = value?.trim() ?? '';
  return trimmedValue.length > 0 ? trimmedValue : '—';
};

const buildProfileSummary = (
  profile: UserWithApplication | null,
  fallbackUser: User | null,
  currentPasswordDisplay: string
): Record<EditableFieldKey, string> => {
  return {
    fullName: toDisplayValue(profile?.fullName ?? fallbackUser?.fullName),
    emailAddress: toDisplayValue(profile?.email ?? fallbackUser?.email),
    changePassword: currentPasswordDisplay
  };
};

export const AdminDashboardProfilePage = () => {
  const { user, setSessionUser } = useAuth();
  const { profile, refreshDashboardData } = useDashboardData();

  const firstName = user?.fullName?.trim().split(/\s+/).filter(Boolean)[0] ?? 'Admin';
  const defaultAvatarUrl = buildInitialAvatarUrl({
    fullName: user?.fullName,
    email: user?.email,
    id: user?.id,
    fallback: firstName,
    size: 80
  });
  const avatarUrl = profile?.profilePhotoUrl ?? user?.profilePhotoUrl ?? defaultAvatarUrl;
  const isEmailVerified = Boolean(profile?.emailVerifiedAt ?? user?.emailVerifiedAt);
  const [profileSummary, setProfileSummary] = useState<Record<EditableFieldKey, string>>(() =>
    buildProfileSummary(profile, user, PASSWORD_MASK)
  );
  const [activeField, setActiveField] = useState<EditableFieldKey | null>(null);
  const [showSuccessSnackbar, setShowSuccessSnackbar] = useState(false);
  const [avatarUploadError, setAvatarUploadError] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const initialFieldValueRef = useRef<Partial<Record<EditableFieldKey, string>>>({});
  const skipSaveOnBlurRef = useRef<Partial<Record<EditableFieldKey, boolean>>>({});
  const snackbarTimerRef = useRef<number | null>(null);

  useEffect(() => {
    setProfileSummary((previous) => buildProfileSummary(profile, user, previous.changePassword));
  }, [profile, user]);

  useEffect(() => {
    return () => {
      if (snackbarTimerRef.current) {
        window.clearTimeout(snackbarTimerRef.current);
      }
    };
  }, []);

  const showSaveSuccessSnackbar = () => {
    setShowSuccessSnackbar(true);

    if (snackbarTimerRef.current) {
      window.clearTimeout(snackbarTimerRef.current);
    }

    snackbarTimerRef.current = window.setTimeout(() => {
      setShowSuccessSnackbar(false);
      snackbarTimerRef.current = null;
    }, 2200);
  };

  const syncAuthUser = (updatedProfile: UserWithApplication) => {
    setSessionUser({
      id: updatedProfile.id,
      fullName: updatedProfile.fullName,
      email: updatedProfile.email,
      dateOfBirth: updatedProfile.dateOfBirth,
      gender: updatedProfile.gender,
      countryCode: updatedProfile.countryCode,
      phoneNumber: updatedProfile.phoneNumber,
      nationality: updatedProfile.nationality,
      countryOfResidence: updatedProfile.countryOfResidence,
      stateOrProvince: updatedProfile.stateOrProvince,
      residentialAddress: updatedProfile.residentialAddress,
      passportNumber: updatedProfile.passportNumber,
      passportExpiryDate: updatedProfile.passportExpiryDate,
      emailVerifiedAt: updatedProfile.emailVerifiedAt,
      profilePhotoUrl: updatedProfile.profilePhotoUrl,
      role: updatedProfile.role,
      hasVisitedDashboard: updatedProfile.hasVisitedDashboard,
      createdAt: updatedProfile.createdAt,
      updatedAt: updatedProfile.updatedAt
    });
  };

  const handleStartEdit = (field: EditableFieldKey) => {
    initialFieldValueRef.current[field] = profileSummary[field];
    if (field === 'changePassword') {
      setProfileSummary((previous) => ({
        ...previous,
        changePassword: ''
      }));
    }
    setActiveField(field);
  };

  const handleFinishEdit = () => {
    setActiveField(null);
  };

  const saveFieldValue = async (field: EditableFieldKey, value: string) => {
    const trimmedValue = value.trim();
    const initialValue = initialFieldValueRef.current[field] ?? profileSummary[field];

    if (skipSaveOnBlurRef.current[field]) {
      skipSaveOnBlurRef.current[field] = false;
      handleFinishEdit();
      return;
    }

    if (trimmedValue.length === 0) {
      setProfileSummary((previous) => ({
        ...previous,
        [field]: initialValue
      }));
      handleFinishEdit();
      return;
    }

    if (trimmedValue === initialValue.trim()) {
      setProfileSummary((previous) => ({
        ...previous,
        [field]: field === 'changePassword' ? PASSWORD_MASK : trimmedValue
      }));
      handleFinishEdit();
      return;
    }

    try {
      let updatedProfile: UserWithApplication;

      if (field === 'emailAddress') {
        updatedProfile = await authService.updateMeEmail(trimmedValue);
      } else if (field === 'changePassword') {
        updatedProfile = await authService.updateMePassword(value);
      } else {
        const mappedField = profileFieldApiMap[field];

        if (!mappedField) {
          handleFinishEdit();
          return;
        }

        updatedProfile = await authService.updateMeProfile({
          [mappedField]: trimmedValue
        });
      }

      syncAuthUser(updatedProfile);
      setProfileSummary((previous) => buildProfileSummary(updatedProfile, null, previous.changePassword));
      setProfileSummary((previous) => ({
        ...previous,
        [field]: field === 'changePassword' ? PASSWORD_MASK : trimmedValue
      }));
      showSaveSuccessSnackbar();
      await refreshDashboardData();
    } catch (_error) {
      setProfileSummary((previous) => ({
        ...previous,
        [field]: initialValue
      }));
    } finally {
      handleFinishEdit();
    }
  };

  const handleFieldKeyDown = (event: KeyboardEvent<HTMLInputElement>, field: EditableFieldKey) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      event.currentTarget.blur();
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      skipSaveOnBlurRef.current[field] = true;
      setProfileSummary((previous) => ({
        ...previous,
        [field]: initialFieldValueRef.current[field] ?? previous[field]
      }));
      event.currentTarget.blur();
    }
  };

  const handleAvatarUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    event.target.value = '';

    if (!selectedFile) {
      return;
    }

    if (!selectedFile.type.startsWith('image/')) {
      setAvatarUploadError('Please select an image file.');
      return;
    }

    try {
      setAvatarUploadError(null);
      setIsUploadingAvatar(true);
      const updatedProfile = await authService.updateMeAvatar(selectedFile);
      syncAuthUser(updatedProfile);
      setProfileSummary((previous) => buildProfileSummary(updatedProfile, null, previous.changePassword));
      showSaveSuccessSnackbar();
      await refreshDashboardData();
    } catch (_error) {
      setAvatarUploadError('Unable to update profile photo. Please try again.');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const renderEditableRow = (
    label: string,
    field: EditableFieldKey,
    options?: { type?: 'text' | 'email' | 'password'; showVerificationBadge?: boolean }
  ) => {
    const isActive = activeField === field;
    const inputType = options?.type ?? 'text';

    return (
      <div key={field} className="w-full">
        <button
          type="button"
          onClick={() => handleStartEdit(field)}
          className="group flex w-full items-start justify-between gap-2 text-left"
        >
          <div className="min-w-0 flex-1">
            <p className="text-xs uppercase tracking-wide text-zinc-500">{label}</p>
            {isActive ? (
              <input
                autoFocus
                type={inputType}
                value={profileSummary[field]}
                onChange={(event) =>
                  setProfileSummary((previous) => ({
                    ...previous,
                    [field]: event.target.value
                  }))
                }
                onBlur={() => {
                  void saveFieldValue(field, profileSummary[field]);
                }}
                onKeyDown={(event) => handleFieldKeyDown(event, field)}
                onClick={(event) => event.stopPropagation()}
                className="mt-1 w-full border-0 bg-transparent p-0 text-sm font-medium text-zinc-200 outline-none focus:ring-0"
              />
            ) : (
              <p className="mt-1 text-sm font-medium text-zinc-200 [overflow-wrap:anywhere]">{profileSummary[field]}</p>
            )}
          </div>

          <span
            className="ml-auto shrink-0 rounded-md p-1.5 text-zinc-500 transition-colors group-hover:text-zinc-200"
            aria-hidden
          >
            <PencilSimple size={16} weight="regular" />
          </span>
        </button>

        {options?.showVerificationBadge ? (
          <div className="mt-2 flex justify-end">
            <span
              className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-medium backdrop-blur-sm ${
                isEmailVerified ? 'bg-emerald-500/30 text-emerald-200' : 'bg-rose-500/35 text-rose-200'
              }`}
            >
              {isEmailVerified ? 'Verified' : 'Unverified'}
            </span>
          </div>
        ) : null}
      </div>
    );
  };

  return (
    <section className="flex h-full min-h-0 flex-col">
      <Snackbar message="Profile updated successfully" visible={showSuccessSnackbar} position="bottom-center" />
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="px-3 pt-5 pb-3">
          <div className="max-w-5xl divide-y divide-white/10">
            <section>
              <div className="px-5 py-4 sm:px-6">
                <h3 className="text-base font-semibold uppercase tracking-wide text-zinc-100">Personal Information</h3>
              </div>
              <div className="grid gap-4 px-5 py-5 sm:grid-cols-2 sm:px-6">
                <div className="mb-4">
                  <div className="relative inline-block">
                    <img src={avatarUrl} alt={`${firstName} profile`} className="h-20 w-20 rounded-full border border-white/10 object-cover" />
                    <button
                      type="button"
                      onClick={handleAvatarUploadClick}
                      disabled={isUploadingAvatar}
                      className="absolute -right-1 -bottom-1 inline-flex h-7 w-7 items-center justify-center rounded-full border border-white/20 bg-dark-card text-zinc-200 transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                      aria-label="Update profile photo"
                    >
                      <PencilSimple size={14} weight="regular" />
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarFileChange}
                      className="hidden"
                    />
                  </div>
                  {avatarUploadError ? <p className="mt-2 text-xs text-rose-400">{avatarUploadError}</p> : null}
                </div>
                {renderEditableRow('Full Name', 'fullName')}
              </div>
            </section>

            <section>
              <div className="px-5 py-4 sm:px-6">
                <h3 className="text-base font-semibold uppercase tracking-wide text-zinc-100">Email Settings</h3>
              </div>
              <div className="grid gap-4 px-5 py-5 sm:grid-cols-2 sm:px-6">
                {renderEditableRow('Current Email Address', 'emailAddress', { type: 'email', showVerificationBadge: true })}
              </div>
            </section>

            <section>
              <div className="px-5 py-4 sm:px-6">
                <h3 className="text-base font-semibold uppercase tracking-wide text-zinc-100">Security</h3>
              </div>
              <div className="grid gap-4 px-5 py-5 sm:grid-cols-2 sm:px-6">
                {renderEditableRow('Change Password', 'changePassword', { type: 'password' })}
              </div>
            </section>
          </div>

          <Footer />
        </div>
      </div>
    </section>
  );
};
