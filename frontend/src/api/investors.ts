import { api } from "./axios";
import type { InvestorSummary, InvestorType, Paginated, Startup, StartupStage } from "@/types";

export type InvestorSort = "newest" | "portfolio";

export interface InvestorFilters {
  search?: string;
  focus?: string;
  type?: InvestorType;
  stage?: StartupStage;
  location?: string;
  verified?: boolean;
  minTicket?: number;
  maxTicket?: number;
  sort?: InvestorSort;
  page?: number;
  limit?: number;
}

export const investorApi = {
  list: (filters: InvestorFilters = {}) => api.get<Paginated<InvestorSummary>>("/investors", { params: filters }).then((r) => r.data),

  getProfile: (id: string) => api.get<{ success: boolean; data: InvestorSummary }>(`/investors/${id}`).then((r) => r.data.data),

  dealFlow: () =>
    api
      .get<{ success: boolean; data: { interested: Startup[]; saved: Startup[] } }>("/investors/mine/deal-flow")
      .then((r) => r.data.data),
};
