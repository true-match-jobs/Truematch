type PdfPreviewProps = {
  previewUrl?: string;
  pageWidth?: number;
  className?: string;
};

export const PdfPreview = ({ previewUrl, pageWidth = 260, className = '' }: PdfPreviewProps) => {
  return (
    <div className={`overflow-hidden rounded-lg bg-zinc-900 ${className}`}>
      {previewUrl ? (
        <img
          src={previewUrl}
          alt="PDF preview"
          style={{ width: `${pageWidth}px` }}
          className="h-auto max-w-full"
        />
      ) : (
        <div className="flex h-32 items-center justify-center px-3 text-xs text-zinc-300">PDF preview unavailable</div>
      )}
    </div>
  );
};
