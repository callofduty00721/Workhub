import { api } from "./axios";
import type { AdminStats, AdminVerificationRequest, FlaggedStartup, Paginated, Startup, User, Service, Contest, Payment, Job } from "@/types";

export interface AdminUserFilters {
  search?: string;
  role?: string;
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

  payments: (filters: { disputeStatus?: string; page?: number; limit?: number } = {}) =>
    api.get<Paginated<Payment>>("/admin/payments", { params: filters }).then((r) => r.data),

  resolveDispute: (paymentId: string, action: "refund" | "reject", note?: string, refundAmount?: number) =>
    api
      .put<{ success: boolean; data: Payment }>(`/admin/payments/${paymentId}/resolve-dispute`, { action, note, refundAmount })
      .then((r) => r.data.data),
};
