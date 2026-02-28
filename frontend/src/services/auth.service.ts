import type { User, UserWithApplication } from '../types/user';
import { api } from './api';

export type RegisterPayload = {
  fullName: string;
  email: string;
  password: string;
};

export type LoginPayload = {
  email: string;
  password: string;
};

type AuthResponse = {
  message: string;
  user: User;
};

export const authService = {
  async register(payload: RegisterPayload): Promise<User> {
    const response = await api.post<AuthResponse>('/auth/register', payload);
    return response.data.user;
  },

  async login(payload: LoginPayload): Promise<User> {
    const response = await api.post<AuthResponse>('/auth/login', payload);
    return response.data.user;
  },

  async logout(): Promise<void> {
    await api.post('/auth/logout');
  },

  async getMe(): Promise<User> {
    const response = await api.get<{ user: User }>('/users/me');
    return response.data.user;
  },

  async getMeAllData(): Promise<UserWithApplication> {
    const response = await api.get<{ user: UserWithApplication }>('/users/me/all');
    return response.data.user;
  }
};
