import { create } from 'zustand';
import { authService } from '../services/auth.service';
import type { UserWithApplication } from '../types/user';

export type DashboardState = {
  profile: UserWithApplication | null;
  isLoading: boolean;
  isRefreshing: boolean;
  errorMessage: string | null;
  loadDashboardData: (force?: boolean, showLoading?: boolean) => Promise<void>;
  clearDashboardData: () => void;
};

export const useDashboardStore = create<DashboardState>((set, get) => ({
  profile: null,
  isLoading: false,
  isRefreshing: false,
  errorMessage: null,

  loadDashboardData: async (force = false, showLoading = true) => {
    const { profile, isLoading, isRefreshing } = get();

    if (!force && profile) {
      return;
    }

    if (isLoading || isRefreshing) {
      return;
    }

    try {
      set({ isLoading: showLoading, isRefreshing: true, errorMessage: null });
      const result = await authService.getMeAllData();
      set({ profile: result, isLoading: false, isRefreshing: false, errorMessage: null });
    } catch (_error) {
      set({ isLoading: false, isRefreshing: false, errorMessage: 'Unable to load dashboard data right now.' });
    }
  },

  clearDashboardData: () => {
    set({ profile: null, isLoading: false, isRefreshing: false, errorMessage: null });
  }
}));
