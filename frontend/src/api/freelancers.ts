import { api } from "./axios";
import type {
  FreelancerSummary,
  Paginated,
  Service,
  PortfolioItem,
  ExperienceEntry,
  EducationEntry,
  AchievementEntry,
  SocialLinks,
  KycStatus,
} from "@/types";
import type { VerifiedSkill } from "./skillTests";

export interface ServiceFilters {
  search?: string;
  category?: string;
  subCategory?: string;
  priceMin?: number;
  priceMax?: number;
  maxDeliveryDays?: number;
  page?: number;
  limit?: number;
}

export interface ServiceAnalytics {
  totalViews: number;
  totalOrders: number;
  services: Pick<Service, "_id" | "title" | "viewsCount" | "ordersCount">[];
}

export const serviceApi = {
  list: (filters: ServiceFilters = {}) => api.get<Paginated<Service>>("/services", { params: filters }).then((r) => r.data),

  mine: () => api.get<{ success: boolean; data: Service[] }>("/services/mine").then((r) => r.data.data),

  getById: (id: string) => api.get<{ success: boolean; data: Service }>(`/services/${id}`).then((r) => r.data.data),

  create: (payload: Partial<Service>) => api.post<{ success: boolean; data: Service }>("/services", payload).then((r) => r.data.data),

  update: (id: string, payload: Partial<Service>) =>
    api.put<{ success: boolean; data: Service }>(`/services/${id}`, payload).then((r) => r.data.data),

  remove: (id: string) => api.delete(`/services/${id}`).then((r) => r.data),

  myAnalytics: () => api.get<{ success: boolean; data: ServiceAnalytics }>("/services/analytics/mine").then((r) => r.data.data),
};

export type FreelancerLevel = "new" | "level_1" | "top_rated";

export interface FreelancerFilters {
  search?: string;
  skill?: string;
  category?: string;
  subCategory?: string;
  level?: FreelancerLevel;
  rateMin?: number;
  rateMax?: number;
  page?: number;
  limit?: number;
}

export interface FreelancerPublicStats {
  jobsCompleted: number;
  totalEarnings: number;
  repeatClientsPercent: number;
  jobSuccessPercent: number;
  level: FreelancerLevel;
}

export type FreelancerProfileData = FreelancerSummary & {
  bio?: string;
  portfolioItems?: PortfolioItem[];
  hoursPerWeekAvailable?: number;
  workingDays?: string[];
  workingHours?: string;
  totalHoursWorked?: number;
  onTimeDeliveryPercent?: number;
  responseTimeLabel?: string;
  phone?: string;
  resumeUrl?: string;
  resumeUpdatedAt?: string;
  lastActiveAt?: string;
  createdAt?: string;
  experience?: ExperienceEntry[];
  education?: EducationEntry[];
  achievements?: AchievementEntry[];
  languages?: string[];
  socialLinks?: SocialLinks;
  linkedIn?: string;
  kycStatus?: KycStatus;
  isEmailVerified?: boolean;
  videoIntro?: string;
  followersCount?: number;
  isFollowing?: boolean;
};

export const freelancerApi = {
  list: (filters: FreelancerFilters = {}) =>
    api.get<Paginated<FreelancerSummary>>("/freelancers", { params: filters }).then((r) => r.data),

  getProfile: (id: string) =>
    api
      .get<{
        success: boolean;
        data: { freelancer: FreelancerProfileData; services: Service[]; stats: FreelancerPublicStats; verifiedSkills: VerifiedSkill[] };
      }>(`/freelancers/${id}`)
      .then((r) => r.data.data),

  toggleFollow: (id: string) =>
    api.post<{ success: boolean; data: { following: boolean; followersCount: number } }>(`/freelancers/${id}/follow`).then((r) => r.data.data),
};
