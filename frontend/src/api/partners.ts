import { api } from "./axios";
import type { Paginated, PartnerSummary, PartnerType, PartnershipType } from "@/types";

export type PartnerSort = "newest" | "clients" | "projects";

export interface PartnerFilters {
  search?: string;
  type?: PartnerType;
  service?: string;
  industry?: string;
  location?: string;
  companySize?: string;
  partnershipType?: PartnershipType;
  verified?: boolean;
  sort?: PartnerSort;
  page?: number;
  limit?: number;
}

export const partnerApi = {
  list: (filters: PartnerFilters = {}) => api.get<Paginated<PartnerSummary>>("/partners", { params: filters }).then((r) => r.data),

  getProfile: (id: string) => api.get<{ success: boolean; data: PartnerSummary }>(`/partners/${id}`).then((r) => r.data.data),
};
