import { zodResolver } from '@hookform/resolvers/zod';
import axios from 'axios';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useSearchParams } from 'react-router-dom';
import { z } from 'zod';
import { Footer } from '../../components/layout/Footer';
import { Navbar } from '../../components/layout/Navbar';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { authService } from '../../services/auth.service';

const resetPasswordSchema = z
  .object({
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(8, 'Confirm your password')
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match'
  });

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

type ApiErrorResponse = {
  message?: string;
};

export const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const token = useMemo(() => searchParams.get('token')?.trim() ?? '', [searchParams]);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: ''
    }
  });

  const onSubmit = async (values: ResetPasswordFormValues) => {
    if (!token) {
      setErrorMessage('Invalid password reset link. Request a new one to continue.');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMessage(null);
      const message = await authService.resetPassword({
        token,
        password: values.password
      });
      setSuccessMessage(message);
    } catch (error) {
      if (axios.isAxiosError<ApiErrorResponse>(error)) {
        setErrorMessage(error.response?.data?.message ?? 'Unable to reset password right now. Please try again.');
      } else {
        setErrorMessage('Unable to reset password right now. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-dark-bg">
      <Navbar />
      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <section className="w-full space-y-8 rounded-2xl border border-white/40 bg-transparent p-6 sm:p-10" aria-live="polite">
          <div className="space-y-2 text-left">
            <h1 className="text-2xl font-bold text-white sm:text-3xl">Reset your password</h1>
            <p className="text-sm text-zinc-400">Create a new password to regain secure access to your TrueMatch account.</p>
          </div>

          {!token ? (
            <p className="rounded-lg bg-rose-500/10 px-4 py-2.5 text-sm text-rose-400">
              This reset link is invalid. Request a new reset email from the forgot password page.
            </p>
          ) : null}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <Input
              id="password"
              type="password"
              label="New Password"
              placeholder="Enter your new password"
              error={errors.password?.message}
              {...register('password')}
            />
            <Input
              id="confirmPassword"
              type="password"
              label="Confirm Password"
              placeholder="Re-enter your new password"
              error={errors.confirmPassword?.message}
              {...register('confirmPassword')}
            />

            {successMessage ? (
              <p className="rounded-lg bg-emerald-500/10 px-4 py-2.5 text-sm text-emerald-400">{successMessage}</p>
            ) : null}

            {errorMessage ? (
              <p className="rounded-lg bg-rose-500/10 px-4 py-2.5 text-sm text-rose-400">{errorMessage}</p>
            ) : null}

            <div className="pt-2">
              <Button type="submit" fullWidth disabled={submitting || !token || Boolean(successMessage)}>
                {submitting ? 'Updating password...' : 'Update Password'}
              </Button>
            </div>
          </form>

          <p className="text-center text-sm text-zinc-400">
            Ready to sign in?{' '}
            <Link to="/login" className="font-medium text-brand-400 transition-colors hover:text-brand-300">
              Go to login
            </Link>
          </p>

          {!token ? (
            <p className="text-center text-sm text-zinc-400">
              Need a fresh link?{' '}
              <Link to="/forgot-password" className="font-medium text-brand-400 transition-colors hover:text-brand-300">
                Request password reset
              </Link>
            </p>
          ) : null}
        </section>
      </main>
      <Footer />
    </div>
  );
};
