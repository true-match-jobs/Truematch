import { ArrowLeft } from '@phosphor-icons/react';

type ChatHeaderProps = {
  isLoading?: boolean;
  avatarUrl?: string;
  avatarAlt?: string;
  title: string;
  isOnline?: boolean;
  showIdentityText?: boolean;
  avatarAlign?: 'left' | 'right';
  onAvatarClick?: () => void;
  showAvatarBorder?: boolean;
  showBackButton?: boolean;
  onBackButtonClick?: () => void;
};

export const ChatHeader = ({
  isLoading = false,
  avatarUrl,
  avatarAlt = 'Chat avatar',
  title,
  isOnline = false,
  showIdentityText = true,
  avatarAlign = 'left',
  onAvatarClick,
  showAvatarBorder = true,
  showBackButton = false,
  onBackButtonClick
}: ChatHeaderProps) => {
  const isAvatarAlignedRight = avatarAlign === 'right';
  const avatarClassName = `h-9 w-9 rounded-full bg-dark-surface ${showAvatarBorder ? 'border-2 border-white/70' : ''}`;

  const avatarNode = avatarUrl ? (
    <img src={avatarUrl} alt={avatarAlt} className={avatarClassName} />
  ) : (
    <div className={avatarClassName} aria-hidden />
  );

  return (
    <header className="relative z-10 border-b border-white/10 bg-dark-bg">
      <div className="px-3 py-2">
        {isLoading ? (
          <div className={`flex items-center gap-3 ${isAvatarAlignedRight ? 'justify-end' : ''}`} aria-hidden>
            {showBackButton ? <div className="h-5 w-5 animate-pulse rounded-full bg-white/10" /> : null}
            <div className={`relative h-9 w-9 ${showBackButton ? 'ml-2' : ''}`}>
              <div className="h-9 w-9 animate-pulse rounded-full bg-white/10" />
              <div className="absolute bottom-0 right-0 h-2.5 w-2.5 animate-pulse rounded-full border border-dark-bg bg-white/10" />
            </div>
            {showIdentityText ? (
              <div className="min-w-0 flex-1">
                <div className="h-5 w-40 max-w-full animate-pulse rounded bg-white/10" />
              </div>
            ) : null}
          </div>
        ) : (
          <div className={`flex items-center gap-3 ${isAvatarAlignedRight ? 'justify-end' : ''}`}>
            {showBackButton ? (
              <button
                type="button"
                onClick={onBackButtonClick}
                className="rounded-full text-zinc-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 flex items-center justify-center p-0 m-0 border-0"
                style={{ padding: 0, lineHeight: 0 }}
                aria-label="Back to conversations"
              >
                <ArrowLeft size={18} weight="bold" />
              </button>
            ) : null}
            {onAvatarClick ? (
              <button
                type="button"
                onClick={onAvatarClick}
                className={`relative rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${showBackButton ? 'ml-2' : ''}`}
                aria-label="Open profile"
              >
                {avatarNode}
                <span
                  className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border border-dark-bg ${
                    isOnline ? 'bg-emerald-400' : 'bg-zinc-500'
                  }`}
                  aria-hidden
                />
              </button>
            ) : (
              <div className={`relative ${showBackButton ? 'ml-2' : ''}`}>
                {avatarNode}
                <span
                  className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border border-dark-bg ${
                    isOnline ? 'bg-emerald-400' : 'bg-zinc-500'
                  }`}
                  aria-hidden
                />
              </div>
            )}
            {showIdentityText ? (
              <div className="min-w-0 flex-1">
                <h2 className="truncate text-base font-semibold text-zinc-100">{title}</h2>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </header>
  );
};