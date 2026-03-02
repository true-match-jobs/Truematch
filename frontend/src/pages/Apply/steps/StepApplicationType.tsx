import { RadioButton } from '@phosphor-icons/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '../../../components/ui/Button';

const stepApplicationTypeSchema = z.object({
  applicationType: z.enum(['study_scholarship', 'work_employment'], {
    message: 'Please select an application type'
  })
});

export type StepApplicationTypeValues = z.infer<typeof stepApplicationTypeSchema>;

type Props = {
  onSubmit: (data: StepApplicationTypeValues) => Promise<void>;
  onBack?: () => void;
  loading: boolean;
  initialValues?: Partial<StepApplicationTypeValues>;
  submitLabel?: string;
};

export const StepApplicationType = ({ onSubmit, onBack, loading, initialValues, submitLabel = 'Continue' }: Props) => {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm<StepApplicationTypeValues>({
    resolver: zodResolver(stepApplicationTypeSchema),
    defaultValues: {
      applicationType: initialValues?.applicationType
    }
  });

  const selectedType = watch('applicationType');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <fieldset className="space-y-4">
        <legend className="text-sm font-medium text-zinc-300">Select your application type</legend>

        <label className="flex cursor-pointer items-start gap-3 text-sm text-zinc-200 transition-colors hover:text-white">
          <input
            type="radio"
            value="study_scholarship"
            className="sr-only"
            {...register('applicationType')}
          />
          <RadioButton
            size={18}
            weight={selectedType === 'study_scholarship' ? 'fill' : 'regular'}
            className={selectedType === 'study_scholarship' ? 'text-brand-400' : 'text-zinc-500'}
            aria-hidden
          />
          <span>Study or Scholarship Application</span>
        </label>

        <label className="flex cursor-pointer items-start gap-3 text-sm text-zinc-200 transition-colors hover:text-white">
          <input
            type="radio"
            value="work_employment"
            className="sr-only"
            {...register('applicationType')}
          />
          <RadioButton
            size={18}
            weight={selectedType === 'work_employment' ? 'fill' : 'regular'}
            className={selectedType === 'work_employment' ? 'text-brand-400' : 'text-zinc-500'}
            aria-hidden
          />
          <span>Employment or Work Application</span>
        </label>

        {errors.applicationType ? <p className="text-xs text-rose-400">{errors.applicationType.message}</p> : null}
      </fieldset>

      <div className={`pt-2 ${onBack ? 'flex items-center gap-3' : ''}`}>
        {onBack ? (
          <Button type="button" variant="secondary" onClick={onBack}>
            Back
          </Button>
        ) : null}
        <Button type="submit" fullWidth disabled={loading}>
          {loading ? 'Saving...' : submitLabel}
        </Button>
      </div>
    </form>
  );
};
