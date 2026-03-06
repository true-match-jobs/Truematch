import { zodResolver } from '@hookform/resolvers/zod';
import axios from 'axios';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { z } from 'zod';
import { Footer } from '../../components/layout/Footer';
import { Navbar } from '../../components/layout/Navbar';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { authService } from '../../services/auth.service';

const forgotPasswordSchema = z.object({
  email: z.string().email('Enter a valid email')
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

type ApiErrorResponse = {
  message?: string;
};

export const ForgotPasswordPage = () => {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: ''
    }
  });

  const onSubmit = async (values: ForgotPasswordFormValues) => {
    try {
      setSubmitting(true);
      setErrorMessage(null);
      const message = await authService.requestPasswordReset(values.email);
      setSuccessMessage(message);
    } catch (error) {
      if (axios.isAxiosError<ApiErrorResponse>(error)) {
        setErrorMessage(error.response?.data?.message ?? 'Unable to send reset email right now. Please try again.');
      } else {
        setErrorMessage('Unable to send reset email right now. Please try again.');
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
            <h1 className="text-2xl font-bold text-white sm:text-3xl">Forgot your password?</h1>
            <p className="text-sm text-zinc-400">
              Enter your account email and we will send you a secure link to reset your password.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <Input
              id="email"
              type="email"
              label="Email"
              placeholder="Enter your email address"
              error={errors.email?.message}
              {...register('email')}
            />

            {successMessage ? (
              <p className="rounded-lg bg-emerald-500/10 px-4 py-2.5 text-sm text-emerald-400">{successMessage}</p>
            ) : null}

            {errorMessage ? (
              <p className="rounded-lg bg-rose-500/10 px-4 py-2.5 text-sm text-rose-400">{errorMessage}</p>
            ) : null}

            <div className="pt-2">
              <Button type="submit" fullWidth disabled={submitting}>
                {submitting ? 'Sending reset link...' : 'Send Reset Link'}
              </Button>
            </div>
          </form>

          <p className="text-center text-sm text-zinc-400">
            Remembered your password?{' '}
            <Link to="/login" className="font-medium text-brand-400 transition-colors hover:text-brand-300">
              Back to sign in
            </Link>
          </p>
        </section>
      </main>
      <Footer />
    </div>
  );
};
