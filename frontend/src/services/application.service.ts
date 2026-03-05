import type { Application, ApplicationDocumentType, User } from '../types/user';
import type { ApplicationStatus } from '../../../shared/applicationStatus';
import { api } from './api';

export type AdminApplicationListItem = {
  id: string;
  applicationType: 'study_scholarship' | 'work_employment';
  hasAdminViewed: boolean;
  universityName: string | null;
  courseName: string | null;
  skillOrProfession: string | null;
  workCountry: string | null;
  intake: string | null;
  createdAt: string;
  user: {
    id: string;
    fullName: string;
    email: string;
  };
};

export type AdminApplicationDetails = {
  id: string;
  applicationType: string;
  applicationStatus: ApplicationStatus | null;
  countryOfResidence: string;
  workCountry: string | null;
  internationalPassportUrl: string | null;
  user: {
    id: string;
    fullName: string;
    email: string;
  };
};

export type SubmitApplicationPayload = {
  fullName: string;
  applicationType: 'study_scholarship' | 'work_employment';
  dateOfBirth: string;
  gender: string;
  countryCode: string;
  phoneNumber: string;
  nationality: string;
  countryOfResidence: string;
  stateOrProvince: string;
  residentialAddress: string;
  passportNumber: string;
  passportExpiryDate: string;
  skillOrProfession?: string;
  workCountry?: string;
  universityName?: string;
  universityCountry?: string;
  courseName?: string;
  degreeType?: string;
  studyMode?: string;
  intake?: string;
  email: string;
  password: string;
};

export type ReapplyApplicationPayload = {
  applicationType: 'study_scholarship' | 'work_employment';
  skillOrProfession?: string;
  workCountry?: string;
  universityName?: string;
  universityCountry?: string;
  courseName?: string;
  degreeType?: string;
  studyMode?: string;
  intake?: string;
};

type SubmitApplicationResponse = {
  message: string;
  user: User;
  application: {
    id: string;
    userId: string;
    applicationStatus: ApplicationStatus;
    createdAt: string;
    updatedAt: string;
  };
};

type UploadApplicationDocumentResponse = {
  message: string;
  application: Application;
};

type ApplicationTrackerResponse = {
  id: string;
  universityName: string | null;
  universityCountry: string | null;
  applicationStatus: ApplicationStatus;
};

type AdminApplicationsResponse = {
  applications: AdminApplicationListItem[];
};

type AdminApplicationDetailsResponse = {
  application: AdminApplicationDetails;
};

type UpdateAdminApplicationStatusResponse = {
  id: string;
  applicationStatus: ApplicationStatus;
};

export const applicationService = {
  async submit(payload: SubmitApplicationPayload): Promise<User> {
    const response = await api.post<SubmitApplicationResponse>('/applications', payload);
    return response.data.user;
  },

  async reapply(payload: ReapplyApplicationPayload): Promise<Application> {
    const response = await api.post<UploadApplicationDocumentResponse>('/applications/reapply', payload);
    return response.data.application;
  },

  async uploadDocument(applicationId: string, documentType: ApplicationDocumentType, file: File): Promise<Application> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.patch<UploadApplicationDocumentResponse>(
      `/applications/${applicationId}/documents/${documentType}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
    );

    return response.data.application;
  },

  async getTrackerStatus(applicationId: string): Promise<ApplicationTrackerResponse> {
    const response = await api.get<ApplicationTrackerResponse>(`/applications/track/${applicationId}`);
    return response.data;
  },

  async markTrackerViewed(applicationId: string): Promise<void> {
    await api.patch(`/applications/${applicationId}/tracker-viewed`);
  },

  async deleteById(applicationId: string): Promise<void> {
    await api.delete(`/applications/${applicationId}`);
  },

  async getAllForAdmin(): Promise<AdminApplicationListItem[]> {
    const response = await api.get<AdminApplicationsResponse>('/admin/applications');
    return response.data.applications;
  },

  async getByIdForAdmin(applicationId: string): Promise<AdminApplicationDetails> {
    const response = await api.get<AdminApplicationDetailsResponse>(`/admin/applications/${applicationId}`);
    return response.data.application;
  },

  async updateStatusForAdmin(applicationId: string, applicationStatus: ApplicationStatus): Promise<ApplicationStatus> {
    const response = await api.patch<UpdateAdminApplicationStatusResponse>(`/admin/applications/${applicationId}/status`, {
      applicationStatus
    });

    return response.data.applicationStatus;
  },

  async deleteByIdForAdmin(applicationId: string): Promise<void> {
    await api.delete(`/admin/applications/${applicationId}`);
  }
};
