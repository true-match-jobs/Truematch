import { zodResolver } from '@hookform/resolvers/zod';
import { MagnifyingGlass } from '@phosphor-icons/react';
import { useEffect, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '../../../components/ui/Button';
import { SelectDropdown } from '../../../components/ui/SelectDropdown';
import { courseService } from '../../../services/course.service';
import { universityService } from '../../../services/university.service';

const stepApplicationSummarySchema = z
  .object({
    universityCountry: z.string().min(2, 'University country is required'),
    universityName: z.string().min(2, 'University name is required'),
    courseName: z.string().min(2, 'Course name is required'),
    degreeType: z.string().min(2, 'Degree type is required'),
    studyMode: z.string().min(2, 'Study mode is required'),
    intake: z.string()
  })
  .superRefine((values, context) => {
    if ((values.intake ?? '').trim().length >= 2) {
      return;
    }

    const intakeErrorMessage =
      (values.universityCountry ?? '').trim().length >= 2
        ? 'Intake is required'
        : 'Select university country first to view matching universities.';

    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['intake'],
      message: intakeErrorMessage
    });
  });

export type StepApplicationSummaryValues = z.infer<typeof stepApplicationSummarySchema>;

type Props = {
  onSubmit: (data: StepApplicationSummaryValues) => Promise<void>;
  onBack: () => void;
  loading: boolean;
  initialValues?: Partial<StepApplicationSummaryValues>;
  submitLabel?: string;
};

export const StepApplicationSummary = ({ onSubmit, onBack, loading, initialValues, submitLabel = 'Continue' }: Props) => {
  const [universitySuggestions, setUniversitySuggestions] = useState<string[]>([]);
  const [isUniversitySearching, setIsUniversitySearching] = useState(false);
  const [courseSuggestions, setCourseSuggestions] = useState<string[]>([]);
  const [isCourseSearching, setIsCourseSearching] = useState(false);
  const universityFieldRef = useRef<HTMLDivElement | null>(null);
  const courseFieldRef = useRef<HTMLDivElement | null>(null);
  const universityCountryOptions = [
    { label: 'United Kingdom', value: 'United Kingdom' },
    { label: 'United States', value: 'United States' },
    { label: 'Canada', value: 'Canada' },
    { label: 'Australia', value: 'Australia' }
  ];
  const degreeTypeOptions = [
    { label: 'Foundation Certificate', value: 'Foundation Certificate' },
    { label: 'Undergraduate Diploma', value: 'Undergraduate Diploma' },
    { label: 'Associate Degree', value: 'Associate Degree' },
    { label: "Bachelor's Degree", value: "Bachelor's Degree" },
    { label: 'Graduate Diploma', value: 'Graduate Diploma' },
    { label: 'Postgraduate Certificate', value: 'Postgraduate Certificate' },
    { label: 'Postgraduate Diploma', value: 'Postgraduate Diploma' },
    { label: "Master's Degree", value: "Master's Degree" },
    { label: 'Master of Business Administration (MBA)', value: 'Master of Business Administration (MBA)' },
    { label: 'Doctor of Philosophy (PhD)', value: 'Doctor of Philosophy (PhD)' },
    { label: 'Professional Doctorate', value: 'Professional Doctorate' }
  ];
  const studyModeOptions = [
    { label: 'Full-time', value: 'Full-time' },
    { label: 'Part-time', value: 'Part-time' }
  ];
  const intakeOptionsByCountry: Record<string, { label: string; value: string }[]> = {
    'United Kingdom': [
      { label: 'September 2026', value: 'September 2026' },
      { label: 'January 2027', value: 'January 2027' },
      { label: 'May 2027', value: 'May 2027' }
    ],
    'United States': [
      { label: 'August 2026', value: 'August 2026' },
      { label: 'January 2027', value: 'January 2027' },
      { label: 'May 2027', value: 'May 2027' }
    ],
    Canada: [
      { label: 'September 2026', value: 'September 2026' },
      { label: 'January 2027', value: 'January 2027' },
      { label: 'May 2027', value: 'May 2027' }
    ],
    Australia: [
      { label: 'February 2027', value: 'February 2027' },
      { label: 'July 2027', value: 'July 2027' },
      { label: 'November 2027', value: 'November 2027' }
    ]
  };

  const {
    control,
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, submitCount }
  } = useForm<StepApplicationSummaryValues>({
    resolver: zodResolver(stepApplicationSummarySchema),
    defaultValues: {
      universityName: initialValues?.universityName ?? '',
      universityCountry: initialValues?.universityCountry ?? '',
      courseName: initialValues?.courseName ?? '',
      degreeType: initialValues?.degreeType ?? '',
      studyMode: initialValues?.studyMode ?? '',
      intake: initialValues?.intake ?? ''
    }
  });

  const universityNameValue = watch('universityName') ?? '';
  const courseNameValue = watch('courseName') ?? '';
  const universityCountryValue = watch('universityCountry') ?? '';
  const intakeValue = watch('intake') ?? '';
  const intakeOptions = intakeOptionsByCountry[universityCountryValue] ?? [];

  useEffect(() => {
    if (!intakeValue) {
      return;
    }

    const isValidIntake = intakeOptions.some((option) => option.value === intakeValue);
    if (!isValidIntake) {
      setValue('intake', '', { shouldValidate: false });
    }
  }, [intakeOptions, intakeValue, setValue]);

  useEffect(() => {
    const handleDocumentClick = (event: MouseEvent) => {
      const target = event.target as Node;

      if (!universityFieldRef.current?.contains(target)) {
        setUniversitySuggestions([]);
      }

      if (!courseFieldRef.current?.contains(target)) {
        setCourseSuggestions([]);
      }
    };

    document.addEventListener('mousedown', handleDocumentClick);

    return () => {
      document.removeEventListener('mousedown', handleDocumentClick);
    };
  }, []);

  useEffect(() => {
    const query = universityNameValue.trim();

    if (!universityCountryValue) {
      setUniversitySuggestions([]);
      setIsUniversitySearching(false);
      return;
    }

    if (query.length < 1) {
      setUniversitySuggestions([]);
      setIsUniversitySearching(false);
      return;
    }

    const timeoutId = window.setTimeout(async () => {
      try {
        setIsUniversitySearching(true);
        const names = await universityService.searchNames(query, universityCountryValue);
        setUniversitySuggestions(names);
      } catch (_error) {
        setUniversitySuggestions([]);
      } finally {
        setIsUniversitySearching(false);
      }
    }, 250);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [universityCountryValue, universityNameValue]);

  useEffect(() => {
    if (!universityCountryValue) {
      setValue('intake', '', { shouldValidate: false });
      setUniversitySuggestions([]);
    }
  }, [setValue, universityCountryValue]);

  useEffect(() => {
    const query = courseNameValue.trim();

    if (query.length < 1) {
      setCourseSuggestions([]);
      setIsCourseSearching(false);
      return;
    }

    const timeoutId = window.setTimeout(async () => {
      try {
        setIsCourseSearching(true);
        const types = await courseService.searchTypes(query);
        setCourseSuggestions(types);
      } catch (_error) {
        setCourseSuggestions([]);
      } finally {
        setIsCourseSearching(false);
      }
    }, 250);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [courseNameValue]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <Controller
        name="universityCountry"
        control={control}
        render={({ field }) => (
          <SelectDropdown
            id="universityCountry"
            label="Where do you want to study?"
            value={field.value ?? ''}
            onChange={(nextValue) => {
              field.onChange(nextValue);
              setValue('universityName', '', { shouldValidate: false });
              setUniversitySuggestions([]);
            }}
            options={universityCountryOptions}
            placeholder="Select a country"
            error={errors.universityCountry?.message}
            className="!border !border-dark-border !bg-dark-surface focus:!border-brand-500 focus:ring-2 focus:ring-brand-500/20"
          />
        )}
      />
      <div ref={universityFieldRef} className="space-y-2">
        <label htmlFor="universityName" className="block text-sm font-medium text-zinc-300">
          University Name
        </label>
        <p className="text-xs text-zinc-400">
          If your institution is not listed in the search results, enter the university name manually.
        </p>
        <div className="relative">
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-zinc-500" aria-hidden>
            <MagnifyingGlass size={16} weight="regular" />
          </span>
          <input
            id="universityName"
            type="search"
            placeholder="Search for your university"
            className="!border !border-dark-border !bg-dark-surface focus:!border-brand-500 focus:ring-2 focus:ring-brand-500/20"
            disabled={!universityCountryValue}
            {...register('universityName')}
          />
        </div>
        {!universityCountryValue ? (
          <p className="mt-2 text-xs text-zinc-400">Select university country first to view matching universities.</p>
        ) : null}
        {isUniversitySearching ? <p className="mt-2 text-xs text-zinc-400">Searching universities...</p> : null}
        {!isUniversitySearching && universitySuggestions.length > 0 ? (
          <ul className="glass-border mt-2 max-h-48 overflow-y-auto rounded-xl border-white/10 bg-dark-surface py-1">
            {universitySuggestions.map((name) => (
              <li key={name}>
                <button
                  type="button"
                  className="w-full px-3 py-2 text-left text-sm text-zinc-200 transition-colors hover:bg-white/5"
                  onClick={() => {
                    setValue('universityName', name, { shouldValidate: true });
                    setUniversitySuggestions([]);
                  }}
                >
                  {name}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
        {submitCount > 0 && errors.universityName ? (
          <p className="mt-1 text-xs text-rose-400">{errors.universityName.message}</p>
        ) : null}
      </div>
      <div ref={courseFieldRef} className="space-y-2">
        <label htmlFor="courseName" className="block text-sm font-medium text-zinc-300">
          Course Name
        </label>
        <p className="text-xs text-zinc-400">
          If the exact course is unavailable in the suggestions, enter your preferred course name manually.
        </p>
        <div className="relative">
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-zinc-500" aria-hidden>
            <MagnifyingGlass size={16} weight="regular" />
          </span>
          <input
            id="courseName"
            type="search"
            placeholder="Search for your course type (e.g., Data Science)"
            className="!border !border-dark-border !bg-dark-surface focus:!border-brand-500 focus:ring-2 focus:ring-brand-500/20"
            {...register('courseName')}
          />
        </div>
        {isCourseSearching ? <p className="mt-2 text-xs text-zinc-400">Searching course types...</p> : null}
        {!isCourseSearching && courseSuggestions.length > 0 ? (
          <ul className="glass-border mt-2 max-h-48 overflow-y-auto rounded-xl border-white/10 bg-dark-surface py-1">
            {courseSuggestions.map((courseType) => (
              <li key={courseType}>
                <button
                  type="button"
                  className="w-full px-3 py-2 text-left text-sm text-zinc-200 transition-colors hover:bg-white/5"
                  onClick={() => {
                    setValue('courseName', courseType, { shouldValidate: true });
                    setCourseSuggestions([]);
                  }}
                >
                  {courseType}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
        {errors.courseName ? <p className="mt-1 text-xs text-rose-400">{errors.courseName.message}</p> : null}
      </div>
      <Controller
        name="degreeType"
        control={control}
        render={({ field }) => (
          <SelectDropdown
            id="degreeType"
            label="Degree Type"
            value={field.value ?? ''}
            onChange={field.onChange}
            options={degreeTypeOptions}
            placeholder="Select a degree type"
            error={errors.degreeType?.message}
            className="!border !border-dark-border !bg-dark-surface focus:!border-brand-500 focus:ring-2 focus:ring-brand-500/20"
          />
        )}
      />
      <Controller
        name="studyMode"
        control={control}
        render={({ field }) => (
          <SelectDropdown
            id="studyMode"
            label="Study Mode"
            value={field.value ?? ''}
            onChange={field.onChange}
            options={studyModeOptions}
            placeholder="Select study mode"
            error={errors.studyMode?.message}
            className="!border !border-dark-border !bg-dark-surface focus:!border-brand-500 focus:ring-2 focus:ring-brand-500/20"
          />
        )}
      />
      <Controller
        name="intake"
        control={control}
        render={({ field }) => (
          <SelectDropdown
            id="intake"
            label="Select Intake"
            value={field.value ?? ''}
            onChange={field.onChange}
            options={intakeOptions}
            placeholder={universityCountryValue ? 'Select intake' : 'Select country first'}
            error={submitCount > 0 ? errors.intake?.message : undefined}
            disabled={!universityCountryValue}
            className="!border !border-dark-border !bg-dark-surface focus:!border-brand-500 focus:ring-2 focus:ring-brand-500/20"
          />
        )}
      />

      <div className="flex items-center gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onBack}>
          Back
        </Button>
        <Button type="submit" fullWidth disabled={loading}>
          {loading ? 'Saving...' : submitLabel}
        </Button>
      </div>
    </form>
  );
};
