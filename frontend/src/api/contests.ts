import { api } from "./axios";
import type { Contest, ContestEntry, Paginated } from "@/types";

export interface ContestFilters {
  search?: string;
  category?: string;
  page?: number;
  limit?: number;
}

export const contestApi = {
  list: (filters: ContestFilters = {}) => api.get<Paginated<Contest>>("/contests", { params: filters }).then((r) => r.data),

  categories: () => api.get<{ success: boolean; data: string[] }>("/contests/categories").then((r) => r.data.data),

  mine: () => api.get<{ success: boolean; data: Contest[] }>("/contests/mine").then((r) => r.data.data),

  getById: (id: string) => api.get<{ success: boolean; data: Contest }>(`/contests/${id}`).then((r) => r.data.data),

  create: (payload: Partial<Contest>) => api.post<{ success: boolean; data: Contest }>("/contests", payload).then((r) => r.data.data),

  update: (id: string, payload: Partial<Contest>) =>
    api.put<{ success: boolean; data: Contest }>(`/contests/${id}`, payload).then((r) => r.data.data),

  remove: (id: string) => api.delete(`/contests/${id}`).then((r) => r.data),

  submitEntry: (id: string, payload: { title: string; description: string; fileUrl?: string }) =>
    api.post<{ success: boolean; data: ContestEntry }>(`/contests/${id}/entries`, payload).then((r) => r.data.data),

  entries: (id: string) => api.get<{ success: boolean; data: ContestEntry[] }>(`/contests/${id}/entries`).then((r) => r.data.data),

  myEntries: () => api.get<{ success: boolean; data: ContestEntry[] }>("/contests/entries/mine").then((r) => r.data.data),

  pickWinner: (id: string, entryId: string) =>
    api.put<{ success: boolean; data: Contest }>(`/contests/${id}/entries/${entryId}/winner`).then((r) => r.data.data),
};
