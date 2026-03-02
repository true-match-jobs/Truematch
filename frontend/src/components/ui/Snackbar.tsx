type SnackbarProps = {
  message: string;
  visible: boolean;
  position?: 'top-center' | 'bottom-center';
};

export const Snackbar = ({ message, visible, position = 'top-center' }: SnackbarProps) => {
  if (!visible) {
    return null;
  }

  const positionClassName =
    position === 'bottom-center'
      ? 'fixed left-4 right-4 bottom-14 z-50'
      : 'fixed left-4 right-4 top-4 z-50';

  return (
    <div className={`pointer-events-none ${positionClassName}`}>
      <div className="min-w-full rounded-md border border-emerald-500/60 bg-emerald-500/35 px-3 py-3 text-xs font-medium text-emerald-200 shadow-lg">
        {message}
      </div>
    </div>
  );
};
