import { api } from "./axios";
import type { Application, ApplicationStatus, Project, JobAccessLogEntry, Paginated } from "@/types";

export interface ProjectFilters {
  search?: string;
  type?: string;
  category?: string;
  subCategory?: string;
  isRemote?: boolean;
  page?: number;
  limit?: number;
}

export interface ProjectAnalytics {
  totalViews: number;
  totalApplications: number;
  byStatus: Partial<Record<ApplicationStatus, number>>;
  projects: Pick<Project, "_id" | "title" | "viewsCount" | "applicationsCount" | "status">[];
}

export const projectApi = {
  list: (filters: ProjectFilters = {}) => api.get<Paginated<Project>>("/projects", { params: filters }).then((r) => r.data),

  mine: () => api.get<{ success: boolean; data: Project[] }>("/projects/mine").then((r) => r.data.data),

  getById: (id: string) => api.get<{ success: boolean; data: Project }>(`/projects/${id}`).then((r) => r.data.data),

  create: (payload: Partial<Project>) => api.post<{ success: boolean; data: Project }>("/projects", payload).then((r) => r.data.data),

  update: (id: string, payload: Partial<Project>) =>
    api.put<{ success: boolean; data: Project }>(`/projects/${id}`, payload).then((r) => r.data.data),

  remove: (id: string) => api.delete(`/projects/${id}`).then((r) => r.data),

  apply: (id: string, payload: { coverLetter?: string; resumeUrl?: string; proposedRate?: number; deliveryDays?: number }) =>
    api.post<{ success: boolean; data: Application }>(`/projects/${id}/apply`, payload).then((r) => r.data.data),

  applications: (id: string) =>
    api.get<{ success: boolean; data: Application[] }>(`/projects/${id}/applications`).then((r) => r.data.data),

  directHire: (freelancerId: string, payload: { scopeTitle: string; scopeDescription: string; amount: number; deliveryDays?: number }) =>
    api.post<{ success: boolean; data: Application }>(`/freelancers/${freelancerId}/direct-hire`, payload).then((r) => r.data.data),

  myAnalytics: () => api.get<{ success: boolean; data: ProjectAnalytics }>("/projects/analytics/mine").then((r) => r.data.data),

  invitedToMe: () => api.get<{ success: boolean; data: Project[] }>("/projects/invited").then((r) => r.data.data),

  invite: (id: string, freelancerId: string) =>
    api.put<{ success: boolean; data: Project }>(`/projects/${id}/invite`, { freelancerId }).then((r) => r.data.data),

  revokeInvite: (id: string, freelancerId: string) =>
    api.delete<{ success: boolean; data: Project }>(`/projects/${id}/invite/${freelancerId}`).then((r) => r.data.data),

  acceptNda: (id: string) => api.post<{ success: boolean; data: { ndaAccepted: boolean } }>(`/projects/${id}/accept-nda`).then((r) => r.data.data),

  getAttachmentUrl: (id: string, index: number) =>
    api.get<{ success: boolean; data: { url: string; name: string } }>(`/projects/${id}/attachments/${index}/signed-url`).then((r) => r.data.data),

  accessLog: (id: string) => api.get<{ success: boolean; data: JobAccessLogEntry[] }>(`/projects/${id}/access-log`).then((r) => r.data.data),
};
