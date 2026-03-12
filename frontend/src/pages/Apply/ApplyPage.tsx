import { useEffect, useState } from 'react';
import type { AxiosError } from 'axios';
import { useNavigate } from 'react-router-dom';
import { Footer } from '../../components/layout/Footer';
import { Navbar } from '../../components/layout/Navbar';
import { Breadcrumbs } from '../../components/ui/Breadcrumbs';
import { Snackbar } from '../../components/ui/Snackbar';
import { Stepper } from '../../components/ui/Stepper';
import { SNACKBAR_AUTO_DISMISS_DELAY_MS } from '../../constants/snackbar';
import { useAuth } from '../../hooks/useAuth';
import { prewarmBackend } from '../../services/api';
import { applicationService } from '../../services/application.service';
import {
  StepApplicationSummary,
  type StepApplicationSummaryValues
} from './steps/StepApplicationSummary';
import { StepApplicationType, type StepApplicationTypeValues } from './steps/StepApplicationType';
import { StepEmailPassword, type StepEmailPasswordValues } from './steps/StepEmailPassword';
import { StepSkillProfession, type StepSkillProfessionValues } from './steps/StepSkillProfession';
import {
  StepNationalityResidence,
  type StepNationalityResidenceValues
} from './steps/personal/StepNationalityResidence';
import { StepPassportDetails, type StepPassportDetailsValues } from './steps/personal/StepPassportDetails';
import { StepPersonalDetails, type StepPersonalDetailsValues } from './steps/personal/StepPersonalDetails';
import type { PersonalDetailsValues } from './steps/personal/types';

type FlowStep = {
  key:
    | 'applicationType'
    | 'skillProfession'
    | 'personalDetails'
    | 'nationalityResidence'
    | 'passportDetails'
    | 'applicationDetails'
    | 'emailPassword';
  label: string;
  title: string;
  description: string;
};

const baseSteps: FlowStep[] = [
  {
    key: 'applicationType',
    label: 'Application Type',
    title: 'Application Type',
    description: 'Select the type of application you are submitting.'
  },
  {
    key: 'personalDetails',
    label: 'Personal Details',
    title: 'Personal Details',
    description: 'Tell us about yourself to start your application.'
  },
  {
    key: 'nationalityResidence',
    label: 'Nationality & Residence',
    title: 'Nationality & Residence',
    description: 'Provide your nationality and residential information.'
  },
  {
    key: 'passportDetails',
    label: 'Passport Details',
    title: 'Passport Details',
    description: 'Add your passport number and expiry date.'
  }
];

const skillStep: FlowStep = {
  key: 'skillProfession',
  label: 'Skill or Profession',
  title: 'Skill or Profession',
  description: 'Enter your primary skill or profession.'
};

const applicationDetailsStep: FlowStep = {
  key: 'applicationDetails',
  label: 'Application Details',
  title: 'Application Details',
  description: 'Provide your university and course details.'
};

const emailPasswordStep: FlowStep = {
  key: 'emailPassword',
  label: 'Email & Password',
  title: 'Email & Password',
  description: 'Create your account to submit your application.'
};

const emptyPersonalInfo: PersonalDetailsValues = {
  fullName: '',
  gender: '',
  dateOfBirth: '',
  countryCode: '',
  phoneNumber: '',
  nationality: '',
  countryOfResidence: '',
  residentialAddress: '',
  stateOrProvince: '',
  passportNumber: '',
  passportExpiryDate: ''
};

const SUCCESS_NAVIGATION_DELAY_MS = 2400;

export const ApplyPage = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showSuccessSnackbar, setShowSuccessSnackbar] = useState(false);
  const [personalInfo, setPersonalInfo] = useState<PersonalDetailsValues | null>(null);
  const [applicationType, setApplicationType] = useState<StepApplicationTypeValues | null>(null);
  const [skillProfession, setSkillProfession] = useState<StepSkillProfessionValues | null>(null);
  const [applicationSummary, setApplicationSummary] = useState<StepApplicationSummaryValues | null>(null);
  const [emailPassword, setEmailPassword] = useState<StepEmailPasswordValues | null>(null);
  const { user, isAuthenticated, setSessionUser } = useAuth();
  const navigate = useNavigate();
  const isReapplyFlow = isAuthenticated && user?.role === 'USER';

  const isWorkApplication = applicationType?.applicationType === 'work_employment';
  const isStudyApplication = applicationType?.applicationType === 'study_scholarship';

  const flowSteps: FlowStep[] = isReapplyFlow
    ? [baseSteps[0], ...(isWorkApplication ? [skillStep] : []), ...(isStudyApplication ? [applicationDetailsStep] : [])]
    : [
        baseSteps[0],
        ...(isWorkApplication ? [skillStep] : []),
        ...baseSteps.slice(1),
        ...(isStudyApplication ? [applicationDetailsStep] : []),
        emailPasswordStep
      ];

  const currentFlowStep = flowSteps[currentStep] ?? flowSteps[0];

  useEffect(() => {
    if (!showSuccessSnackbar) {
      return;
    }

    const timer = window.setTimeout(() => {
      setShowSuccessSnackbar(false);
    }, SNACKBAR_AUTO_DISMISS_DELAY_MS);

    return () => {
      window.clearTimeout(timer);
    };
  }, [showSuccessSnackbar]);

  useEffect(() => {
    if (currentFlowStep.key !== 'emailPassword') {
      return;
    }

    void prewarmBackend();
  }, [currentFlowStep.key]);

  const submitReapplication = async (payload: {
    applicationType: 'study_scholarship' | 'work_employment';
    skillOrProfession?: string;
    workCountry?: string;
    universityName?: string;
    universityCountry?: string;
    courseName?: string;
    degreeType?: string;
    studyMode?: string;
    intake?: string;
  }) => {
    setSubmitting(true);
    setErrorMessage(null);

    try {
      await applicationService.reapply(payload);
      setShowSuccessSnackbar(true);
      await new Promise<void>((resolve) => {
        window.setTimeout(() => resolve(), SUCCESS_NAVIGATION_DELAY_MS);
      });
      navigate('/dashboard');
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      setErrorMessage(axiosError.response?.data?.message ?? 'Unable to reapply at the moment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApplicationTypeSubmit = async (data: StepApplicationTypeValues) => {
    setSubmitting(true);
    setErrorMessage(null);
    setApplicationType(data);

    if (data.applicationType === 'work_employment') {
      setApplicationSummary(null);
      setCurrentStep(1);
    } else {
      setSkillProfession(null);
      setCurrentStep(1);
    }

    setSubmitting(false);
  };

  const handleSkillProfessionSubmit = async (data: StepSkillProfessionValues) => {
    setSkillProfession(data);

    if (isReapplyFlow) {
      if (!applicationType) {
        setErrorMessage('Please select an application type before reapplying.');
        return;
      }

      await submitReapplication({
        applicationType: applicationType.applicationType,
        skillOrProfession: data.skillOrProfession,
        workCountry: data.workCountry
      });
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);
    setCurrentStep((prev) => prev + 1);
    setSubmitting(false);
  };

  const handlePersonalDetailsSubmit = async (data: StepPersonalDetailsValues) => {
    setSubmitting(true);
    setErrorMessage(null);
    setPersonalInfo((previous) => ({
      ...(previous ?? emptyPersonalInfo),
      ...data
    }));
    setCurrentStep((prev) => prev + 1);
    setSubmitting(false);
  };

  const handleNationalityResidenceSubmit = async (data: StepNationalityResidenceValues) => {
    setSubmitting(true);
    setErrorMessage(null);
    setPersonalInfo((previous) => ({
      ...(previous ?? emptyPersonalInfo),
      ...data
    }));
    setCurrentStep((prev) => prev + 1);
    setSubmitting(false);
  };

  const handlePassportDetailsSubmit = async (data: StepPassportDetailsValues) => {
    setSubmitting(true);
    setErrorMessage(null);

    const nextPersonalInfo = {
      ...(personalInfo ?? emptyPersonalInfo),
      ...data
    };

    setPersonalInfo(nextPersonalInfo);

    if (isStudyApplication) {
      setCurrentStep((prev) => prev + 1);
    } else {
      setCurrentStep((prev) => prev + 1);
    }

    setSubmitting(false);
  };

  const handleApplicationSummarySubmit = async (data: StepApplicationSummaryValues) => {
    setApplicationSummary(data);

    if (isReapplyFlow) {
      if (!applicationType) {
        setErrorMessage('Please select an application type before reapplying.');
        return;
      }

      await submitReapplication({
        applicationType: applicationType.applicationType,
        universityName: data.universityName,
        universityCountry: data.universityCountry,
        courseName: data.courseName,
        degreeType: data.degreeType,
        studyMode: data.studyMode,
        intake: data.intake
      });
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);

    setCurrentStep((prev) => prev + 1);

    setSubmitting(false);
  };

  const handleEmailPasswordSubmit = async (data: StepEmailPasswordValues) => {
    setSubmitting(true);
    setErrorMessage(null);
    try {
      if (!applicationType || !personalInfo) {
        setErrorMessage('Please complete all required steps before submitting your application.');
        return;
      }

      setEmailPassword(data);

      const user = await applicationService.submit({
        fullName: personalInfo.fullName,
        applicationType: applicationType.applicationType,
        dateOfBirth: personalInfo.dateOfBirth,
        gender: personalInfo.gender,
        countryCode: personalInfo.countryCode,
        phoneNumber: personalInfo.phoneNumber,
        nationality: personalInfo.nationality,
        countryOfResidence: personalInfo.countryOfResidence,
        stateOrProvince: personalInfo.stateOrProvince,
        residentialAddress: personalInfo.residentialAddress,
        passportNumber: personalInfo.passportNumber,
        passportExpiryDate: personalInfo.passportExpiryDate,
        skillOrProfession: skillProfession?.skillOrProfession,
        workCountry: skillProfession?.workCountry,
        universityName: applicationSummary?.universityName,
        universityCountry: applicationSummary?.universityCountry,
        courseName: applicationSummary?.courseName,
        degreeType: applicationSummary?.degreeType,
        studyMode: applicationSummary?.studyMode,
        intake: applicationSummary?.intake,
        email: data.email,
        password: data.password
      });

      setSessionUser(user);
      setShowSuccessSnackbar(true);
      await new Promise<void>((resolve) => {
        window.setTimeout(() => resolve(), SUCCESS_NAVIGATION_DELAY_MS);
      });
      navigate('/dashboard');
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      setErrorMessage(axiosError.response?.data?.message ?? 'Unable to submit your application. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

 return (
  <div className="flex min-h-screen flex-col bg-dark-bg">
    <Navbar />
    <div className="mx-auto w-full max-w-xl px-4 pt-2 sm:px-6 sm:pt-3 lg:px-8">
      <div className="py-1">
        <Breadcrumbs
          items={[{ label: 'Home', href: '/' }, { label: 'Apply' }]}
        />
      </div>
    </div>
    <Snackbar
      message={isReapplyFlow ? 'Application reapplied successfully' : 'Application submitted successfully'}
      visible={showSuccessSnackbar}
      position="bottom-center"
    />
    <main className="relative mx-auto flex flex-1 w-full max-w-xl flex-col overflow-hidden px-4 py-6 sm:px-6 sm:py-8 lg:px-8">

      {/* Grid texture */}
      <div aria-hidden className="pointer-events-none absolute inset-0 z-0" style={{ backgroundImage: `linear-gradient(rgba(39,39,42,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(39,39,42,0.4) 1px, transparent 1px)`, backgroundSize: '40px 40px' }} />
      {/* Top violet glow */}
      <div aria-hidden className="pointer-events-none absolute -top-32 left-1/2 z-0 h-[480px] w-[700px] -translate-x-1/2 rounded-full blur-3xl" style={{ background: 'radial-gradient(ellipse, rgba(139,92,246,0.18) 0%, transparent 70%)' }} />

      <div className="relative z-10">
        {currentStep === 0 ? (
          <div className="mb-8 w-full text-left sm:mb-10">
            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Start Your Application</h1>
            <p className="mt-2 text-sm leading-relaxed text-zinc-300 sm:text-base">
              Complete your study or employment application in a few guided steps. Please provide accurate information to help our admissions and recruitment team review your profile efficiently and support your next stage with confidence.
            </p>
          </div>
        ) : null}

        <div className="flex flex-1 items-center">
          <div className="w-full space-y-8 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 backdrop-blur-sm sm:p-10">
            <div className="space-y-2 text-left">
              <h1 className="text-2xl font-bold text-white sm:text-3xl">{currentFlowStep.title}</h1>
              <p className="text-sm text-zinc-400">{currentFlowStep.description}</p>
            </div>

            <Stepper steps={flowSteps.map((step) => step.label)} currentStep={currentStep} />

            <div className="transition-all duration-300 ease-out">
              {currentFlowStep.key === 'applicationType' ? (
                <StepApplicationType
                  onSubmit={handleApplicationTypeSubmit}
                  loading={submitting}
                  initialValues={applicationType ?? undefined}
                  submitLabel="Continue"
                />
              ) : currentFlowStep.key === 'skillProfession' ? (
                <StepSkillProfession
                  onSubmit={handleSkillProfessionSubmit}
                  onBack={() => setCurrentStep((prev) => Math.max(0, prev - 1))}
                  loading={submitting}
                  initialValues={skillProfession ?? undefined}
                  submitLabel={isReapplyFlow ? 'Reapply' : 'Continue'}
                />
              ) : currentFlowStep.key === 'personalDetails' ? (
                <StepPersonalDetails
                  onSubmit={handlePersonalDetailsSubmit}
                  onBack={() => setCurrentStep((prev) => Math.max(0, prev - 1))}
                  loading={submitting}
                  initialValues={personalInfo ?? undefined}
                />
              ) : currentFlowStep.key === 'nationalityResidence' ? (
                <StepNationalityResidence
                  onSubmit={handleNationalityResidenceSubmit}
                  onBack={() => setCurrentStep((prev) => Math.max(0, prev - 1))}
                  loading={submitting}
                  initialValues={personalInfo ?? undefined}
                />
              ) : currentFlowStep.key === 'passportDetails' ? (
                <StepPassportDetails
                  onSubmit={handlePassportDetailsSubmit}
                  onBack={() => setCurrentStep((prev) => Math.max(0, prev - 1))}
                  loading={submitting}
                  initialValues={personalInfo ?? undefined}
                />
              ) : currentFlowStep.key === 'applicationDetails' ? (
                <StepApplicationSummary
                  onSubmit={handleApplicationSummarySubmit}
                  onBack={() => setCurrentStep((prev) => Math.max(0, prev - 1))}
                  loading={submitting}
                  initialValues={applicationSummary ?? undefined}
                  submitLabel={isReapplyFlow ? 'Reapply' : 'Continue'}
                />
              ) : (
                <StepEmailPassword
                  onSubmit={handleEmailPasswordSubmit}
                  onBack={() => setCurrentStep((prev) => Math.max(0, prev - 1))}
                  loading={submitting}
                  initialValues={emailPassword ?? undefined}
                />
              )}
            </div>

            {errorMessage ? (
              <p className="rounded-lg bg-rose-500/10 px-4 py-2.5 text-left text-sm text-rose-400">
                {errorMessage}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </main>
    <Footer />
  </div>
  );
};
