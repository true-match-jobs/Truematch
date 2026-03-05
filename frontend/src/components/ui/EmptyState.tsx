type EmptyStateProps = {
  title?: string;
  description: string;
  className?: string;
};

export const EmptyState = ({ title = 'No data', description, className }: EmptyStateProps) => {
  return (
    <div className={["text-center", className].filter(Boolean).join(' ')}>
      <p className="text-sm font-semibold text-zinc-100">{title}</p>
      <p className="mt-1 text-sm text-zinc-400">{description}</p>
    </div>
  );
};
