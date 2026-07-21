import { api } from "./axios";
import type { Application, Job, Paginated } from "@/types";

export interface JobFilters {
  search?: string;
  type?: string;
  isRemote?: boolean;
  page?: number;
  limit?: number;
}

export const jobApi = {
  list: (filters: JobFilters = {}) => api.get<Paginated<Job>>("/jobs", { params: filters }).then((r) => r.data),

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

  myApplications: () => api.get<{ success: boolean; data: Application[] }>("/applications/mine").then((r) => r.data.data),
};
