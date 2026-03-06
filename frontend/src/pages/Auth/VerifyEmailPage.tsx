import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Footer } from '../../components/layout/Footer';
import { Navbar } from '../../components/layout/Navbar';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../hooks/useAuth';
import { authService } from '../../services/auth.service';

type VerificationState = 'loading' | 'success' | 'error';

export const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated, setSessionUser } = useAuth();
  const token = useMemo(() => searchParams.get('token')?.trim() ?? '', [searchParams]);
  const [state, setState] = useState<VerificationState>('loading');
  const [message, setMessage] = useState('Verifying your email...');
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    const runVerification = async () => {
      if (!token) {
        setState('error');
        setMessage('Invalid verification link.');
        return;
      }

      try {
        const successMessage = await authService.verifyEmail(token);

        if (isAuthenticated) {
          const refreshedUser = await authService.getMe();
          setSessionUser(refreshedUser);
        }

        setState('success');
        setMessage(successMessage);
      } catch {
        setState('error');
        setMessage('Verification link is invalid or expired.');
      }
    };

    void runVerification();
  }, [isAuthenticated, setSessionUser, token]);

  const handleResend = async () => {
    try {
      setIsResending(true);
      const responseMessage = await authService.resendEmailVerification();
      setMessage(responseMessage);
      setState('success');
    } catch {
      setMessage('Unable to resend verification email right now. Please try again shortly.');
      setState('error');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-dark-bg">
      <Navbar />
      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="flex flex-1 items-center">
          <section className="w-full space-y-8 rounded-2xl border border-white/40 bg-transparent p-6 sm:p-10" aria-live="polite">
            <div className="space-y-2 text-left">
              <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Verify Your Email Address</h1>
              <p className="text-sm leading-relaxed text-zinc-300 sm:text-base">
                Confirm your email to protect your account and continue receiving important application updates,
                admission notices, and time-sensitive next steps.
              </p>
            </div>

            <div className="rounded-xl border border-white/40 bg-transparent px-4 py-3.5 sm:px-5">
              <p
                className={
                  state === 'success'
                    ? 'text-sm text-emerald-400'
                    : state === 'error'
                      ? 'text-sm text-rose-400'
                      : 'text-sm text-zinc-300'
                }
              >
                {message}
              </p>
            </div>

            <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
              {state === 'success' ? (
                <Button type="button" onClick={() => navigate('/dashboard')}>
                  Go to dashboard
                </Button>
              ) : null}

              {state === 'error' && isAuthenticated ? (
                <Button type="button" variant="secondary" onClick={handleResend} disabled={isResending}>
                  {isResending ? 'Resending...' : 'Resend verification email'}
                </Button>
              ) : null}
            </div>

            {state !== 'success' ? (
              <p className="text-xs text-zinc-400">
                Verification links expire for security. If your link is no longer valid, request a new one and check
                your inbox immediately.
              </p>
            ) : null}
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
};
