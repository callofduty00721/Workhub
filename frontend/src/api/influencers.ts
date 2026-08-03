import { api } from "./axios";
import type { InfluencerSummary, Paginated } from "@/types";

export interface InfluencerFilters {
  search?: string;
  niche?: string;
  category?: string;
  page?: number;
  limit?: number;
}

export interface ProfileViewPoint {
  date: string;
  views: number;
}

export const influencerApi = {
  list: (filters: InfluencerFilters = {}) => api.get<Paginated<InfluencerSummary>>("/influencers", { params: filters }).then((r) => r.data),

  getProfile: (id: string) => api.get<{ success: boolean; data: InfluencerSummary }>(`/influencers/${id}`).then((r) => r.data.data),

  myViewTrend: () => api.get<{ success: boolean; data: ProfileViewPoint[] }>("/influencers/me/view-trend").then((r) => r.data.data),
};
