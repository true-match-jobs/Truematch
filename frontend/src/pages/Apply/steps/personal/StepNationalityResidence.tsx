import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '../../../../components/ui/Button';
import { Input } from '../../../../components/ui/Input';
import type { PersonalDetailsValues } from './types';

const stepNationalityResidenceSchema = z.object({
  nationality: z.string().min(1, 'Nationality is required'),
  countryOfResidence: z.string().min(1, 'Country of residence is required'),
  stateOrProvince: z.string().min(1, 'State / Province is required'),
  residentialAddress: z.string().min(1, 'Residential address is required')
});

export type StepNationalityResidenceValues = z.infer<typeof stepNationalityResidenceSchema>;

type Props = {
  onSubmit: (data: StepNationalityResidenceValues) => Promise<void>;
  onBack: () => void;
  loading: boolean;
  initialValues?: Partial<PersonalDetailsValues>;
};

export const StepNationalityResidence = ({ onSubmit, onBack, loading, initialValues }: Props) => {
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<StepNationalityResidenceValues>({
    resolver: zodResolver(stepNationalityResidenceSchema),
    defaultValues: {
      nationality: initialValues?.nationality ?? '',
      countryOfResidence: initialValues?.countryOfResidence ?? '',
      stateOrProvince: initialValues?.stateOrProvince ?? '',
      residentialAddress: initialValues?.residentialAddress ?? ''
    }
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <Input
        id="nationality"
        label="Nationality"
        placeholder="Enter nationality"
        error={errors.nationality?.message}
        {...register('nationality')}
      />
      <Input
        id="countryOfResidence"
        label="Country of Residence"
        placeholder="Enter country of residence"
        error={errors.countryOfResidence?.message}
        {...register('countryOfResidence')}
      />
      <Input
        id="stateOrProvince"
        label="State / Province"
        placeholder="Enter state or province"
        error={errors.stateOrProvince?.message}
        {...register('stateOrProvince')}
      />
      <Input
        id="residentialAddress"
        label="Residential Address"
        placeholder="Enter residential address"
        error={errors.residentialAddress?.message}
        {...register('residentialAddress')}
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
