import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Footer } from '../../components/layout/Footer';
import { Navbar } from '../../components/layout/Navbar';
import { Snackbar } from '../../components/ui/Snackbar';
import { SNACKBAR_AUTO_DISMISS_DELAY_MS } from '../../constants/snackbar';
import { adminUserService } from '../../services/admin-user.service';
import { notificationService } from '../../services/notification.service';

export const AdminNotificationComposerPage = () => {
  const { userId } = useParams<{ userId: string }>();
  const [message, setMessage] = useState('');
  const [recipientName, setRecipientName] = useState<string>('Student');
  const [isLoadingRecipient, setIsLoadingRecipient] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showSuccessSnackbar, setShowSuccessSnackbar] = useState(false);

  useEffect(() => {
    let isCancelled = false;

    const loadRecipient = async () => {
      if (!userId) {
        setErrorMessage('Recipient user is required.');
        setIsLoadingRecipient(false);
        return;
      }

      setIsLoadingRecipient(true);
      setErrorMessage(null);

      try {
        const users = await adminUserService.getAll();

        if (isCancelled) {
          return;
        }

        const matchedUser = users.find((user) => user.id === userId);

        if (!matchedUser) {
          setErrorMessage('Recipient user was not found.');
          return;
        }

        setRecipientName(matchedUser.fullName);
      } catch (_error) {
        if (isCancelled) {
          return;
        }

        setErrorMessage('Unable to load recipient details right now.');
      } finally {
        if (!isCancelled) {
          setIsLoadingRecipient(false);
        }
      }
    };

    void loadRecipient();

    return () => {
      isCancelled = true;
    };
  }, [userId]);

  useEffect(() => {
    if (!showSuccessSnackbar) {
      return;
    }

    const timer = window.setTimeout(() => {
      setShowSuccessSnackbar(false);
    }, SNACKBAR_AUTO_DISMISS_DELAY_MS);

    return () => {
      window.clearTimeout(timer);
    };
  }, [showSuccessSnackbar]);

  const helperText = useMemo(() => {
    if (isLoadingRecipient) {
      return 'Loading recipient details...';
    }

    return `Send a direct notification to ${recipientName}.`;
  }, [isLoadingRecipient, recipientName]);

  const handleSend = async () => {
    if (!userId || !message.trim()) {
      return;
    }

    try {
      setIsSending(true);
      setErrorMessage(null);
      await notificationService.sendToUser(userId, message);
      setMessage('');
      setShowSuccessSnackbar(true);
    } catch (_error) {
      setErrorMessage('Unable to send notification right now. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-dark-bg">
      <Navbar />

      <main className="mx-auto flex flex-1 w-full max-w-xl flex-col items-center justify-center px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="w-full space-y-8 rounded-2xl border border-white/40 bg-transparent p-6 sm:p-10">
          <div className="space-y-2 text-left">
            <h1 className="text-2xl font-bold text-white sm:text-3xl">Notification Composer</h1>
            <p className="text-sm text-zinc-400">{helperText}</p>
          </div>

          <div>
            <label htmlFor="notification-message" className="text-sm font-medium text-zinc-200">
              Message
            </label>
            <textarea
              id="notification-message"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              rows={6}
              placeholder="Type your notification message..."
              className="mt-2 w-full rounded-lg border border-white/40 bg-transparent px-3 py-2 text-sm text-zinc-100 outline-none transition-colors placeholder:text-zinc-500 focus:border-brand-500"
              disabled={isSending || isLoadingRecipient || Boolean(errorMessage && errorMessage.includes('Recipient user was not found'))}
            />
          </div>

          {errorMessage ? <p className="mt-3 text-sm text-rose-400">{errorMessage}</p> : null}

          <div>
            <button
              type="button"
              onClick={() => void handleSend()}
              disabled={isSending || isLoadingRecipient || !message.trim() || Boolean(errorMessage && errorMessage.includes('Recipient user was not found'))}
              className="w-full rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSending ? 'Sending...' : 'Send'}
            </button>
          </div>
        </div>
      </main>

      <Snackbar message="Notification sent successfully" visible={showSuccessSnackbar} position="bottom-center" />
      <Footer />
    </div>
  );
};
