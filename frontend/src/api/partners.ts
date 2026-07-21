import { api } from "./axios";
import type { Paginated, PartnerSummary } from "@/types";

export interface PartnerFilters {
  search?: string;
  type?: string;
  page?: number;
  limit?: number;
}

export const partnerApi = {
  list: (filters: PartnerFilters = {}) => api.get<Paginated<PartnerSummary>>("/partners", { params: filters }).then((r) => r.data),

  getProfile: (id: string) => api.get<{ success: boolean; data: PartnerSummary }>(`/partners/${id}`).then((r) => r.data.data),
};
