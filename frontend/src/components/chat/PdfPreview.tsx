import { FilePdf } from '@phosphor-icons/react';
import type { ChatAttachment } from '../../services/chat.service';

type PdfPreviewProps = {
  attachment: ChatAttachment;
  pageWidth?: number;
  className?: string;
};

export const PdfPreview = ({ attachment, pageWidth = 260, className = '' }: PdfPreviewProps) => {
  void attachment;
  void pageWidth;

  return (
    <div className={`overflow-hidden rounded-lg bg-zinc-900 ${className}`}>
      <div className="flex h-20 w-full items-center justify-center rounded-md border border-white/10 bg-black/20">
        <FilePdf size={44} weight="fill" className="text-rose-400" aria-hidden="true" />
      </div>
    </div>
  );
};
