import { api } from "./axios";
import type { Application, ApplicationStatus, Job, JobAccessLogEntry, JobCategory, Paginated } from "@/types";

export interface JobFilters {
  search?: string;
  type?: string;
  category?: string;
  isRemote?: boolean;
  page?: number;
  limit?: number;
}

export interface JobCategoryCount {
  category: JobCategory;
  count: number;
}

export interface JobAnalytics {
  totalViews: number;
  totalApplications: number;
  byStatus: Partial<Record<ApplicationStatus, number>>;
  jobs: Pick<Job, "_id" | "title" | "viewsCount" | "applicationsCount" | "status">[];
}

export const jobApi = {
  list: (filters: JobFilters = {}) => api.get<Paginated<Job>>("/jobs", { params: filters }).then((r) => r.data),

  categoryCounts: () => api.get<{ success: boolean; data: JobCategoryCount[] }>("/jobs/category-counts").then((r) => r.data.data),

  mine: () => api.get<{ success: boolean; data: Job[] }>("/jobs/mine").then((r) => r.data.data),

  getById: (id: string) => api.get<{ success: boolean; data: Job }>(`/jobs/${id}`).then((r) => r.data.data),

  create: (payload: Partial<Job>) => api.post<{ success: boolean; data: Job }>("/jobs", payload).then((r) => r.data.data),

  update: (id: string, payload: Partial<Job>) => api.put<{ success: boolean; data: Job }>(`/jobs/${id}`, payload).then((r) => r.data.data),

  remove: (id: string) => api.delete(`/jobs/${id}`).then((r) => r.data),

  apply: (id: string, payload: { coverLetter?: string; resumeUrl?: string; proposedRate?: number; deliveryDays?: number }) =>
    api.post<{ success: boolean; data: Application }>(`/jobs/${id}/apply`, payload).then((r) => r.data.data),

  withdraw: (applicationId: string) =>
    api.put<{ success: boolean; data: Application }>(`/applications/${applicationId}/withdraw`).then((r) => r.data.data),

  applications: (id: string) =>
    api.get<{ success: boolean; data: Application[] }>(`/jobs/${id}/applications`).then((r) => r.data.data),

  updateApplicationStatus: (applicationId: string, status: Application["status"]) =>
    api.put<{ success: boolean; data: Application }>(`/jobs/applications/${applicationId}/status`, { status }).then((r) => r.data.data),

  scheduleInterview: (
    applicationId: string,
    payload: { scheduledAt: string; mode?: "video" | "in_person" | "phone"; meetingLink?: string; location?: string; note?: string }
  ) => api.put<{ success: boolean; data: Application }>(`/jobs/applications/${applicationId}/schedule-interview`, payload).then((r) => r.data.data),

  confirmInterview: (applicationId: string) =>
    api.put<{ success: boolean; data: Application }>(`/jobs/applications/${applicationId}/confirm-interview`).then((r) => r.data.data),

  myApplications: () => api.get<{ success: boolean; data: Application[] }>("/applications/mine").then((r) => r.data.data),

  signContract: (applicationId: string, signatureName: string) =>
    api.post<{ success: boolean; data: Application }>(`/applications/${applicationId}/contract/sign`, { signatureName }).then((r) => r.data.data),

  myAnalytics: () => api.get<{ success: boolean; data: JobAnalytics }>("/jobs/analytics/mine").then((r) => r.data.data),

  invitedToMe: () => api.get<{ success: boolean; data: Job[] }>("/jobs/invited").then((r) => r.data.data),

  invite: (id: string, freelancerId: string) =>
    api.put<{ success: boolean; data: Job }>(`/jobs/${id}/invite`, { freelancerId }).then((r) => r.data.data),

  revokeInvite: (id: string, freelancerId: string) =>
    api.delete<{ success: boolean; data: Job }>(`/jobs/${id}/invite/${freelancerId}`).then((r) => r.data.data),

  acceptNda: (id: string) => api.post<{ success: boolean; data: { ndaAccepted: boolean } }>(`/jobs/${id}/accept-nda`).then((r) => r.data.data),

  getAttachmentUrl: (id: string, index: number) =>
    api.get<{ success: boolean; data: { url: string; name: string } }>(`/jobs/${id}/attachments/${index}/signed-url`).then((r) => r.data.data),

  accessLog: (id: string) => api.get<{ success: boolean; data: JobAccessLogEntry[] }>(`/jobs/${id}/access-log`).then((r) => r.data.data),
};
