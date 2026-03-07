import { X } from '@phosphor-icons/react';

type ImagePreviewDialogProps = {
  image: {
    url: string;
    name: string;
  } | null;
  onClose: () => void;
};

export const ImagePreviewDialog = ({ image, onClose }: ImagePreviewDialogProps) => {
  if (!image) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 px-4 py-4"
      role="dialog"
      aria-modal="true"
      aria-label="Image preview"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white transition-colors hover:bg-black/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
        aria-label="Close image preview"
      >
        <X size={18} weight="bold" />
      </button>

      <img
        src={image.url}
        alt={image.name}
        className="h-auto w-auto max-h-[95vh] max-w-[95vw] object-contain"
        onClick={(event) => event.stopPropagation()}
      />
    </div>
  );
};
