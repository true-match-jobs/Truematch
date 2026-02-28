import { MagnifyingGlass } from '@phosphor-icons/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '../../../components/ui/Button';
import { jobService } from '../../../services/job.service';

const stepSkillProfessionSchema = z.object({
  skillOrProfession: z.string().min(1, 'Please enter a skill or profession')
});

export type StepSkillProfessionValues = z.infer<typeof stepSkillProfessionSchema>;

type Props = {
  onSubmit: (data: StepSkillProfessionValues) => Promise<void>;
  onBack: () => void;
  loading: boolean;
  initialValues?: Partial<StepSkillProfessionValues>;
};

export const StepSkillProfession = ({ onSubmit, onBack, loading, initialValues }: Props) => {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm<StepSkillProfessionValues>({
    resolver: zodResolver(stepSkillProfessionSchema),
    defaultValues: {
      skillOrProfession: initialValues?.skillOrProfession ?? ''
    }
  });

  const skillValue = watch('skillOrProfession') ?? '';

  useEffect(() => {
    const query = skillValue.trim();

    if (query.length < 2) {
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
      <div className="space-y-2">
        <label htmlFor="skillOrProfession" className="block text-sm font-medium text-zinc-300">
          Skill or Profession
        </label>
        <div className="relative">
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-zinc-500" aria-hidden>
            <MagnifyingGlass size={16} weight="regular" />
          </span>
          <input
            id="skillOrProfession"
            type="search"
            placeholder="Search for a skill or profession"
            className="glass-border w-full rounded-xl border-white/10 bg-transparent py-3 pl-9 pr-4 text-sm text-white placeholder-zinc-500 outline-none transition-all duration-200 focus:border-white/20"
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
