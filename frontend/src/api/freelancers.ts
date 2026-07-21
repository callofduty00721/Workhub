import { api } from "./axios";
import type { FreelancerSummary, Paginated, Service, PortfolioItem } from "@/types";

export interface ServiceFilters {
  search?: string;
  category?: string;
  subCategory?: string;
  page?: number;
  limit?: number;
}

export const serviceApi = {
  list: (filters: ServiceFilters = {}) => api.get<Paginated<Service>>("/services", { params: filters }).then((r) => r.data),

  mine: () => api.get<{ success: boolean; data: Service[] }>("/services/mine").then((r) => r.data.data),

  getById: (id: string) => api.get<{ success: boolean; data: Service }>(`/services/${id}`).then((r) => r.data.data),

  create: (payload: Partial<Service>) => api.post<{ success: boolean; data: Service }>("/services", payload).then((r) => r.data.data),

  update: (id: string, payload: Partial<Service>) =>
    api.put<{ success: boolean; data: Service }>(`/services/${id}`, payload).then((r) => r.data.data),

  remove: (id: string) => api.delete(`/services/${id}`).then((r) => r.data),
};

export interface FreelancerFilters {
  search?: string;
  skill?: string;
  category?: string;
  subCategory?: string;
  page?: number;
  limit?: number;
}

export const freelancerApi = {
  list: (filters: FreelancerFilters = {}) =>
    api.get<Paginated<FreelancerSummary>>("/freelancers", { params: filters }).then((r) => r.data),

  getProfile: (id: string) =>
    api
      .get<{ success: boolean; data: { freelancer: FreelancerSummary & { bio?: string; portfolioItems?: PortfolioItem[] }; services: Service[] } }>(
        `/freelancers/${id}`
      )
      .then((r) => r.data.data),
};
