import { useState } from 'react';
import type { AxiosError } from 'axios';
import { CaretRight } from '@phosphor-icons/react';
import { Link, useNavigate } from 'react-router-dom';
import { Footer } from '../../components/layout/Footer';
import { Stepper } from '../../components/ui/Stepper';
import { useAuth } from '../../hooks/useAuth';
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

export const ApplyPage = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [personalInfo, setPersonalInfo] = useState<PersonalDetailsValues | null>(null);
  const [applicationType, setApplicationType] = useState<StepApplicationTypeValues | null>(null);
  const [skillProfession, setSkillProfession] = useState<StepSkillProfessionValues | null>(null);
  const [applicationSummary, setApplicationSummary] = useState<StepApplicationSummaryValues | null>(null);
  const [emailPassword, setEmailPassword] = useState<StepEmailPasswordValues | null>(null);
  const { setSessionUser } = useAuth();
  const navigate = useNavigate();

  const isWorkApplication = applicationType?.applicationType === 'work_employment';
  const isStudyApplication = applicationType?.applicationType === 'study_scholarship';

  const flowSteps: FlowStep[] = [
    baseSteps[0],
    ...(isWorkApplication ? [skillStep] : []),
    ...baseSteps.slice(1),
    ...(isStudyApplication ? [applicationDetailsStep] : []),
    emailPasswordStep
  ];

  const currentFlowStep = flowSteps[currentStep] ?? flowSteps[0];

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
    setSubmitting(true);
    setErrorMessage(null);
    setSkillProfession(data);
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
    setSubmitting(true);
    setErrorMessage(null);
    setApplicationSummary(data);

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
        universityName: applicationSummary?.universityName,
        universityCountry: applicationSummary?.universityCountry,
        courseName: applicationSummary?.courseName,
        degreeType: applicationSummary?.degreeType,
        studyMode: applicationSummary?.studyMode,
        intake: applicationSummary?.intake,
        applicationDate: applicationSummary?.applicationDate,
        email: data.email,
        password: data.password
      });

      setSessionUser(user);
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
      <nav aria-label="Breadcrumb" className="border-b border-white/10 px-4 py-2.5 sm:px-6 lg:px-8">
        <ol className="flex items-center gap-1.5 text-xs text-zinc-400">
          <li>
            <Link
              to="/"
              className="rounded px-1 py-0.5 transition-colors hover:text-zinc-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-500"
            >
              Home
            </Link>
          </li>
          <li aria-hidden className="text-zinc-600">
            <CaretRight size={10} weight="bold" />
          </li>
          <li aria-current="page" className="font-medium text-zinc-100">
            Apply
          </li>
        </ol>
      </nav>
      <main className="mx-auto flex flex-1 w-full max-w-xl flex-col px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        {currentStep === 0 ? (
          <div className="mb-8 w-full text-left sm:mb-10">
            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Start Your Application</h1>
            <p className="mt-2 text-sm leading-relaxed text-zinc-300 sm:text-base">
              Complete your application in a few guided steps. Please provide accurate information to help our
              admissions team review your profile efficiently and support your next stage with confidence.
            </p>
          </div>
        ) : null}

        <div className="flex flex-1 items-center">
          <div className="glass-border w-full space-y-8 rounded-2xl bg-transparent p-6 sm:p-10">
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
              />
            ) : currentFlowStep.key === 'skillProfession' ? (
              <StepSkillProfession
                onSubmit={handleSkillProfessionSubmit}
                onBack={() => setCurrentStep((prev) => Math.max(0, prev - 1))}
                loading={submitting}
                initialValues={skillProfession ?? undefined}
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
      </main>
      <Footer />
    </div>
  );
};
