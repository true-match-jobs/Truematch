import { create } from 'zustand';
import { authService } from '../services/auth.service';
import type { UserWithApplication } from '../types/user';

const DASHBOARD_CACHE_KEY = 'truematch.dashboard.profile';
const DASHBOARD_CACHE_TTL_MS = 60_000;

type DashboardCachePayload = {
  profile: UserWithApplication;
  cachedAt: number;
};

const readDashboardCache = (): DashboardCachePayload | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const rawValue = window.sessionStorage.getItem(DASHBOARD_CACHE_KEY);

    if (!rawValue) {
      return null;
    }

    const parsed = JSON.parse(rawValue) as Partial<DashboardCachePayload>;

    if (!parsed || typeof parsed.cachedAt !== 'number' || !parsed.profile) {
      return null;
    }

    return {
      profile: parsed.profile as UserWithApplication,
      cachedAt: parsed.cachedAt
    };
  } catch {
    return null;
  }
};

const writeDashboardCache = (profile: UserWithApplication, cachedAt: number): void => {
  if (typeof window === 'undefined') {
    return;
  }

  const payload: DashboardCachePayload = {
    profile,
    cachedAt
  };

  window.sessionStorage.setItem(DASHBOARD_CACHE_KEY, JSON.stringify(payload));
};

const clearDashboardCache = (): void => {
  if (typeof window === 'undefined') {
    return;
  }

  window.sessionStorage.removeItem(DASHBOARD_CACHE_KEY);
};

const initialCache = readDashboardCache();

export type DashboardState = {
  profile: UserWithApplication | null;
  isLoading: boolean;
  isRefreshing: boolean;
  errorMessage: string | null;
  lastLoadedAt: number | null;
  loadDashboardData: (force?: boolean, showLoading?: boolean) => Promise<void>;
  clearDashboardData: () => void;
};

export const useDashboardStore = create<DashboardState>((set, get) => ({
  profile: initialCache?.profile ?? null,
  isLoading: false,
  isRefreshing: false,
  errorMessage: null,
  lastLoadedAt: initialCache?.cachedAt ?? null,

  loadDashboardData: async (force = false, showLoading = true) => {
    const { profile, isLoading, isRefreshing, lastLoadedAt } = get();

    const now = Date.now();
    const hasFreshProfile = Boolean(
      profile &&
        lastLoadedAt &&
        now - lastLoadedAt < DASHBOARD_CACHE_TTL_MS
    );

    if (!force && hasFreshProfile) {
      return;
    }

    if (isLoading || isRefreshing) {
      return;
    }

    try {
      set({ isLoading: showLoading && !profile, isRefreshing: true, errorMessage: null });
      const result = await authService.getMeAllData();
      const loadedAt = Date.now();
      writeDashboardCache(result, loadedAt);
      set({ profile: result, isLoading: false, isRefreshing: false, errorMessage: null, lastLoadedAt: loadedAt });
    } catch (_error) {
      const hasCachedProfile = Boolean(profile);
      set({
        isLoading: false,
        isRefreshing: false,
        errorMessage: hasCachedProfile ? null : 'Unable to load dashboard data right now.'
      });
    }
  },

  clearDashboardData: () => {
    clearDashboardCache();
    set({ profile: null, isLoading: false, isRefreshing: false, errorMessage: null, lastLoadedAt: null });
  }
}));
