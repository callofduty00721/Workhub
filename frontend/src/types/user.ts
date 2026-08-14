import type { PaymentType } from "./payment";
import type { WithdrawalMethod } from "./withdrawal";
import type { StartupStage } from "./startup";
import type { PartnerType } from "./summaries";

export type UserRole =
  | "super_admin"
  | "staff"
  | "founder"
  | "freelancer"
  | "job_seeker"
  | "influencer"
  | "employer"
  | "investor"
  | "mentor"
  | "partner"
  | "client"
  | "brand"
  | "agency"
  | "talent_partner";

// Delegable slices of the admin panel a "staff" account can be scoped to —
// mirrors backend/src/modules/shared/user.model.js's PERMISSIONS list
// exactly. Money-moving and global-config areas (withdrawals, payment
// disputes, settings, plans, user management) are deliberately absent —
// those stay super_admin-only regardless of what's in staffPermissions.
export type AdminPermission =
  | "grievances"
  | "kyc"
  | "profile-verifications"
  | "role-verifications"
  | "flagged-startups"
  | "startups"
  | "jobs"
  | "gigs"
  | "contests"
  | "skill-tests";

export const ADMIN_PERMISSION_VALUES: AdminPermission[] = [
  "grievances",
  "kyc",
  "profile-verifications",
  "role-verifications",
  "flagged-startups",
  "startups",
  "jobs",
  "gigs",
  "contests",
  "skill-tests",
];

export const ADMIN_PERMISSION_LABELS: Record<AdminPermission, string> = {
  grievances: "Grievances",
  kyc: "KYC Requests",
  "profile-verifications": "Profile Verifications",
  "role-verifications": "Role Verifications",
  "flagged-startups": "Flagged Startups",
  startups: "Startups",
  jobs: "Jobs & Projects",
  gigs: "Gigs",
  contests: "Contests",
  "skill-tests": "Skill Tests",
};

export type RoleCategory = "talent" | "hiring" | "startup";
export type MentorSessionFormat = "video" | "chat" | "in_person";
export type CompanySize = "1-10" | "11-50" | "51-200" | "201-500" | "500+" | "";
export type VerificationStatus = "unverified" | "pending" | "verified" | "rejected";
export type FounderStage = "idea" | "registered";

export interface InfluencerPlatform {
  platform: string;
  handle?: string;
  followers?: number;
  url?: string;
}

export interface InfluencerRate {
  platform: string;
  contentType: string;
  priceInInr: number;
}

export interface InfluencerCollaboration {
  brandName: string;
  description?: string;
  resultMetric?: string;
  logoUrl?: string;
  // Set only on entries auto-generated from a real released campaign
  // payment (see getInfluencerProfile) — never present on a manually-typed
  // entry, which is how the UI tells the two apart.
  verified?: boolean;
}

export interface InfluencerContentSample {
  url: string;
  caption?: string;
  thumbnailUrl?: string;
}

export interface BrandProduct {
  name: string;
  description?: string;
  imageUrl?: string;
}

export interface InfluencerRequirement {
  category?: string;
  minFollowers?: number;
  platforms?: string[];
  location?: string;
  notes?: string;
}

// A brand/agency/talent-partner's own marketing handles — free-form
// (platform name + URL), not fixed fields, so any platform can be added
// without a code change. Same idea as InfluencerPlatform, distinct from the
// generic top-level SocialLinks (twitter/github/website).
export interface ProfileSocialLink {
  platform: string;
  url: string;
}

export interface BrandProfile {
  industry?: string;
  categories?: string[];
  website?: string;
  socialLinks?: ProfileSocialLink[];
  followerCount?: number;
  products?: BrandProduct[];
  influencerRequirements?: InfluencerRequirement[];
  pastCollaborations?: InfluencerCollaboration[];
}

export type AgencyService = "influencer_marketing" | "social_media_marketing" | "performance_marketing" | "brand_campaigns" | "ugc" | "content_production" | "pr";

// Shared by Agency's "Clients" and Talent Partner's "Brand Partnerships" —
// a free-text showcase, not the consent-gated creator roster.
export interface PartnerClient {
  clientName: string;
  logoUrl?: string;
  description?: string;
}

export interface AgencyProfile {
  agencyType?: string;
  website?: string;
  socialLinks?: ProfileSocialLink[];
  teamSize?: number;
  services?: AgencyService[];
  clients?: PartnerClient[];
  pastCampaigns?: InfluencerCollaboration[];
}

export interface TalentPartnerProfile {
  partnerType?: string;
  website?: string;
  socialLinks?: ProfileSocialLink[];
  services?: string[];
  brandPartnerships?: PartnerClient[];
}

export interface JobSeekerProfile {
  desiredRole?: string;
  expectedSalary?: number;
  noticePeriodDays?: number;
  preferredLocations?: string[];
  willingToRelocate?: boolean;
}

export const LANGUAGE_LEVELS = ["beginner", "conversational", "fluent", "native"] as const;
export type LanguageLevel = (typeof LANGUAGE_LEVELS)[number];

export interface InfluencerLanguage {
  name: string;
  level: LanguageLevel;
}

export interface InfluencerProfile {
  category?: string;
  niche?: string;
  mediaKitUrl?: string;
  platforms?: InfluencerPlatform[];
  rateCard?: InfluencerRate[];
  pastCollaborations?: InfluencerCollaboration[];
  contentSamples?: InfluencerContentSample[];
  languages?: InfluencerLanguage[];
}

export interface ExperienceEntry {
  title: string;
  company: string;
  location?: string;
  startLabel?: string;
  endLabel?: string;
  description?: string;
}

export interface EducationEntry {
  degree: string;
  institution: string;
  startLabel?: string;
  endLabel?: string;
}

export interface AchievementEntry {
  title: string;
  description?: string;
  dateLabel?: string;
}

export interface PortfolioItem {
  title: string;
  description?: string;
  images?: string[];
  video?: string;
  pdf?: string;
  websiteLink?: string;
  githubLink?: string;
  liveDemoLink?: string;
  tags?: string[];
  clientName?: string;
  projectRole?: string;
  // Populated on the public freelancer profile endpoint; a plain id string
  // when read back from the edit-profile form (or null/undefined if unset).
  verifiedPayment?: string | { _id: string; type: PaymentType; amount: number; netAmount?: number; createdAt: string } | null;
}

export type AvailabilityStatus = "available" | "busy";
export type KycStatus = "unverified" | "pending" | "verified" | "rejected";

export interface PayoutDetails {
  preferredMethod: WithdrawalMethod;
  upiId?: string;
  bankAccountNumber?: string;
  bankIfsc?: string;
  bankAccountHolder?: string;
}

export interface SocialLinks {
  twitter?: string;
  github?: string;
  website?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole | null;
  roles?: UserRole[];
  // Only meaningful when role === "staff" — see lib/adminPermissions.ts.
  staffPermissions?: AdminPermission[];
  selectedCategory?: RoleCategory | null;
  jobSeekerProfile?: JobSeekerProfile;
  influencerProfile?: InfluencerProfile;
  brandProfile?: BrandProfile;
  agencyProfile?: AgencyProfile;
  talentPartnerProfile?: TalentPartnerProfile;
  founderStage?: FounderStage;
  isVerified?: boolean;
  verificationStatus?: VerificationStatus;
  verificationDocuments?: { url: string; name: string }[];
  verificationSubmittedAt?: string;
  verificationNote?: string;
  avatar?: string;
  coverImage?: string;
  headline?: string;
  location?: string;
  bio?: string;
  category?: string;
  subCategory?: string;
  skills?: string[];
  hourlyRate?: number;
  yearsOfExperience?: number;
  availabilityStatus?: AvailabilityStatus;
  hoursPerWeekAvailable?: number;
  workingDays?: string[];
  workingHours?: string;
  level?: "new" | "level_1" | "top_rated";
  referralCode?: string;
  referralBonusBalance?: number;
  referralBonusTotal?: number;
  videoIntro?: string;
  totalHoursWorked?: number;
  onTimeDeliveryPercent?: number;
  responseTimeLabel?: string;
  phone?: string;
  resumeUrl?: string;
  resumeUpdatedAt?: string;
  lastActiveAt?: string;
  savedJobs?: string[];
  savedProjects?: string[];
  savedServices?: string[];
  savedFreelancers?: string[];
  savedContests?: string[];
  savedInfluencers?: string[];
  savedCampaigns?: string[];
  portfolioItems?: PortfolioItem[];
  payoutDetails?: PayoutDetails;
  storageUsedBytes?: number;
  kycStatus?: KycStatus;
  kycDocuments?: { url: string; name: string }[];
  kycSubmittedAt?: string;
  kycReviewNote?: string;
  isPhoneVerified?: boolean;
  faceVerificationStatus?: KycStatus;
  faceVerificationSelfie?: string;
  faceVerificationSubmittedAt?: string;
  faceVerificationReviewNote?: string;
  addressVerificationStatus?: KycStatus;
  addressVerificationDocuments?: { url: string; name: string }[];
  addressVerificationSubmittedAt?: string;
  addressVerificationReviewNote?: string;
  bankVerificationStatus?: KycStatus;
  bankVerificationDocuments?: { url: string; name: string }[];
  bankVerificationSubmittedAt?: string;
  bankVerificationReviewNote?: string;
  profileViews?: number;
  investmentFocus?: string[];
  ticketSizeMin?: number;
  ticketSizeMax?: number;
  portfolioCompanyCount?: number;
  fundName?: string;
  fundSize?: number;
  preferredStages?: StartupStage[];
  expertise?: string[];
  sessionRate?: number;
  sessionFormat?: MentorSessionFormat;
  organizationName?: string;
  partnerType?: PartnerType;
  programDetails?: string;
  startupsSupportedCount?: number;
  applicationLink?: string;
  companyName?: string;
  companySize?: CompanySize;
  companyRegistrationNumber?: string;
  company?: string | null;
  linkedIn?: string;
  industries?: string[];
  pastStartupsCount?: number;
  experience?: ExperienceEntry[];
  education?: EducationEntry[];
  achievements?: AchievementEntry[];
  languages?: string[];
  dateOfBirth?: string;
  nationality?: string;
  educationLevel?: string;
  roleTags?: string[];
  lookingFor?: string[];
  socialLinks?: SocialLinks;
  rating?: number;
  reviewCount?: number;
  isEmailVerified: boolean;
  isProfileComplete: boolean;
  isBanned?: boolean;
  isDeactivated?: boolean;
  emailNotificationsEnabled?: boolean;
  createdAt: string;
}
