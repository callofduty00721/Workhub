import { api } from "./axios";
import type { Paginated, Startup, VerificationRequestType, VerificationRequestDoc } from "@/types";

export interface StartupFilters {
  search?: string;
  industry?: string;
  subIndustry?: string;
  stage?: string;
  sort?: "newest" | "funding" | "rating";
  page?: number;
  limit?: number;
}

export const startupApi = {
  list: (filters: StartupFilters = {}) =>
    api.get<Paginated<Startup>>("/startups", { params: filters }).then((r) => r.data),

  mine: () => api.get<{ success: boolean; data: Startup[] }>("/startups/mine").then((r) => r.data.data),

  followedByMe: () => api.get<{ success: boolean; data: Startup[] }>("/startups/followed/mine").then((r) => r.data.data),

  getById: (id: string) => api.get<{ success: boolean; data: Startup }>(`/startups/${id}`).then((r) => r.data.data),

  create: (payload: Partial<Startup>) =>
    api.post<{ success: boolean; data: Startup }>("/startups", payload).then((r) => r.data.data),

  update: (id: string, payload: Partial<Startup>) =>
    api.put<{ success: boolean; data: Startup }>(`/startups/${id}`, payload).then((r) => r.data.data),

  remove: (id: string) => api.delete(`/startups/${id}`).then((r) => r.data),

  toggleFollow: (id: string) =>
    api.post<{ success: boolean; following: boolean; followerCount: number }>(`/startups/${id}/follow`).then((r) => r.data),

  toggleInterest: (id: string) =>
    api
      .post<{ success: boolean; interested: boolean; interestCount: number }>(`/startups/${id}/interest`)
      .then((r) => r.data),

  report: (id: string, reason?: string) =>
    api.post<{ success: boolean; message: string }>(`/startups/${id}/report`, { reason }).then((r) => r.data),

  submitVerificationRequest: (
    id: string,
    payload: { type: VerificationRequestType; documents: VerificationRequestDoc[]; note?: string }
  ) => api.post<{ success: boolean; message: string }>(`/startups/${id}/verification-requests`, payload).then((r) => r.data),
};
