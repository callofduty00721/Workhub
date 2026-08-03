import { api } from "./axios";
import type { AdminStats, AdminVerificationRequest, FlaggedStartup, Paginated, Startup, User, Service, Contest, Payment, Job, Project, Withdrawal, PlatformSettings, PhoneAuthProvider, Plan } from "@/types";

export type AdminUserStatus = "active" | "banned" | "deactivated";

export interface AdminUserFilters {
  search?: string;
  role?: string;
  status?: AdminUserStatus;
  page?: number;
  limit?: number;
}

export interface AdminStartupFilters {
  search?: string;
  page?: number;
  limit?: number;
}

export interface AdminModerationFilters {
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export const adminApi = {
  stats: () => api.get<{ success: boolean; data: AdminStats }>("/admin/stats").then((r) => r.data.data),

  users: (filters: AdminUserFilters = {}) => api.get<Paginated<User>>("/admin/users", { params: filters }).then((r) => r.data),

  toggleBan: (userId: string) =>
    api.put<{ success: boolean; isBanned: boolean }>(`/admin/users/${userId}/ban`).then((r) => r.data),

  deleteUser: (userId: string) =>
    api.put<{ success: boolean; message: string }>(`/admin/users/${userId}/delete`).then((r) => r.data),

  reactivateUser: (userId: string) =>
    api.put<{ success: boolean; isDeactivated: boolean }>(`/admin/users/${userId}/reactivate`).then((r) => r.data),

  updateRole: (userId: string, role: string) =>
    api.put<{ success: boolean; data: User }>(`/admin/users/${userId}/role`, { role }).then((r) => r.data.data),

  flaggedStartups: () => api.get<{ success: boolean; data: FlaggedStartup[] }>("/admin/flagged-startups").then((r) => r.data.data),

  resolveFlaggedStartup: (startupId: string, action: "dismiss" | "suspend") =>
    api
      .put<{ success: boolean; data: { startupId: string; isSuspended: boolean } }>(`/admin/flagged-startups/${startupId}/resolve`, { action })
      .then((r) => r.data.data),

  startups: (filters: AdminStartupFilters = {}) => api.get<Paginated<Startup>>("/admin/startups", { params: filters }).then((r) => r.data),

  toggleFounderVerified: (startupId: string) =>
    api.put<{ success: boolean; founderVerified: boolean }>(`/admin/startups/${startupId}/verify-founder`).then((r) => r.data),

  toggleBusinessVerified: (startupId: string) =>
    api.put<{ success: boolean; isVerified: boolean }>(`/admin/startups/${startupId}/verify-business`).then((r) => r.data),

  verificationRequests: () =>
    api.get<{ success: boolean; data: AdminVerificationRequest[] }>("/admin/verification-requests").then((r) => r.data.data),

  reviewVerificationRequest: (startupId: string, requestId: string, action: "approve" | "reject", reviewNote?: string) =>
    api
      .put<{ success: boolean; data: unknown }>(`/admin/verification-requests/${startupId}/${requestId}`, { action, reviewNote })
      .then((r) => r.data),

  services: (filters: AdminModerationFilters = {}) => api.get<Paginated<Service>>("/admin/services", { params: filters }).then((r) => r.data),

  toggleServiceStatus: (serviceId: string) =>
    api.put<{ success: boolean; status: Service["status"] }>(`/admin/services/${serviceId}/toggle-status`).then((r) => r.data),

  removeService: (serviceId: string) => api.delete(`/admin/services/${serviceId}`).then((r) => r.data),

  contests: (filters: AdminModerationFilters = {}) => api.get<Paginated<Contest>>("/admin/contests", { params: filters }).then((r) => r.data),

  closeContest: (contestId: string) =>
    api.put<{ success: boolean; status: Contest["status"] }>(`/admin/contests/${contestId}/close`).then((r) => r.data),

  removeContest: (contestId: string) => api.delete(`/admin/contests/${contestId}`).then((r) => r.data),

  jobs: (filters: AdminModerationFilters = {}) => api.get<Paginated<Job>>("/admin/jobs", { params: filters }).then((r) => r.data),

  toggleJobStatus: (jobId: string) => api.put<{ success: boolean; status: Job["status"] }>(`/admin/jobs/${jobId}/toggle-status`).then((r) => r.data),

  removeJob: (jobId: string) => api.delete(`/admin/jobs/${jobId}`).then((r) => r.data),

  projects: (filters: AdminModerationFilters = {}) => api.get<Paginated<Project>>("/admin/projects", { params: filters }).then((r) => r.data),

  toggleProjectStatus: (projectId: string) =>
    api.put<{ success: boolean; status: Project["status"] }>(`/admin/projects/${projectId}/toggle-status`).then((r) => r.data),

  removeProject: (projectId: string) => api.delete(`/admin/projects/${projectId}`).then((r) => r.data),

  payments: (filters: { disputeStatus?: string; page?: number; limit?: number } = {}) =>
    api.get<Paginated<Payment>>("/admin/payments", { params: filters }).then((r) => r.data),

  resolveDispute: (paymentId: string, action: "refund" | "reject", note?: string, refundAmount?: number) =>
    api
      .put<{ success: boolean; data: Payment }>(`/admin/payments/${paymentId}/resolve-dispute`, { action, note, refundAmount })
      .then((r) => r.data.data),

  withdrawals: (filters: { status?: string; page?: number; limit?: number } = {}) =>
    api.get<Paginated<Withdrawal>>("/admin/withdrawals", { params: filters }).then((r) => r.data),

  resolveWithdrawal: (withdrawalId: string, action: "complete" | "reject", note?: string) =>
    api
      .put<{ success: boolean; data: Withdrawal }>(`/admin/withdrawals/${withdrawalId}/resolve`, { action, note })
      .then((r) => r.data.data),

  kycRequests: () =>
    api
      .get<{ success: boolean; data: AdminKycRequest[] }>("/admin/kyc-requests")
      .then((r) => r.data.data),

  reviewKyc: (userId: string, action: "approve" | "reject", note?: string) =>
    api.put<{ success: boolean; data: User }>(`/admin/kyc-requests/${userId}/review`, { action, note }).then((r) => r.data.data),

  profileVerificationRequests: (type: ProfileVerificationType) =>
    api
      .get<{ success: boolean; data: AdminProfileVerificationRequest[] }>(`/admin/profile-verification-requests/${type}`)
      .then((r) => r.data.data),

  reviewProfileVerification: (type: ProfileVerificationType, userId: string, action: "approve" | "reject", note?: string) =>
    api
      .put<{ success: boolean; data: User }>(`/admin/profile-verification-requests/${type}/${userId}/review`, { action, note })
      .then((r) => r.data.data),

  plans: () => api.get<{ success: boolean; data: Plan[] }>("/admin/plans").then((r) => r.data.data),

  updatePlan: (planId: string, payload: { name?: string; priceInInr?: number; features?: string[]; maxListings?: number }) =>
    api.put<{ success: boolean; data: Plan }>(`/admin/plans/${planId}`, payload).then((r) => r.data.data),

  getSettings: () => api.get<{ success: boolean; data: PlatformSettings }>("/admin/settings").then((r) => r.data.data),

  updateSettings: (commissionPercent: number, phoneAuthProvider?: PhoneAuthProvider) =>
    api
      .put<{ success: boolean; data: PlatformSettings }>("/admin/settings", { commissionPercent, phoneAuthProvider })
      .then((r) => r.data.data),

  // Role verification lives under /roles (see backend/src/routes/roleRoutes.js),
  // not /admin — kept here anyway so every admin-only call reads from one file.
  roleVerificationRequests: () =>
    api.get<{ success: boolean; data: AdminRoleVerificationRequest[] }>("/roles/verification-requests").then((r) => r.data.data),

  reviewRoleVerification: (userId: string, action: "approve" | "reject", note?: string) =>
    api
      .put<{ success: boolean; data: unknown }>(`/roles/verification-requests/${userId}/review`, { approve: action === "approve", note })
      .then((r) => r.data),
};

export interface AdminKycRequest {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  kycDocuments: { url: string; name: string }[];
  kycSubmittedAt: string;
}

export type ProfileVerificationType = "face" | "address" | "bank";

// One shape covers all three types — only the relevant selfie/documents field
// is populated per type (the backend selects just that field).
export interface AdminProfileVerificationRequest {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  faceVerificationSelfie?: string;
  faceVerificationSubmittedAt?: string;
  addressVerificationDocuments?: { url: string; name: string }[];
  addressVerificationSubmittedAt?: string;
  bankVerificationDocuments?: { url: string; name: string }[];
  bankVerificationSubmittedAt?: string;
}

export interface AdminRoleVerificationRequest {
  _id: string;
  name: string;
  email: string;
  role: string;
  roles: string[];
  selectedCategory: string | null;
  verificationDocuments: { url: string; name: string }[];
  verificationSubmittedAt: string;
}
