import type { UserRole } from "./user";

export type StartupStage = "idea" | "pre_seed" | "seed" | "series_a" | "series_b" | "growth";

export interface TeamMember {
  name: string;
  role: string;
  bio?: string;
  linkedin?: string;
  avatar?: string;
  skills?: string[];
  joinedDate?: string;
}

export interface Milestone {
  title: string;
  description?: string;
  date: string;
}

export type ProductStatus = "live" | "beta" | "coming_soon";

export interface StartupProduct {
  name: string;
  description?: string;
  image?: string;
  images?: string[];
  tag?: string;
  tags?: string[];
  url?: string;
  price?: string;
  status?: ProductStatus;
  features?: string[];
}

export interface PlanPhase {
  title: string;
  timeframe?: string;
  checklist: string[];
  estimatedCost: number;
}

export interface MarketStat {
  value: string;
  label: string;
}

export interface ProcessStep {
  title: string;
  description?: string;
}

export type OpenRoleType = "full_time" | "part_time";
export type WorkMode = "on_site" | "remote" | "hybrid";

export interface OpenRole {
  title: string;
  type: OpenRoleType;
  workMode: WorkMode;
  description?: string;
  requiredSkills?: string[];
  requiredExperience?: string;
  salary?: string;
  responsibilities?: string[];
}

export type TeamApplicationStatus = "pending" | "reviewing" | "accepted" | "rejected";

export interface TeamApplication {
  _id: string;
  startup: string;
  applicant: { _id: string; name: string; avatar?: string; email?: string; headline?: string };
  roleTitle: string;
  roleType: OpenRoleType;
  isCustomRole: boolean;
  bio: string;
  experience: string;
  skills: string[];
  resumeUrl?: string;
  status: TeamApplicationStatus;
  createdAt: string;
}

export interface TractionStat {
  label: string;
  value: string;
}

export interface BusinessPlanItem {
  label: string;
  value: string;
}

export interface FundUsageItem {
  category: string;
  description?: string;
  estimatedCost: number;
}

export interface ExpectedOutcome {
  label: string;
  value: string;
}

export type DocumentCategory = "Legal & Registration" | "Financials" | "Business Plan" | "Pitch Deck" | "Product" | "Other";

export interface StartupDocument {
  name: string;
  description?: string;
  url: string;
  category: DocumentCategory;
  fileSize?: string;
  uploadedAt?: string;
}

export type VerificationRequestType = "founder" | "business";
export type VerificationRequestStatus = "pending" | "approved" | "rejected";

export interface VerificationRequestDoc {
  name: string;
  url: string;
}

export interface VerificationRequest {
  _id: string;
  type: VerificationRequestType;
  status: VerificationRequestStatus;
  documents: VerificationRequestDoc[];
  note?: string;
  submittedAt: string;
  reviewedAt?: string;
  reviewNote?: string;
}

export interface InterestedUser {
  _id: string;
  name: string;
  avatar?: string;
  role: UserRole;
}

export interface Startup {
  _id: string;
  founder: { _id: string; name: string; avatar?: string; createdAt?: string } | string;
  name: string;
  tagline: string;
  description: string;
  logo?: string;
  coverImage?: string;
  industry: string;
  subIndustry?: string;
  stage: StartupStage;
  location: string;
  incorporationType?: string;
  registrationNumber?: string;
  foundedDate?: string;
  problemStatement?: string;
  solution?: string;
  targetAudience?: string;
  fundingNeeded: number;
  fundingRaised: number;
  fundingType: string[];
  investmentType?: string;
  minimumInvestment: number;
  fundingDurationMonths: number;
  expectedClosingDate?: string;
  fundUsagePlan: FundUsageItem[];
  expectedOutcomes: ExpectedOutcome[];
  whyInvest: string[];
  team: TeamMember[];
  openRoles: OpenRole[];
  milestones: Milestone[];
  missionStatement?: string;
  highlights: string[];
  tractionStats: TractionStat[];
  businessPlan: BusinessPlanItem[];
  products: StartupProduct[];
  productHighlights: string[];
  howItWorks: ProcessStep[];
  planPhases: PlanPhase[];
  marketStats: MarketStat[];
  competitiveAdvantage: string[];
  whyProduct: string[];
  website?: string;
  pitchDeckUrl?: string;
  documents?: StartupDocument[];
  socialLinks?: Record<string, string>;
  followers: string[];
  interested: (string | InterestedUser)[];
  status: "draft" | "pending_review" | "published";
  founderVerified: boolean;
  isVerified: boolean;
  isFeatured: boolean;
  rating: number;
  reviewCount: number;
  viewCount: number;
  confirmedInvestorCount?: number;
  verificationRequests?: VerificationRequest[];
  isDemo?: boolean;
  createdAt: string;
}

export interface StartupUpdateItem {
  _id: string;
  startup: string;
  title: string;
  description?: string;
  category: string;
  image?: string;
  likes: string[];
  commentCount: number;
  viewCount?: number;
  createdAt: string;
}

export interface Discussion {
  _id: string;
  startup: string;
  author: { _id: string; name: string; avatar?: string };
  title: string;
  body: string;
  category: "Questions" | "Feedback" | "Partnerships" | "Investors" | "General";
  likes: string[];
  commentCount: number;
  viewCount: number;
  createdAt: string;
}

export interface DiscussionComment {
  _id: string;
  discussion: string;
  author: { _id: string; name: string; avatar?: string };
  body: string;
  createdAt: string;
}

export type InvestmentStatus = "pending" | "confirmed" | "declined";

export interface Investment {
  _id: string;
  startup: string;
  investor: { _id: string; name: string; avatar?: string; role: UserRole; createdAt: string };
  amount: number;
  note?: string;
  status: InvestmentStatus;
  confirmedAt?: string;
  verified: boolean;
  refunded: boolean;
  refundAmount?: number;
  refundedAt?: string;
  createdAt: string;
}
