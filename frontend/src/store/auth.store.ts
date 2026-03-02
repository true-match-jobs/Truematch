import { create } from 'zustand';
import { authService, type LoginPayload, type RegisterPayload } from '../services/auth.service';
import { useDashboardStore } from './dashboard.store';
import type { User } from '../types/user';

export type AuthState = {
  user: User | null;
  isAuthenticated: boolean;
  isBootstrapping: boolean;
  setSessionUser: (user: User) => void;
  clearSession: () => void;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  bootstrapSession: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isBootstrapping: true,

  setSessionUser: (user) => {
    set({ user, isAuthenticated: true, isBootstrapping: false });
  },

  clearSession: () => {
    useDashboardStore.getState().clearDashboardData();
    set({ user: null, isAuthenticated: false, isBootstrapping: false });
  },

  login: async (payload) => {
    const user = await authService.login(payload);
    set({ user, isAuthenticated: true });
  },

  register: async (payload) => {
    const user = await authService.register(payload);
    set({ user, isAuthenticated: true });
  },

  logout: async () => {
    await authService.logout();
    useDashboardStore.getState().clearDashboardData();
    set({ user: null, isAuthenticated: false });
  },

  bootstrapSession: async () => {
    try {
      const user = await authService.getMe();
      set({ user, isAuthenticated: true, isBootstrapping: false });
    } catch (_error) {
      set({ user: null, isAuthenticated: false, isBootstrapping: false });
    }
  }
}));
