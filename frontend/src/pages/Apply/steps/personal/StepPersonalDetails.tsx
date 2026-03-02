import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '../../../../components/ui/Button';
import { Input } from '../../../../components/ui/Input';
import { SelectDropdown } from '../../../../components/ui/SelectDropdown';
import type { PersonalDetailsValues } from './types';

const stepPersonalDetailsSchema = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  gender: z.string().min(1, 'Gender is required'),
  countryCode: z.string().min(1, 'Country code is required'),
  phoneNumber: z.string().min(1, 'Phone number is required')
});

export type StepPersonalDetailsValues = z.infer<typeof stepPersonalDetailsSchema>;

type Props = {
  onSubmit: (data: StepPersonalDetailsValues) => Promise<void>;
  loading: boolean;
  initialValues?: Partial<PersonalDetailsValues>;
  onBack?: () => void;
};

export const StepPersonalDetails = ({ onSubmit, loading, initialValues, onBack }: Props) => {
  const genderOptions = [
    { label: 'Male', value: 'Male' },
    { label: 'Female', value: 'Female' }
  ];

  const {
    control,
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<StepPersonalDetailsValues>({
    resolver: zodResolver(stepPersonalDetailsSchema),
    defaultValues: {
      fullName: initialValues?.fullName ?? '',
      dateOfBirth: initialValues?.dateOfBirth ?? '',
      gender: initialValues?.gender ?? '',
      countryCode: initialValues?.countryCode ?? '',
      phoneNumber: initialValues?.phoneNumber ?? ''
    }
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <Input
        id="fullName"
        label="Full Name"
        placeholder="Ada Okafor"
        error={errors.fullName?.message}
        {...register('fullName')}
      />
      <Input
        id="dateOfBirth"
        type="date"
        label="Date of Birth"
        error={errors.dateOfBirth?.message}
        {...register('dateOfBirth')}
      />
      <Controller
        name="gender"
        control={control}
        render={({ field }) => (
          <SelectDropdown
            id="gender"
            label="Gender"
            value={field.value ?? ''}
            onChange={field.onChange}
            options={genderOptions}
            placeholder="Select gender"
            error={errors.gender?.message}
          />
        )}
      />
      <div className="grid grid-cols-[84px_minmax(0,1fr)] gap-3">
        <Input
          id="countryCode"
          type="tel"
          label="Code"
          placeholder="+234"
          maxLength={6}
          error={errors.countryCode?.message}
          {...register('countryCode')}
        />
        <Input
          id="phoneNumber"
          type="tel"
          label="Phone Number"
          placeholder="8012345678"
          maxLength={12}
          error={errors.phoneNumber?.message}
          {...register('phoneNumber')}
        />
      </div>

      <div className={`pt-2 ${onBack ? 'flex items-center gap-3' : ''}`}>
        {onBack ? (
          <Button type="button" variant="secondary" onClick={onBack}>
            Back
          </Button>
        ) : null}
        <Button type="submit" fullWidth disabled={loading}>
          {loading ? 'Saving...' : 'Continue'}
        </Button>
      </div>
    </form>
  );
};
