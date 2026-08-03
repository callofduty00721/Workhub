import { api } from "./axios";
import type { JobSeekerSummary, Paginated } from "@/types";

export interface JobSeekerFilters {
  search?: string;
  location?: string;
  page?: number;
  limit?: number;
}

export const jobSeekerApi = {
  list: (filters: JobSeekerFilters = {}) => api.get<Paginated<JobSeekerSummary>>("/job-seekers", { params: filters }).then((r) => r.data),

  getProfile: (id: string) => api.get<{ success: boolean; data: JobSeekerSummary }>(`/job-seekers/${id}`).then((r) => r.data.data),
};
