import type { InfluencerPlatform } from "./user";

export type AgencyClientStatus = "pending" | "accepted" | "declined" | "removed";

// Slim shapes — only what agencyClient.controller.js actually selects.
export interface AgencyClientAgency {
  _id: string;
  name: string;
  avatar?: string;
  headline?: string;
  location?: string;
  agencyProfile?: { agencyType?: string };
  isVerified?: boolean;
  rating?: number;
  reviewCount?: number;
}

export interface AgencyClientBrand {
  _id: string;
  name: string;
  avatar?: string;
  headline?: string;
  location?: string;
  brandProfile?: { industry?: string };
  isVerified?: boolean;
  rating?: number;
  reviewCount?: number;
}

export interface AgencyClientRow {
  _id: string;
  status: AgencyClientStatus;
  budget?: number;
  message?: string;
  createdAt: string;
  respondedAt?: string | null;
  // Present on the brand-facing endpoints (/mine, invite response).
  agency?: AgencyClientAgency;
  // Present on the agency-facing endpoints (/managed, /pending).
  brand?: AgencyClientBrand;
}

// GET /campaigns/:id/report — a computed report, not a stored document.
export interface CampaignReportInfluencer {
  applicationId: string;
  influencer: { _id: string; name: string; avatar?: string; influencerProfile?: { category?: string; niche?: string; platforms?: InfluencerPlatform[] } };
  status: string;
  origin?: "applied" | "invited";
  proposedRate: number;
  deliveryDays: number;
  payment: {
    type: string;
    amount: number;
    status: string;
    escrowStatus: string;
    orderStatus: string;
    deliverables?: { url: string; name?: string }[];
    deliveredAt?: string;
  } | null;
}

export interface CampaignReport {
  campaign: {
    _id: string;
    title: string;
    status: "open" | "closed" | "draft";
    budgetMin: number;
    budgetMax: number;
    viewsCount: number;
    applicationsCount: number;
    employer: { _id: string; name: string; avatar?: string };
    onBehalfOf?: { _id: string; name: string; avatar?: string } | null;
    createdAt: string;
  };
  summary: {
    totalApplications: number;
    hiredCount: number;
    completedCount: number;
    totalSpend: number;
    totalReleased: number;
  };
  influencers: CampaignReportInfluencer[];
}
