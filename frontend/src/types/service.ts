import type { PortfolioItem } from "./user";

export type PackageName = "basic" | "standard" | "premium";

export interface ServicePackage {
  name: PackageName;
  title?: string;
  description?: string;
  price: number;
  deliveryDays: number;
  // -1 means unlimited.
  revisions?: number;
  features?: string[];
}

export interface Service {
  _id: string;
  freelancer:
    | {
        _id: string;
        name: string;
        avatar?: string;
        headline?: string;
        location?: string;
        rating?: number;
        reviewCount?: number;
        portfolioItems?: PortfolioItem[];
        level?: "top_rated" | "level_1" | "new";
        availabilityStatus?: "available" | "busy";
        responseTimeLabel?: string;
        onTimeDeliveryPercent?: number;
        yearsOfExperience?: number;
        createdAt?: string;
        jobsCompleted?: number;
        verifiedSkills?: string[];
      }
    | string;
  // Set when the freelancer belongs to an agency/Company team — teammates can
  // jointly manage this gig (see CompanyTeam.tsx), and it's shown as a badge.
  company?: { _id: string; name: string } | string | null;
  title: string;
  description: string;
  category: string;
  subCategory?: string;
  priceType: "fixed" | "hourly";
  price: number;
  deliveryDays: number;
  // -1 means unlimited.
  revisions?: number;
  packages?: ServicePackage[];
  skills: string[];
  images?: string[];
  video?: string;
  liveDemoUrl?: string;
  experienceLevel?: "beginner" | "intermediate" | "expert";
  languages?: string[];
  extras?: { label: string; price: number }[];
  tags?: string[];
  responseTime?: "Within 1 Hour" | "Within a few hours" | "Within a day" | "Within 2 days";
  cancellationPolicy?: "Flexible" | "Standard" | "Strict";
  status: "active" | "private" | "paused" | "draft";
  isDemo?: boolean;
  ordersCount: number;
  viewsCount: number;
  rating: number;
  reviewCount: number;
  createdAt: string;
}
