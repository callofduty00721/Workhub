import { api } from "./axios";
import type { User, Job, Project, Service } from "@/types";

export const userApi = {
  updateMe: (payload: Partial<User>) => api.put<{ success: boolean; user: User }>("/users/me", payload).then((r) => r.data.user),

  submitKyc: (documents: { url: string; name: string }[]) =>
    api.post<{ success: boolean; user: User }>("/users/me/kyc", { documents }).then((r) => r.data.user),

  toggleSavedJob: (jobId: string) =>
    api.put<{ success: boolean; data: { saved: boolean } }>(`/users/me/saved-jobs/${jobId}`).then((r) => r.data.data),

  toggleSavedProject: (projectId: string) =>
    api.put<{ success: boolean; data: { saved: boolean } }>(`/users/me/saved-projects/${projectId}`).then((r) => r.data.data),

  toggleSavedService: (serviceId: string) =>
    api.put<{ success: boolean; data: { saved: boolean } }>(`/users/me/saved-services/${serviceId}`).then((r) => r.data.data),

  getSavedItems: () =>
    api.get<{ success: boolean; data: { jobs: Job[]; projects: Project[]; services: Service[] } }>("/users/me/saved").then((r) => r.data.data),

  getMyReferrals: () =>
    api.get<{ success: boolean; data: ReferralsResponse }>("/users/me/referrals").then((r) => r.data.data),

  updateNotificationPreferences: (emailNotificationsEnabled: boolean) =>
    api
      .put<{ success: boolean; emailNotificationsEnabled: boolean }>("/users/me/notification-preferences", { emailNotificationsEnabled })
      .then((r) => r.data),
};

export interface ReferredUser {
  _id: string;
  name: string;
  avatar?: string;
  role: string;
  joinedAt: string;
  bonusCredited: boolean;
}

export interface ReferralsResponse {
  referralCode: string;
  referralBonusBalance: number;
  referralBonusTotal: number;
  referredUsers: ReferredUser[];
}
