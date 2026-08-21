import { api } from "./axios";
import type { AdminStats, AdminVerificationRequest, AdminActivityEntry, FlaggedStartup, Paginated, Startup, User, Service, Contest, Payment, Job, Project, Withdrawal, Grievance, PlatformSettings, PhoneAuthProvider, Plan, AdminPermission, Subscription, Review, Campaign } from "@/types";

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
  // Jobs only — other resource types using this same filter shape simply
  // ignore it, since their backend list endpoints don't read it.
  hasReports?: boolean;
}

export interface AdminSubscriptionFilters {
  search?: string;
  status?: string;
  provider?: string;
  role?: string;
  tier?: string;
  billingCycle?: string;
  page?: number;
  limit?: number;
}

export interface AdminSubscriptionStats {
  totalSubscribers: number;
  activeCount: number;
  expiredCount: number;
  cancelledCount: number;
  failedCount: number;
  revenue: number;
}

export type AdminSubscriptionRow = Subscription & {
  user: { _id: string; name: string; email: string; avatar?: string };
  planName: string;
};

export interface AdminSecurityEventFilters {
  type?: string;
  email?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface AdminSecurityEvent {
  _id: string;
  type: string;
  user: { _id: string; name: string; email: string; role: string } | null;
  email: string;
  ip: string;
  userAgent: string;
  detail: string;
  createdAt: string;
}

export interface AdminReviewFilters {
  targetType?: string;
  rating?: number;
  page?: number;
  limit?: number;
}

export type AdminReviewRow = Review & {
  reviewer: { _id: string; name: string; email: string; avatar?: string };
  targetLabel: string | null;
};

export interface AdminReferralStats {
  referredUserCount: number;
  totalBonusPaid: number;
}

export interface AdminReferrerRow {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  referralCode: string;
  referralBonusBalance: number;
  referralBonusTotal: number;
  referredCount: number;
}

export interface AdminAnnouncement {
  _id: string;
  title: string;
  message: string;
  targetRole: string | null;
  sentBy: { _id: string; name: string; email: string } | null;
  recipientCount: number;
  createdAt: string;
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

  dismissJobReports: (jobId: string) => api.put<{ success: boolean; message: string }>(`/admin/jobs/${jobId}/dismiss-reports`).then((r) => r.data),

  projects: (filters: AdminModerationFilters = {}) => api.get<Paginated<Project>>("/admin/projects", { params: filters }).then((r) => r.data),

  toggleProjectStatus: (projectId: string) =>
    api.put<{ success: boolean; status: Project["status"] }>(`/admin/projects/${projectId}/toggle-status`).then((r) => r.data),

  removeProject: (projectId: string) => api.delete(`/admin/projects/${projectId}`).then((r) => r.data),

  payments: (
    filters: { search?: string; type?: string; status?: string; disputeStatus?: string; page?: number; limit?: number } = {}
  ) => api.get<Paginated<Payment>>("/admin/payments", { params: filters }).then((r) => r.data),

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

  staff: () => api.get<{ success: boolean; data: User[] }>("/admin/staff").then((r) => r.data.data),

  createStaff: (payload: { name: string; email: string; password: string; permissions: AdminPermission[] }) =>
    api.post<{ success: boolean; data: User }>("/admin/staff", payload).then((r) => r.data.data),

  updateStaffPermissions: (staffId: string, permissions: AdminPermission[]) =>
    api.put<{ success: boolean; data: User }>(`/admin/staff/${staffId}/permissions`, { permissions }).then((r) => r.data.data),

  activity: () => api.get<{ success: boolean; data: AdminActivityEntry[] }>("/admin/activity").then((r) => r.data.data),

  grievances: (filters: { status?: string; page?: number; limit?: number } = {}) =>
    api.get<Paginated<Grievance>>("/admin/grievances", { params: filters }).then((r) => r.data),

  updateGrievance: (grievanceId: string, action: "acknowledge" | "resolve", note?: string) =>
    api.put<{ success: boolean; data: Grievance }>(`/admin/grievances/${grievanceId}`, { action, note }).then((r) => r.data.data),

  kycRequests: (filters: { page?: number; limit?: number } = {}) =>
    api.get<Paginated<AdminKycRequest>>("/admin/kyc-requests", { params: filters }).then((r) => r.data),

  reviewKyc: (userId: string, action: "approve" | "reject", note?: string) =>
    api.put<{ success: boolean; data: User }>(`/admin/kyc-requests/${userId}/review`, { action, note }).then((r) => r.data.data),

  profileVerificationRequests: (type: ProfileVerificationType, filters: { page?: number; limit?: number } = {}) =>
    api
      .get<Paginated<AdminProfileVerificationRequest>>(`/admin/profile-verification-requests/${type}`, { params: filters })
      .then((r) => r.data),

  reviewProfileVerification: (type: ProfileVerificationType, userId: string, action: "approve" | "reject", note?: string) =>
    api
      .put<{ success: boolean; data: User }>(`/admin/profile-verification-requests/${type}/${userId}/review`, { action, note })
      .then((r) => r.data.data),

  // Every verification type (kyc/face/address/bank/role) only keeps a single
  // overwritable slot on the User document — a resubmission destroys the
  // previous selfie/documents and rejection reason. This PDF is the one place
  // the full history (every past attempt, approved or rejected, and why)
  // survives — pulled from a separate VerificationAttempt audit trail.
  downloadVerificationHistory: async (userId: string, userName: string) => {
    const res = await api.get(`/admin/users/${userId}/verification-history.pdf`, { responseType: "blob" });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement("a");
    link.href = url;
    link.download = `verification-history-${userName.replace(/\s+/g, "-").toLowerCase()}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  plans: () => api.get<{ success: boolean; data: Plan[] }>("/admin/plans").then((r) => r.data.data),

  updatePlan: (
    planId: string,
    payload: { name?: string; priceInInr?: number; priceInInrYearly?: number; features?: string[]; maxListings?: number }
  ) => api.put<{ success: boolean; data: Plan }>(`/admin/plans/${planId}`, payload).then((r) => r.data.data),

  subscriptions: (filters: AdminSubscriptionFilters = {}) =>
    api.get<Paginated<AdminSubscriptionRow>>("/admin/subscriptions", { params: filters }).then((r) => r.data),

  subscriptionStats: () =>
    api.get<{ success: boolean; data: AdminSubscriptionStats }>("/admin/subscriptions/stats").then((r) => r.data.data),

  securityEvents: (filters: AdminSecurityEventFilters = {}) =>
    api.get<Paginated<AdminSecurityEvent>>("/admin/security-events", { params: filters }).then((r) => r.data),

  reviews: (filters: AdminReviewFilters = {}) =>
    api.get<Paginated<AdminReviewRow>>("/admin/reviews", { params: filters }).then((r) => r.data),

  referralStats: () => api.get<{ success: boolean; data: AdminReferralStats }>("/admin/referrals/stats").then((r) => r.data.data),

  topReferrers: (filters: { page?: number; limit?: number } = {}) =>
    api.get<Paginated<AdminReferrerRow>>("/admin/referrals", { params: filters }).then((r) => r.data),

  campaigns: (filters: AdminModerationFilters = {}) =>
    api.get<Paginated<Campaign>>("/admin/campaigns", { params: filters }).then((r) => r.data),

  toggleCampaignStatus: (campaignId: string) =>
    api.put<{ success: boolean; status: Campaign["status"] }>(`/admin/campaigns/${campaignId}/toggle-status`).then((r) => r.data),

  removeCampaign: (campaignId: string) => api.delete(`/admin/campaigns/${campaignId}`).then((r) => r.data),

  // Reuses the existing public (super_admin-gated) toggle a brand can't
  // reach themselves — see campaign.routes.js's PUT /campaigns/:id/feature.
  toggleCampaignFeatured: (campaignId: string) =>
    api.put<{ success: boolean; data: Campaign }>(`/campaigns/${campaignId}/feature`).then((r) => r.data.data),

  sendAnnouncement: (payload: { title: string; message: string; targetRole?: string }) =>
    api.post<{ success: boolean; data: AdminAnnouncement }>("/admin/announcements", payload).then((r) => r.data.data),

  announcements: (filters: { page?: number; limit?: number } = {}) =>
    api.get<Paginated<AdminAnnouncement>>("/admin/announcements", { params: filters }).then((r) => r.data),

  getSettings: () => api.get<{ success: boolean; data: PlatformSettings }>("/admin/settings").then((r) => r.data.data),

  updateSettings: (
    commissionPercent: number,
    phoneAuthProvider?: PhoneAuthProvider,
    allowedEmailDomains?: string[],
    jobsEnabled?: boolean,
    disabledRoles?: string[]
  ) =>
    api
      .put<{ success: boolean; data: PlatformSettings }>("/admin/settings", {
        commissionPercent,
        phoneAuthProvider,
        allowedEmailDomains,
        jobsEnabled,
        disabledRoles,
      })
      .then((r) => r.data.data),

  // Role verification lives under /roles (see backend/src/routes/roleRoutes.js),
  // not /admin — kept here anyway so every admin-only call reads from one file.
  roleVerificationRequests: (filters: { page?: number; limit?: number } = {}) =>
    api.get<Paginated<AdminRoleVerificationRequest>>("/roles/verification-requests", { params: filters }).then((r) => r.data),

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
