import { useEffect, useState } from 'react';
import { Snackbar } from '../../components/ui/Snackbar';
import { SNACKBAR_AUTO_DISMISS_DELAY_MS } from '../../constants/snackbar';

export const MyWallet = () => {
  const [showInfoSnackbar, setShowInfoSnackbar] = useState(false);

  useEffect(() => {
    if (!showInfoSnackbar) {
      return;
    }

    const timer = window.setTimeout(() => {
      setShowInfoSnackbar(false);
    }, SNACKBAR_AUTO_DISMISS_DELAY_MS);

    return () => {
      window.clearTimeout(timer);
    };
  }, [showInfoSnackbar]);

  const handleAddFund = () => {
    setShowInfoSnackbar(true);
  };

  return (
    <div className="h-full overflow-y-auto px-3 py-5 sm:px-5">
      <Snackbar
        message="You can't add fund at this moment."
        visible={showInfoSnackbar}
        position="bottom-center"
        styleClassName="border"
        contentStyle={{
          borderColor: 'rgba(139, 92, 246, 0.6)',
          backgroundColor: 'rgba(139, 92, 246, 0.35)',
          color: '#ffffff'
        }}
      />
      <div className="space-y-6">
        <section className="mb-8 px-1 py-1 sm:mb-10">
          <h2 className="text-xl font-semibold tracking-tight text-zinc-100">My Wallet</h2>
        </section>

        <section className="glass-border max-w-md rounded-xl bg-dark-card p-5">
          <p className="text-sm font-semibold uppercase tracking-wide text-zinc-300">Account Balance</p>
          <p className="mt-3 text-3xl font-semibold text-zinc-100">$0.00</p>
          <div className="mt-4 flex justify-end">
            <button type="button" onClick={handleAddFund} className="rounded-lg bg-white/5 px-3 py-1.5 text-sm">
              Add fund
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};
