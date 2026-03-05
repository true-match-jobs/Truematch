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

export type UpdateProfilePayload = Partial<{
  fullName: string;
  gender: string;
  dateOfBirth: string;
  countryCode: string;
  nationality: string;
  countryOfResidence: string;
  residentialAddress: string;
  stateOrProvince: string;
  passportNumber: string;
  passportExpiryDate: string;
  phoneNumber: string;
}>;

type AuthResponse = {
  message: string;
  user: User;
};

type UpdateProfileResponse = {
  message: string;
  user: UserWithApplication;
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
  },

  async markMeDashboardVisited(): Promise<UserWithApplication> {
    const response = await api.patch<{ user: UserWithApplication }>('/users/me/dashboard-visited');
    return response.data.user;
  },

  async updateMeProfile(payload: UpdateProfilePayload): Promise<UserWithApplication> {
    const response = await api.patch<UpdateProfileResponse>('/users/me/profile', payload);
    return response.data.user;
  },

  async updateMeEmail(email: string): Promise<UserWithApplication> {
    const response = await api.patch<UpdateProfileResponse>('/users/me/email', { email });
    return response.data.user;
  },

  async updateMePassword(password: string): Promise<UserWithApplication> {
    const response = await api.patch<UpdateProfileResponse>('/users/me/password', { password });
    return response.data.user;
  },

  async updateMeAvatar(file: File): Promise<UserWithApplication> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.patch<UpdateProfileResponse>('/users/me/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    return response.data.user;
  },

  async verifyEmail(token: string): Promise<string> {
    const response = await api.get<{ message: string }>('/auth/email-verification/verify', {
      params: { token }
    });

    return response.data.message;
  },

  async resendEmailVerification(): Promise<string> {
    const response = await api.post<{ message: string }>('/auth/email-verification/resend');
    return response.data.message;
  }
};
