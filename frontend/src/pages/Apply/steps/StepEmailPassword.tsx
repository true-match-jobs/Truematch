import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';

const stepEmailPasswordSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters')
});

export type StepEmailPasswordValues = z.infer<typeof stepEmailPasswordSchema>;

type Props = {
  onSubmit: (data: StepEmailPasswordValues) => Promise<void>;
  onBack: () => void;
  loading: boolean;
  initialValues?: Partial<StepEmailPasswordValues>;
};

export const StepEmailPassword = ({ onSubmit, onBack, loading, initialValues }: Props) => {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm<StepEmailPasswordValues>({
    resolver: zodResolver(stepEmailPasswordSchema),
    defaultValues: {
      email: initialValues?.email ?? '',
      password: initialValues?.password ?? ''
    }
  });

  const emailValue = watch('email') ?? '';
  const passwordValue = watch('password') ?? '';
  const isSubmitDisabled = loading || emailValue.trim().length === 0 || passwordValue.trim().length === 0;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <Input
        id="email"
        type="email"
        label="Email"
        placeholder="Enter your email address"
        error={errors.email?.message}
        {...register('email')}
      />
      <Input
        id="password"
        type="password"
        label="Password"
        placeholder="Enter your password"
        error={errors.password?.message}
        {...register('password')}
      />

      <div className="flex items-center gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onBack}>
          Back
        </Button>
        <Button type="submit" fullWidth disabled={isSubmitDisabled}>
          {loading ? 'Submitting...' : 'Submit Application'}
        </Button>
      </div>
    </form>
  );
};
