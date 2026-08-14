import { api } from "./axios";
import type { Application, ApplicationStatus, Campaign, CampaignReport, Paginated } from "@/types";

export interface CampaignFilters {
  search?: string;
  platform?: string;
  employer?: string;
  page?: number;
  limit?: number;
}

// Dashboard-overview numbers for a brand/agency/talent_partner — see
// getMyCampaignAnalytics. `jobs` keeps that field name (not `campaigns`) so
// EmployerDashboard can treat it the same shape as JobAnalytics/ProjectAnalytics.
export interface CampaignAnalytics {
  totalViews: number;
  totalApplications: number;
  byStatus: Partial<Record<ApplicationStatus, number>>;
  totalSpent: number;
  hiredInfluencersCount: number;
  jobs: Pick<Campaign, "_id" | "title" | "viewsCount" | "applicationsCount" | "status">[];
}

export const campaignApi = {
  list: (filters: CampaignFilters = {}) => api.get<Paginated<Campaign>>("/campaigns", { params: filters }).then((r) => r.data),

  mine: () => api.get<{ success: boolean; data: Campaign[] }>("/campaigns/mine").then((r) => r.data.data),

  myAnalytics: () => api.get<{ success: boolean; data: CampaignAnalytics }>("/campaigns/analytics/mine").then((r) => r.data.data),

  // A brand's view of campaigns an agency is running for them.
  onBehalfOfMe: () => api.get<{ success: boolean; data: Campaign[] }>("/campaigns/on-behalf-of-me").then((r) => r.data.data),

  getById: (id: string) => api.get<{ success: boolean; data: Campaign }>(`/campaigns/${id}`).then((r) => r.data.data),

  create: (payload: Partial<Campaign>) => api.post<{ success: boolean; data: Campaign }>("/campaigns", payload).then((r) => r.data.data),

  update: (id: string, payload: Partial<Campaign>) =>
    api.put<{ success: boolean; data: Campaign }>(`/campaigns/${id}`, payload).then((r) => r.data.data),

  remove: (id: string) => api.delete(`/campaigns/${id}`).then((r) => r.data),

  apply: (id: string, payload: { coverLetter?: string; proposedRate?: number; deliveryDays?: number }) =>
    api.post<{ success: boolean; data: Application }>(`/campaigns/${id}/apply`, payload).then((r) => r.data.data),

  applications: (id: string) =>
    api.get<{ success: boolean; data: Application[] }>(`/campaigns/${id}/applications`).then((r) => r.data.data),

  invite: (id: string, payload: { influencerId: string; message?: string }) =>
    api.post<{ success: boolean; data: Application }>(`/campaigns/${id}/invite`, payload).then((r) => r.data.data),

  getReport: (id: string) => api.get<{ success: boolean; data: CampaignReport }>(`/campaigns/${id}/report`).then((r) => r.data.data),

  // Application status/withdraw/contract-sign are handled by the same
  // generic Application endpoints jobApi uses — see jobApi.updateApplicationStatus/
  // withdraw/signContract, which work against any onModel (Job/Project/Campaign).
};
