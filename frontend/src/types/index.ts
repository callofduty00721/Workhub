export type UserRole =
  | "super_admin"
  | "founder"
  | "freelancer"
  | "employer"
  | "investor"
  | "mentor"
  | "partner"
  | "client";

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
  image?: string;
  link?: string;
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
  role: UserRole;
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
  portfolioItems?: PortfolioItem[];
  investmentFocus?: string[];
  ticketSizeMin?: number;
  ticketSizeMax?: number;
  portfolioCompanyCount?: number;
  expertise?: string[];
  sessionRate?: number;
  organizationName?: string;
  partnerType?: PartnerType;
  companyName?: string;
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
  createdAt: string;
}

export type StartupStage = "idea" | "pre_seed" | "seed" | "series_a" | "series_b" | "growth";

export interface TeamMember {
  name: string;
  role: string;
  bio?: string;
  linkedin?: string;
  avatar?: string;
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

export interface Paginated<T> {
  data: T[];
  pagination: { page: number; limit: number; total: number; pages: number };
}

export type JobType = "full_time" | "part_time" | "contract" | "internship" | "freelance";
export type ExperienceLevel = "entry" | "mid" | "senior" | "lead";

export interface Job {
  _id: string;
  employer: { _id: string; name: string; avatar?: string } | string;
  title: string;
  companyName: string;
  description: string;
  responsibilities?: string;
  requirements?: string;
  type: JobType;
  experienceLevel: ExperienceLevel;
  skills: string[];
  location: string;
  isRemote: boolean;
  salaryMin: number;
  salaryMax: number;
  currency: string;
  status: "open" | "closed" | "draft";
  applicationsCount: number;
  createdAt: string;
}

export type ApplicationStatus = "applied" | "shortlisted" | "interview" | "rejected" | "hired" | "withdrawn";

export interface Application {
  _id: string;
  job: Job | string;
  applicant: { _id: string; name: string; avatar?: string; email?: string; headline?: string; location?: string } | string;
  coverLetter?: string;
  resumeUrl?: string;
  proposedRate?: number;
  deliveryDays?: number;
  status: ApplicationStatus;
  withdrawnAt?: string;
  createdAt: string;
}

export type ContestStatus = "open" | "judging" | "closed";

export interface Contest {
  _id: string;
  client: { _id: string; name: string; avatar?: string; email?: string } | string;
  title: string;
  description: string;
  category: string;
  skills: string[];
  prizeAmount: number;
  currency: string;
  deadline: string;
  status: ContestStatus;
  entriesCount: number;
  winnerEntry?: string;
  createdAt: string;
}

export interface ContestEntry {
  _id: string;
  contest: Contest | string;
  freelancer: { _id: string; name: string; avatar?: string; email?: string; headline?: string; location?: string } | string;
  title: string;
  description: string;
  fileUrl?: string;
  isWinner: boolean;
  createdAt: string;
}

export interface Service {
  _id: string;
  freelancer: { _id: string; name: string; avatar?: string; rating?: number; reviewCount?: number } | string;
  title: string;
  description: string;
  category: string;
  subCategory?: string;
  priceType: "fixed" | "hourly";
  price: number;
  deliveryDays: number;
  skills: string[];
  images?: string[];
  status: "active" | "paused";
  ordersCount: number;
  rating: number;
  reviewCount: number;
  createdAt: string;
}

export interface FreelancerSummary {
  _id: string;
  name: string;
  avatar?: string;
  headline?: string;
  location?: string;
  category?: string;
  subCategory?: string;
  skills: string[];
  hourlyRate: number;
  rating: number;
  reviewCount: number;
  yearsOfExperience: number;
}

export interface Conversation {
  _id: string;
  participants: { _id: string; name: string; avatar?: string; role: UserRole }[];
  lastMessage: string;
  lastMessageAt: string;
}

export interface Message {
  _id: string;
  conversation: string;
  sender: string;
  text: string;
  readBy: string[];
  createdAt: string;
}

export interface AdminStats {
  totalUsers: number;
  totalStartups: number;
  totalJobs: number;
  totalServices: number;
  totalContests: number;
  roleBreakdown: Record<UserRole, number>;
}

export interface FlaggedStartup {
  startupId: string;
  name: string;
  founder: { _id: string; name: string; email: string } | null;
  status?: string;
  isSuspended?: boolean;
  reportCount: number;
  reports: { user: { _id: string; name: string; email: string }; reason: string; createdAt: string }[];
  autoFlagged: boolean;
  autoReason: string | null;
  autoCount?: number;
}

export interface AdminVerificationRequest {
  _id: string;
  startupId: string;
  startupName: string;
  founder: { _id: string; name: string; avatar?: string; email: string } | null;
  type: VerificationRequestType;
  documents: VerificationRequestDoc[];
  note?: string;
  submittedAt: string;
}

export type PartnerType = "accelerator" | "incubator" | "government" | "ngo" | "service_provider";

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
  yearsOfExperience: number;
  rating: number;
  reviewCount: number;
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

export type SessionStatus = "requested" | "confirmed" | "completed" | "cancelled";

export interface MentorSession {
  _id: string;
  mentor: { _id: string; name: string; avatar?: string; headline?: string } | string;
  requester: { _id: string; name: string; avatar?: string; headline?: string } | string;
  topic: string;
  message?: string;
  preferredTime?: string;
  status: SessionStatus;
  createdAt: string;
}

export type NotificationType =
  | "startup_follow"
  | "startup_interest"
  | "job_application"
  | "application_status"
  | "new_message"
  | "session_request"
  | "session_status"
  | "review_received"
  | "system";

export interface AppNotification {
  _id: string;
  user: string;
  type: NotificationType;
  title: string;
  message: string;
  link: string;
  isRead: boolean;
  createdAt: string;
}

export interface Review {
  _id: string;
  reviewer: { _id: string; name: string; avatar?: string };
  targetType: "user" | "service" | "startup";
  targetId: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export type PlanId = "free" | "starter" | "professional" | "enterprise";

export interface Plan {
  id: PlanId;
  name: string;
  priceInInr: number;
  features: string[];
}

export interface Subscription {
  _id: string;
  plan: PlanId;
  provider: "razorpay" | "stripe";
  status: "pending" | "active" | "failed" | "cancelled" | "expired";
  amount: number;
  currency: string;
  startedAt?: string;
  expiresAt?: string;
}

export type PaymentType = "gig_order" | "job_hire" | "contest_prize";

export type DisputeStatus = "none" | "raised" | "refunded" | "rejected";

export interface Payment {
  _id: string;
  payer: { _id: string; name: string; avatar?: string; email?: string } | string;
  payee: { _id: string; name: string; avatar?: string; email?: string } | string;
  type: PaymentType;
  amount: number;
  currency: string;
  status: "pending" | "paid" | "failed" | "refunded" | "partially_refunded";
  refundedAmount?: number;
  disputeStatus?: DisputeStatus;
  disputeReason?: string;
  disputeResolutionNote?: string;
  service?: string;
  application?: string;
  contest?: string;
  contestEntry?: string;
  note?: string;
  createdAt: string;
}

export interface EarningsSummary {
  totalEarnings: number;
  byType: Partial<Record<PaymentType, number>>;
  payments: Payment[];
  pagination: { page: number; limit: number; total: number; pages: number };
}
