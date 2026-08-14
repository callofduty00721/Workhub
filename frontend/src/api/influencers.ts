import { api } from "./axios";
import type { InfluencerSummary, Paginated } from "@/types";

export type InfluencerSort = "newest" | "rating" | "reviews" | "followers" | "campaigns" | "match";

export interface InfluencerFilters {
  search?: string;
  niche?: string;
  category?: string;
  location?: string;
  minRating?: number;
  verifiedOnly?: boolean;
  // Case-insensitive exact match against a platform name (e.g. "Instagram").
  platform?: string;
  minFollowers?: number;
  maxFollowers?: number;
  // Ceiling on the influencer's cheapest rate-card entry, in INR.
  maxBudget?: number;
  sort?: InfluencerSort;
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
