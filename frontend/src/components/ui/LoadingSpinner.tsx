type LoadingSpinnerProps = {
  className?: string;
  sizeClassName?: string;
};

export const LoadingSpinner = ({
  className = 'py-8',
  sizeClassName = 'h-8 w-8 border-2'
}: LoadingSpinnerProps) => {
  return (
    <div className={`flex items-center justify-center ${className}`} role="status" aria-live="polite">
      <span className={`inline-block animate-spin rounded-full border-white/20 border-t-zinc-100 ${sizeClassName}`} aria-hidden />
    </div>
  );
};
