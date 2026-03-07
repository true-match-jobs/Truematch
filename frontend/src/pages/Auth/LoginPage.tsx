import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { Footer } from '../../components/layout/Footer';
import { Navbar } from '../../components/layout/Navbar';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useAuth } from '../../hooks/useAuth';
import { useAuthStore } from '../../store/auth.store';

const loginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters')
});

type LoginFormValues = z.infer<typeof loginSchema>;

export const LoginPage = () => {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: ''
    }
  });

  const onSubmit = async (values: LoginFormValues) => {
    try {
      setSubmitting(true);
      setErrorMessage(null);
      await login(values);
      const isAdmin = useAuthStore.getState().user?.role === 'ADMIN';
      navigate(isAdmin ? '/admin/dashboard' : '/dashboard');
    } catch (_error) {
      setErrorMessage('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-dark-bg">
      <Navbar />
      <main className="mx-auto flex flex-1 w-full max-w-xl flex-col items-center justify-center px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="w-full space-y-8 rounded-2xl border border-white/40 bg-transparent p-6 sm:p-10">
          <div className="space-y-2 text-left">
            <h1 className="text-2xl font-bold text-white sm:text-3xl">Sign in to your account</h1>
            <p className="text-sm text-zinc-400">Sign in to continue your application journey.</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <Input id="email" type="email" label="Email" placeholder="Enter your email address" error={errors.email?.message} {...register('email')} />
            <Input id="password" type="password" label="Password" placeholder="Enter your password" error={errors.password?.message} {...register('password')} />

            <div className="-mt-1 text-right">
              <Link to="/forgot-password" className="text-sm font-medium text-brand-400 transition-colors hover:text-brand-300">
                Forgot password?
              </Link>
            </div>

            {errorMessage ? (
              <p className="rounded-lg bg-rose-500/10 px-4 py-2.5 text-center text-sm text-rose-400">
                {errorMessage}
              </p>
            ) : null}

            <div className="pt-2">
              <Button type="submit" fullWidth disabled={submitting}>
                {submitting ? (
                  <span className="inline-flex items-center gap-2">
                    <span
                      className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"
                      aria-hidden
                    />
                    <span>Signing in...</span>
                  </span>
                ) : (
                  'Sign In'
                )}
              </Button>
            </div>
          </form>

          <p className="text-center text-sm text-zinc-400">
            New here?{' '}
            <Link to="/apply" className="font-medium text-brand-400 hover:text-brand-300 transition-colors">
              Start your application
            </Link>
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
};
