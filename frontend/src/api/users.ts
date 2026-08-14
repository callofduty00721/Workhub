import { api } from "./axios";
import type { User, Job, Project, Service, FreelancerSummary, InfluencerSummary, Contest, Campaign } from "@/types";

export const userApi = {
  updateMe: (payload: Partial<User>) => api.put<{ success: boolean; user: User }>("/users/me", payload).then((r) => r.data.user),

  submitKyc: (documents: { url: string; name: string }[]) =>
    api.post<{ success: boolean; user: User }>("/users/me/kyc", { documents }).then((r) => r.data.user),

  verifyPhoneFirebaseToken: (idToken: string) =>
    api.post<{ success: boolean; user: User }>("/users/me/phone-otp/verify-firebase", { idToken }).then((r) => r.data.user),

  submitFaceVerification: (selfieUrl: string) =>
    api.post<{ success: boolean; user: User }>("/users/me/face-verification", { selfieUrl }).then((r) => r.data.user),

  submitAddressVerification: (documents: { url: string; name: string }[]) =>
    api.post<{ success: boolean; user: User }>("/users/me/address-verification", { documents }).then((r) => r.data.user),

  submitBankVerification: (documents: { url: string; name: string }[]) =>
    api.post<{ success: boolean; user: User }>("/users/me/bank-verification", { documents }).then((r) => r.data.user),

  toggleSavedJob: (jobId: string) =>
    api.put<{ success: boolean; data: { saved: boolean } }>(`/users/me/saved-jobs/${jobId}`).then((r) => r.data.data),

  toggleSavedProject: (projectId: string) =>
    api.put<{ success: boolean; data: { saved: boolean } }>(`/users/me/saved-projects/${projectId}`).then((r) => r.data.data),

  toggleSavedService: (serviceId: string) =>
    api.put<{ success: boolean; data: { saved: boolean } }>(`/users/me/saved-services/${serviceId}`).then((r) => r.data.data),

  toggleSavedFreelancer: (freelancerId: string) =>
    api.put<{ success: boolean; data: { saved: boolean } }>(`/users/me/saved-freelancers/${freelancerId}`).then((r) => r.data.data),

  toggleSavedContest: (contestId: string) =>
    api.put<{ success: boolean; data: { saved: boolean } }>(`/users/me/saved-contests/${contestId}`).then((r) => r.data.data),

  toggleSavedInfluencer: (influencerId: string) =>
    api.put<{ success: boolean; data: { saved: boolean } }>(`/users/me/saved-influencers/${influencerId}`).then((r) => r.data.data),

  toggleSavedCampaign: (campaignId: string) =>
    api.put<{ success: boolean; data: { saved: boolean } }>(`/users/me/saved-campaigns/${campaignId}`).then((r) => r.data.data),

  getSavedItems: () =>
    api
      .get<{
        success: boolean;
        data: {
          jobs: Job[];
          projects: Project[];
          services: Service[];
          freelancers: FreelancerSummary[];
          contests: Contest[];
          influencers: InfluencerSummary[];
          campaigns: Campaign[];
        };
      }>("/users/me/saved")
      .then((r) => r.data.data),

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
