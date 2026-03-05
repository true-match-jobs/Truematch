type BuildInitialAvatarUrlParams = {
  fullName?: string | null;
  email?: string | null;
  id?: string | null;
  fallback?: string;
  size?: number;
};

const VIVID_BACKGROUND_COLORS = [
  '1d4ed8',
  'dc2626',
  '059669',
  '7c3aed',
  'ea580c',
  'be123c',
  '0891b2',
  '4338ca'
] as const;

const BRAND_PRIMARY_HEX = '8b5cf6';

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
  const colorIndex = hashString(initial) % VIVID_BACKGROUND_COLORS.length;
  const backgroundColor = VIVID_BACKGROUND_COLORS[colorIndex];

  return `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(seedSource)}&chars=1&fontWeight=700&textColor=ffffff&backgroundType=solid&backgroundColor=${backgroundColor}&size=${size}`;
};

export const buildSystemAvatarUrl = (size = 40): string => {
  return `https://api.dicebear.com/9.x/bottts/svg?seed=${encodeURIComponent('truematch-system-robot-v4')}&backgroundType=solid&backgroundColor=${BRAND_PRIMARY_HEX}&size=${size}`;
};
