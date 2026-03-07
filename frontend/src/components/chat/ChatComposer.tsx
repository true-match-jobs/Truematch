import { FilePdf, PaperPlaneTilt, Paperclip, X } from '@phosphor-icons/react';
import { useLayoutEffect, useRef } from 'react';
import type { PendingComposerAttachment } from '../../hooks/chat/chat-types';

const MAX_COMPOSER_HEIGHT = 112;

type ChatComposerProps = {
  draft: string;
  setDraft: (value: string) => void;
  pendingAttachment: PendingComposerAttachment | null;
  isUploadingAttachment: boolean;
  isSocketReady: boolean;
  hasPeer: boolean;
  onSubmit: () => Promise<void>;
  onDraftBlur: () => void;
  onFileSelection: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveAttachment: () => void;
};

export const ChatComposer = ({
  draft,
  setDraft,
  pendingAttachment,
  isUploadingAttachment,
  isSocketReady,
  hasPeer,
  onSubmit,
  onDraftBlur,
  onFileSelection,
  onRemoveAttachment
}: ChatComposerProps) => {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useLayoutEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) {
      return;
    }

    textarea.style.height = '0px';
    const nextHeight = Math.min(textarea.scrollHeight, MAX_COMPOSER_HEIGHT);
    textarea.style.height = `${nextHeight}px`;
    textarea.style.overflowY = textarea.scrollHeight > MAX_COMPOSER_HEIGHT ? 'auto' : 'hidden';
  }, [draft]);

  return (
    <div className="px-2 pt-3 pb-3 border-t border-white/10">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void onSubmit();
        }}
        className="relative"
      >
        <div className="rounded-2xl bg-transparent">
          {pendingAttachment ? (
            <div className="border-b border-white/10 p-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  {pendingAttachment.mimeType.startsWith('image/') ? (
                    <img
                      src={pendingAttachment.localUrl}
                      alt={pendingAttachment.name}
                      className="max-h-32 w-full rounded-md object-cover"
                    />
                  ) : (
                    <div className="flex h-20 w-full items-center justify-center rounded-md border border-white/10 bg-black/20">
                      <FilePdf size={44} weight="fill" className="text-rose-400" aria-hidden="true" />
                    </div>
                  )}
                  <p className="mt-1 truncate text-xs text-zinc-300">{pendingAttachment.name}</p>
                </div>

                <button
                  type="button"
                  onClick={onRemoveAttachment}
                  className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded text-zinc-400 hover:text-zinc-200"
                  aria-label="Remove attachment"
                >
                  <X size={14} weight="bold" />
                </button>
              </div>
            </div>
          ) : null}

          <textarea
            ref={textareaRef}
            rows={1}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onBlur={onDraftBlur}
            placeholder="Type your message..."
            className="min-h-11 w-full resize-none bg-transparent py-3 pl-16 pr-12 text-sm leading-6 text-zinc-100 placeholder:text-zinc-500 focus:outline-none"
            style={{ maxHeight: `${MAX_COMPOSER_HEIGHT}px` }}
          />
        </div>

        <label
          htmlFor="chat-file-upload"
          className="absolute bottom-2 left-2 inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-zinc-300 transition-colors hover:text-white"
          aria-label="Upload file"
        >
          <input
            id="chat-file-upload"
            type="file"
            accept="image/*,.pdf,application/pdf"
            className="sr-only"
            onChange={(event) => void onFileSelection(event)}
            disabled={isUploadingAttachment}
          />
          <Paperclip size={18} weight="bold" />
        </label>

        <button
          type="submit"
          aria-label="Send message"
          disabled={(!draft.trim() && !pendingAttachment) || !isSocketReady || !hasPeer || isUploadingAttachment}
          className="absolute bottom-2 right-2 inline-flex h-8 w-8 items-center justify-center rounded-full text-zinc-300 transition-colors hover:text-white disabled:text-zinc-600"
        >
          <PaperPlaneTilt size={18} weight="fill" />
        </button>
      </form>
    </div>
  );
};
