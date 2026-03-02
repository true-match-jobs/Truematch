import { api } from './api';

export type AdminUserListItem = {
  id: string;
  fullName: string;
  email: string;
  emailVerifiedAt: string | null;
  hasVisitedDashboard: boolean;
  createdAt: string;
  applicationsCount: number;
};

type AdminUsersResponse = {
  users: AdminUserListItem[];
};

export const adminUserService = {
  async getAll(): Promise<AdminUserListItem[]> {
    const response = await api.get<AdminUsersResponse>('/admin/users');
    return response.data.users;
  },

  async deleteById(userId: string): Promise<void> {
    await api.delete(`/admin/users/${userId}`);
  }
};
