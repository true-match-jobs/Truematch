import { zodResolver } from '@hookform/resolvers/zod';
import { MagnifyingGlass } from '@phosphor-icons/react';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { SelectDropdown } from '../../../components/ui/SelectDropdown';
import { courseService } from '../../../services/course.service';
import { universityService } from '../../../services/university.service';

const stepApplicationSummarySchema = z.object({
  universityName: z.string().min(2, 'University name is required'),
  universityCountry: z.string().min(2, 'Please select where you want to study'),
  courseName: z.string().min(2, 'Course name is required'),
  degreeType: z.string().min(2, 'Degree type is required'),
  studyMode: z.string().min(2, 'Study mode is required'),
  intake: z.string().min(2, 'Intake is required'),
  applicationDate: z.string().min(1, 'Application date is required')
});

export type StepApplicationSummaryValues = z.infer<typeof stepApplicationSummarySchema>;

type Props = {
  onSubmit: (data: StepApplicationSummaryValues) => Promise<void>;
  onBack: () => void;
  loading: boolean;
  initialValues?: Partial<StepApplicationSummaryValues>;
};

export const StepApplicationSummary = ({ onSubmit, onBack, loading, initialValues }: Props) => {
  const [universitySuggestions, setUniversitySuggestions] = useState<string[]>([]);
  const [isUniversitySearching, setIsUniversitySearching] = useState(false);
  const [courseSuggestions, setCourseSuggestions] = useState<string[]>([]);
  const [isCourseSearching, setIsCourseSearching] = useState(false);
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

  const {
    control,
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm<StepApplicationSummaryValues>({
    resolver: zodResolver(stepApplicationSummarySchema),
    defaultValues: {
      universityName: initialValues?.universityName ?? '',
      universityCountry: initialValues?.universityCountry ?? '',
      courseName: initialValues?.courseName ?? '',
      degreeType: initialValues?.degreeType ?? '',
      studyMode: initialValues?.studyMode ?? '',
      intake: initialValues?.intake ?? '',
      applicationDate: initialValues?.applicationDate ?? ''
    }
  });

  const universityNameValue = watch('universityName') ?? '';
  const courseNameValue = watch('courseName') ?? '';

  useEffect(() => {
    const query = universityNameValue.trim();

    if (query.length < 2) {
      setUniversitySuggestions([]);
      setIsUniversitySearching(false);
      return;
    }

    const timeoutId = window.setTimeout(async () => {
      try {
        setIsUniversitySearching(true);
        const names = await universityService.searchNames(query);
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
  }, [universityNameValue]);

  useEffect(() => {
    const query = courseNameValue.trim();

    if (query.length < 2) {
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
      <div className="space-y-2">
        <label htmlFor="universityName" className="block text-sm font-medium text-zinc-300">
          University Name
        </label>
        <div className="relative">
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-zinc-500" aria-hidden>
            <MagnifyingGlass size={16} weight="regular" />
          </span>
          <input
            id="universityName"
            type="search"
            placeholder="University of Manchester"
            className="glass-border w-full rounded-xl border-white/10 bg-transparent py-3 pl-9 pr-4 text-sm text-white placeholder-zinc-500 outline-none transition-all duration-200 focus:border-white/20"
            {...register('universityName')}
          />
        </div>
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
        {errors.universityName ? <p className="mt-1 text-xs text-rose-400">{errors.universityName.message}</p> : null}
      </div>
      <Controller
        name="universityCountry"
        control={control}
        render={({ field }) => (
          <SelectDropdown
            id="universityCountry"
            label="Where do you want to study?"
            value={field.value ?? ''}
            onChange={field.onChange}
            options={universityCountryOptions}
            placeholder="Select a country"
            error={errors.universityCountry?.message}
          />
        )}
      />
      <div className="space-y-2">
        <label htmlFor="courseName" className="block text-sm font-medium text-zinc-300">
          Course Name
        </label>
        <div className="relative">
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-zinc-500" aria-hidden>
            <MagnifyingGlass size={16} weight="regular" />
          </span>
          <input
            id="courseName"
            type="search"
            placeholder="Search for a course type (e.g., Data Science)"
            className="glass-border w-full rounded-xl border-white/10 bg-transparent py-3 pl-9 pr-4 text-sm text-white placeholder-zinc-500 outline-none transition-all duration-200 focus:border-white/20"
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
          />
        )}
      />
      <Input
        id="intake"
        label="Intake"
        placeholder="September 2026"
        error={errors.intake?.message}
        className="glass-border border-white/10 focus:border-white/20"
        {...register('intake')}
      />
      <Input
        id="applicationDate"
        type="date"
        label="Application Date"
        error={errors.applicationDate?.message}
        className="glass-border border-white/10 focus:border-white/20"
        {...register('applicationDate')}
      />

      <div className="flex items-center gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onBack}>
          Back
        </Button>
        <Button type="submit" fullWidth disabled={loading}>
          {loading ? 'Saving...' : 'Continue'}
        </Button>
      </div>
    </form>
  );
};
