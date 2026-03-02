type BuildInitialAvatarUrlParams = {
  fullName?: string | null;
  email?: string | null;
  id?: string | null;
  fallback?: string;
  size?: number;
};

const SOFT_BACKGROUND_COLORS = [
  'dbeafe',
  'c7d2fe',
  'e9d5ff',
  'fbcfe8',
  'fde68a',
  'bbf7d0',
  'bae6fd'
] as const;

const toInitial = (value: string): string => {
  const trimmed = value.trim();

  if (!trimmed.length) {
    return 'U';
  }

  return trimmed.charAt(0).toUpperCase();
};

const hashString = (value: string): number => {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }

  return hash;
};

export const buildInitialAvatarUrl = ({
  fullName,
  email,
  id,
  fallback = 'User',
  size = 36
}: BuildInitialAvatarUrlParams): string => {
  const seedSource = fullName?.trim() || email?.trim() || id?.trim() || fallback;
  const initial = toInitial(seedSource);
  const colorSeed = id?.trim() || fullName?.trim() || email?.trim() || fallback;
  const colorIndex = hashString(colorSeed) % SOFT_BACKGROUND_COLORS.length;
  const backgroundColor = SOFT_BACKGROUND_COLORS[colorIndex];

  return `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(initial)}&chars=1&fontWeight=700&textColor=334155&backgroundType=solid&backgroundColor=${backgroundColor}&size=${size}`;
};
