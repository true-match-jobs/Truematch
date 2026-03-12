import { MagnifyingGlass } from '@phosphor-icons/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '../../../components/ui/Button';
import { SelectDropdown } from '../../../components/ui/SelectDropdown';
import { jobService } from '../../../services/job.service';

const stepSkillProfessionSchema = z.object({
  skillOrProfession: z.string().min(1, 'Please enter a skill or profession'),
  workCountry: z.string().min(2, 'Please select where you want to work')
});

export type StepSkillProfessionValues = z.infer<typeof stepSkillProfessionSchema>;

type Props = {
  onSubmit: (data: StepSkillProfessionValues) => Promise<void>;
  onBack: () => void;
  loading: boolean;
  initialValues?: Partial<StepSkillProfessionValues>;
  submitLabel?: string;
};

export const StepSkillProfession = ({ onSubmit, onBack, loading, initialValues, submitLabel = 'Continue' }: Props) => {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const skillFieldRef = useRef<HTMLDivElement | null>(null);
  const workCountryOptions = [
    { label: 'United Kingdom (UK)', value: 'United Kingdom' },
    { label: 'Canada', value: 'Canada' },
    { label: 'Australia', value: 'Australia' }
  ];

  const {
    control,
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm<StepSkillProfessionValues>({
    resolver: zodResolver(stepSkillProfessionSchema),
    defaultValues: {
      skillOrProfession: initialValues?.skillOrProfession ?? '',
      workCountry: initialValues?.workCountry ?? ''
    }
  });

  const skillValue = watch('skillOrProfession') ?? '';

  useEffect(() => {
    const handleDocumentClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!skillFieldRef.current?.contains(target)) {
        setSuggestions([]);
      }
    };

    document.addEventListener('mousedown', handleDocumentClick);

    return () => {
      document.removeEventListener('mousedown', handleDocumentClick);
    };
  }, []);

  useEffect(() => {
    const query = skillValue.trim();

    if (query.length < 1) {
      setSuggestions([]);
      setIsSearching(false);
      return;
    }

    const timeoutId = window.setTimeout(async () => {
      try {
        setIsSearching(true);
        const titles = await jobService.searchTitles(query);
        setSuggestions(titles);
      } catch (_error) {
        setSuggestions([]);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [skillValue]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div ref={skillFieldRef} className="space-y-2">
        <label htmlFor="skillOrProfession" className="block text-sm font-medium text-zinc-300">
          Skill or Profession
        </label>
        <p className="text-xs text-zinc-400">
          If your exact skill or profession is not shown in the suggestions, enter it manually.
        </p>
        <div className="relative">
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-zinc-500" aria-hidden>
            <MagnifyingGlass size={16} weight="regular" />
          </span>
          <input
            id="skillOrProfession"
            type="search"
            placeholder="Search for a skill or profession"
            className="w-full rounded-xl border border-dark-border bg-dark-surface py-3 pl-9 pr-4 text-sm text-white placeholder-zinc-500 outline-none transition-all duration-200 focus:border-white/70 focus:ring-2 focus:ring-white/20"
            {...register('skillOrProfession')}
          />
        </div>
        {isSearching ? <p className="mt-2 text-xs text-zinc-400">Searching job titles...</p> : null}
        {!isSearching && suggestions.length > 0 ? (
          <ul className="glass-border mt-2 max-h-48 overflow-y-auto rounded-xl border-white/10 bg-dark-surface py-1">
            {suggestions.map((title) => (
              <li key={title}>
                <button
                  type="button"
                  className="w-full px-3 py-2 text-left text-sm text-zinc-200 transition-colors hover:bg-white/5"
                  onClick={() => {
                    setValue('skillOrProfession', title, { shouldValidate: true });
                    setSuggestions([]);
                  }}
                >
                  {title}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
        {errors.skillOrProfession ? <p className="mt-1 text-xs text-rose-400">{errors.skillOrProfession.message}</p> : null}
      </div>

      <Controller
        name="workCountry"
        control={control}
        render={({ field }) => (
          <SelectDropdown
            id="workCountry"
            label="Where do you want to work?"
            value={field.value ?? ''}
            onChange={field.onChange}
            options={workCountryOptions}
            placeholder="Select a country"
            error={errors.workCountry?.message}
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
