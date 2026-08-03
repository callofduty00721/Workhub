import { api } from "./axios";
import type { Application, Campaign, Paginated } from "@/types";

export interface CampaignFilters {
  search?: string;
  platform?: string;
  page?: number;
  limit?: number;
}

export const campaignApi = {
  list: (filters: CampaignFilters = {}) => api.get<Paginated<Campaign>>("/campaigns", { params: filters }).then((r) => r.data),

  mine: () => api.get<{ success: boolean; data: Campaign[] }>("/campaigns/mine").then((r) => r.data.data),

  getById: (id: string) => api.get<{ success: boolean; data: Campaign }>(`/campaigns/${id}`).then((r) => r.data.data),

  create: (payload: Partial<Campaign>) => api.post<{ success: boolean; data: Campaign }>("/campaigns", payload).then((r) => r.data.data),

  update: (id: string, payload: Partial<Campaign>) =>
    api.put<{ success: boolean; data: Campaign }>(`/campaigns/${id}`, payload).then((r) => r.data.data),

  remove: (id: string) => api.delete(`/campaigns/${id}`).then((r) => r.data),

  apply: (id: string, payload: { coverLetter?: string; proposedRate?: number; deliveryDays?: number }) =>
    api.post<{ success: boolean; data: Application }>(`/campaigns/${id}/apply`, payload).then((r) => r.data.data),

  applications: (id: string) =>
    api.get<{ success: boolean; data: Application[] }>(`/campaigns/${id}/applications`).then((r) => r.data.data),

  // Application status/withdraw/contract-sign are handled by the same
  // generic Application endpoints jobApi uses — see jobApi.updateApplicationStatus/
  // withdraw/signContract, which work against any onModel (Job/Project/Campaign).
};
