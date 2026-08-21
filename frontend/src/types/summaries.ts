import type {
  JobSeekerProfile,
  InfluencerProfile,
  BrandProfile,
  AgencyProfile,
  TalentPartnerProfile,
  ExperienceEntry,
  EducationEntry,
  AchievementEntry,
  SocialLinks,
  MentorSessionFormat,
  AvailabilityStatus,
  InfluencerCollaboration,
} from "./user";
import type { StartupStage } from "./startup";

export type PartnerType = "agency" | "company" | "consultant" | "service_provider" | "technology_partner" | "strategic_partner";

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
  isVerified?: boolean;
  rating?: number;
  reviewCount?: number;
  socialLinks?: SocialLinks;
  achievements?: AchievementEntry[];
  availabilityStatus?: AvailabilityStatus;
  createdAt: string;
  // Only present on results from the /influencers list (a runtime aggregation) —
  // not on a single getProfile fetch. See listInfluencers in influencer.controller.js.
  totalFollowers?: number;
  // Count of released campaign-escrow payments — a real, platform-verified
  // transaction count, not a self-reported number. See listInfluencers'
  // campaignsCompletedStage.
  campaignsCompleted?: number;
  matchScore?: number;
  // Auto-generated from released campaign payments — see getInfluencerProfile.
  // Only present on a single getProfile fetch, same as campaignsCompleted.
  verifiedCollaborations?: InfluencerCollaboration[];
}

// Shared shape across the three /api/public-profiles/:role/:id responses —
// see publicProfile.controller.js's PUBLIC_FIELDS_BY_ROLE.
interface PublicProfileBase {
  _id: string;
  name: string;
  avatar?: string;
  headline?: string;
  location?: string;
  bio?: string;
  isVerified?: boolean;
  rating?: number;
  reviewCount?: number;
  socialLinks?: SocialLinks;
  achievements?: AchievementEntry[];
  company?: { _id: string; name: string } | null;
  createdAt: string;
  // Auto-generated from released campaign payments this profile paid out —
  // see getPublicProfile. brand/agency/talent_partner only.
  verifiedCollaborations?: InfluencerCollaboration[];
}

export interface BrandSummary extends PublicProfileBase {
  brandProfile?: BrandProfile;
}

export interface AgencySummary extends PublicProfileBase {
  agencyProfile?: AgencyProfile;
}

export interface TalentPartnerSummary extends PublicProfileBase {
  talentPartnerProfile?: TalentPartnerProfile;
}

// Trimmer directory-grid shapes — see publicProfile.controller.js's
// LIST_FIELDS_BY_ROLE (no bio/achievements/company, just enough for a card).
interface DirectoryListItemBase {
  _id: string;
  name: string;
  avatar?: string;
  headline?: string;
  location?: string;
  isVerified?: boolean;
  rating?: number;
  reviewCount?: number;
  // Real, computed fresh on every request (see publicProfile.controller.js) —
  // brand/agency/talent_partner only, since only those roles post campaigns.
  openCampaignsCount?: number;
  totalCampaignsCount?: number;
  // Distinct influencers with status:"hired" on any of this profile's
  // campaigns — a real headcount, not a claim.
  hiredInfluencersCount?: number;
  // Summed follower count of those actually-hired influencers' own
  // platforms — real aggregate, not an estimated/forecast reach figure.
  totalReach?: number;
  isDemo?: boolean;
  createdAt: string;
}

export interface BrandListItem extends DirectoryListItemBase {
  brandProfile?: Pick<BrandProfile, "industry" | "categories" | "followerCount" | "website" | "socialLinks">;
}

export interface AgencyListItem extends DirectoryListItemBase {
  agencyProfile?: Pick<AgencyProfile, "agencyType" | "teamSize" | "website" | "socialLinks">;
}

export interface TalentPartnerListItem extends DirectoryListItemBase {
  talentPartnerProfile?: Pick<TalentPartnerProfile, "partnerType" | "website" | "socialLinks">;
}

export type InvestorType = "angel" | "venture_capital" | "private_equity" | "family_office" | "strategic";

export interface InvestorSummary {
  _id: string;
  name: string;
  avatar?: string;
  headline?: string;
  location?: string;
  bio?: string;
  investorType?: InvestorType;
  investmentFocus: string[];
  ticketSizeMin: number;
  ticketSizeMax: number;
  portfolioCompanyCount: number;
  fundName?: string;
  fundSize?: number;
  preferredStages?: StartupStage[];
  linkedIn?: string;
  socialLinks?: SocialLinks;
  isVerified?: boolean;
  isDemo?: boolean;
  createdAt: string;
}

export type MentorCategory = "startup" | "business" | "career" | "technology" | "marketing" | "finance" | "leadership" | "design";

export interface MentorSummary {
  _id: string;
  name: string;
  avatar?: string;
  headline?: string;
  location?: string;
  bio?: string;
  mentorCategory?: MentorCategory;
  expertise: string[];
  sessionRate: number;
  sessionFormat?: MentorSessionFormat;
  hoursPerWeekAvailable?: number;
  workingDays?: string[];
  workingHours?: string;
  linkedIn?: string;
  languages?: string[];
  socialLinks?: SocialLinks;
  availabilityStatus?: AvailabilityStatus;
  isVerified?: boolean;
  yearsOfExperience: number;
  rating: number;
  reviewCount: number;
  completedSessionsCount?: number;
  isDemo?: boolean;
  createdAt: string;
}

export type PartnershipType = "service" | "referral" | "technology" | "strategic" | "distribution";

export interface PartnerSummary {
  _id: string;
  name: string;
  avatar?: string;
  headline?: string;
  location?: string;
  bio?: string;
  organizationName: string;
  partnerType: PartnerType;
  services: string[];
  industries?: string[];
  companySize?: string;
  teamSize?: number;
  yearsInBusiness?: number;
  projectsCompleted?: number;
  clientsServed?: number;
  partnershipTypes?: PartnershipType[];
  programDetails?: string;
  startupsSupportedCount?: number;
  applicationLink?: string;
  linkedIn?: string;
  socialLinks?: SocialLinks;
  isVerified?: boolean;
  isDemo?: boolean;
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
