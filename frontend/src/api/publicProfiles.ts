import { api } from "./axios";
import type { BrandSummary, AgencySummary, TalentPartnerSummary, BrandListItem, AgencyListItem, TalentPartnerListItem, Paginated } from "@/types";

export interface DirectoryFilters {
  search?: string;
  // Brand-only — an exact brandProfile.categories match, or "other" for
  // anything outside the fixed BRAND_CATEGORIES list (see
  // publicProfile.controller.js). Harmless to send for agency/talent_partner
  // lists too since they simply have no matching field to filter on.
  category?: string;
  page?: number;
  limit?: number;
}

// One generic backend endpoint (publicProfile.controller.js) keyed by role —
// three thin typed wrappers here rather than three near-duplicate endpoints.
export const publicProfileApi = {
  getBrand: (id: string) => api.get<{ success: boolean; data: BrandSummary }>(`/public-profiles/brand/${id}`).then((r) => r.data.data),
  getAgency: (id: string) => api.get<{ success: boolean; data: AgencySummary }>(`/public-profiles/agency/${id}`).then((r) => r.data.data),
  getTalentPartner: (id: string) =>
    api.get<{ success: boolean; data: TalentPartnerSummary }>(`/public-profiles/talent_partner/${id}`).then((r) => r.data.data),

  listBrands: (filters: DirectoryFilters = {}) =>
    api.get<Paginated<BrandListItem>>("/public-profiles/brand", { params: filters }).then((r) => r.data),
  listAgencies: (filters: DirectoryFilters = {}) =>
    api.get<Paginated<AgencyListItem>>("/public-profiles/agency", { params: filters }).then((r) => r.data),
  listTalentPartners: (filters: DirectoryFilters = {}) =>
    api.get<Paginated<TalentPartnerListItem>>("/public-profiles/talent_partner", { params: filters }).then((r) => r.data),
};
