import { api } from "./axios";
import type { FounderSummary, Paginated } from "@/types";

export interface FounderFilters {
  search?: string;
  page?: number;
  limit?: number;
}

export const founderApi = {
  list: (filters: FounderFilters = {}) => api.get<Paginated<FounderSummary>>("/founders", { params: filters }).then((r) => r.data),

  getProfile: (id: string) => api.get<{ success: boolean; data: FounderSummary }>(`/founders/${id}`).then((r) => r.data.data),

  toggleFollow: (id: string) =>
    api
      .post<{ success: boolean; data: { following: boolean; followersCount: number } }>(`/founders/${id}/follow`)
      .then((r) => r.data.data),
};
