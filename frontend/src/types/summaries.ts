import type {
  JobSeekerProfile,
  InfluencerProfile,
  ExperienceEntry,
  EducationEntry,
  AchievementEntry,
  SocialLinks,
  MentorSessionFormat,
} from "./user";
import type { StartupStage } from "./startup";

export type PartnerType = "accelerator" | "incubator" | "government" | "ngo" | "service_provider";

export interface JobSeekerSummary {
  _id: string;
  name: string;
  avatar?: string;
  headline?: string;
  location?: string;
  bio?: string;
  skills: string[];
  yearsOfExperience: number;
  jobSeekerProfile?: JobSeekerProfile;
  resumeUrl?: string;
  createdAt: string;
}

export interface InfluencerSummary {
  _id: string;
  name: string;
  avatar?: string;
  headline?: string;
  location?: string;
  bio?: string;
  influencerProfile?: InfluencerProfile;
  createdAt: string;
}

export interface InvestorSummary {
  _id: string;
  name: string;
  avatar?: string;
  headline?: string;
  location?: string;
  bio?: string;
  investmentFocus: string[];
  ticketSizeMin: number;
  ticketSizeMax: number;
  portfolioCompanyCount: number;
  fundName?: string;
  fundSize?: number;
  preferredStages?: StartupStage[];
  linkedIn?: string;
  socialLinks?: SocialLinks;
  createdAt: string;
}

export interface MentorSummary {
  _id: string;
  name: string;
  avatar?: string;
  headline?: string;
  location?: string;
  bio?: string;
  expertise: string[];
  sessionRate: number;
  sessionFormat?: MentorSessionFormat;
  hoursPerWeekAvailable?: number;
  workingDays?: string[];
  workingHours?: string;
  linkedIn?: string;
  yearsOfExperience: number;
  rating: number;
  reviewCount: number;
  completedSessionsCount?: number;
  createdAt: string;
}

export interface PartnerSummary {
  _id: string;
  name: string;
  avatar?: string;
  headline?: string;
  location?: string;
  bio?: string;
  organizationName: string;
  partnerType: PartnerType;
  programDetails?: string;
  startupsSupportedCount?: number;
  applicationLink?: string;
  socialLinks?: SocialLinks;
  createdAt: string;
}

export interface FounderStartupSummary {
  _id: string;
  name: string;
  tagline: string;
  logo?: string;
  stage: StartupStage;
  industry: string;
  location: string;
  isVerified: boolean;
  founderVerified: boolean;
  createdAt: string;
  fundingRaised: number;
  teamSize: number;
}

export interface FounderStats {
  teamSize: number;
  followersCount: number;
  viewCount: number;
  fundingRaised: number;
  startupsCount: number;
  investorsCount: number;
  postViews: number;
}

export interface FounderRecentInvestor {
  _id: string;
  investor: { _id: string; name: string; avatar?: string };
  startupName: string;
  amount: number;
  confirmedAt?: string;
}

export interface FounderTeamMember {
  name: string;
  role: string;
  avatar?: string;
  startupName: string;
}

export interface FounderSummary {
  _id: string;
  name: string;
  avatar?: string;
  coverImage?: string;
  headline?: string;
  location?: string;
  bio?: string;
  linkedIn?: string;
  industries: string[];
  pastStartupsCount: number;
  skills?: string[];
  yearsOfExperience?: number;
  experience: ExperienceEntry[];
  education: EducationEntry[];
  achievements: AchievementEntry[];
  languages: string[];
  dateOfBirth?: string;
  nationality?: string;
  educationLevel?: string;
  roleTags: string[];
  lookingFor: string[];
  socialLinks?: SocialLinks;
  isEmailVerified: boolean;
  createdAt: string;
  followersCount: number;
  isFollowing: boolean;
  isOnline: boolean;
  lastActiveAt?: string;
  startups: FounderStartupSummary[];
  team: FounderTeamMember[];
  stats: FounderStats;
  recentInvestors: FounderRecentInvestor[];
}
