import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '../../../../components/ui/Button';
import { Input } from '../../../../components/ui/Input';
import type { PersonalDetailsValues } from './types';

const stepPassportDetailsSchema = z.object({
  passportNumber: z.string().min(1, 'Passport number is required'),
  passportExpiryDate: z.string().min(1, 'Passport expiry date is required')
});

export type StepPassportDetailsValues = z.infer<typeof stepPassportDetailsSchema>;

type Props = {
  onSubmit: (data: StepPassportDetailsValues) => Promise<void>;
  onBack: () => void;
  loading: boolean;
  initialValues?: Partial<PersonalDetailsValues>;
};

export const StepPassportDetails = ({ onSubmit, onBack, loading, initialValues }: Props) => {
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<StepPassportDetailsValues>({
    resolver: zodResolver(stepPassportDetailsSchema),
    defaultValues: {
      passportNumber: initialValues?.passportNumber ?? '',
      passportExpiryDate: initialValues?.passportExpiryDate ?? ''
    }
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <Input
        id="passportNumber"
        label="Passport Number"
        placeholder="A12345678"
        error={errors.passportNumber?.message}
        className="glass-border border-white/10 focus:border-white/20"
        {...register('passportNumber')}
      />
      <Input
        id="passportExpiryDate"
        type="date"
        label="Passport Expiry Date"
        error={errors.passportExpiryDate?.message}
        className="glass-border border-white/10 focus:border-white/20"
        {...register('passportExpiryDate')}
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
