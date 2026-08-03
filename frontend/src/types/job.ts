export type JobType = "full_time" | "part_time" | "contract" | "internship" | "freelance";
export type ExperienceLevel = "entry" | "mid" | "senior" | "lead";
export const JOB_CATEGORIES = [
  "IT & Software",
  "Design",
  "Marketing",
  "Sales",
  "Finance",
  "HR",
  "Operations",
  "Customer Support",
  "Engineering",
  "Legal",
  "Other",
] as const;
export type JobCategory = (typeof JOB_CATEGORIES)[number];

export type JobVisibility = "public" | "invite_only";

export interface JobAttachment {
  key?: string;
  name: string;
}

export interface Job {
  _id: string;
  employer: { _id: string; name: string; avatar?: string; email?: string } | string;
  title: string;
  companyName: string;
  description: string;
  responsibilities?: string;
  requirements?: string;
  type: JobType;
  category: JobCategory;
  experienceLevel: ExperienceLevel;
  role?: string;
  industryType?: string;
  department?: string;
  roleCategory?: string;
  educationUG?: string;
  educationPG?: string;
  openings?: number;
  skills: string[];
  location: string;
  isRemote: boolean;
  salaryMin: number;
  salaryMax: number;
  currency: string;
  status: "open" | "closed" | "draft";
  applicationsCount: number;
  viewsCount: number;
  visibility?: JobVisibility;
  invitedFreelancers?: (string | { _id: string; name: string; avatar?: string; email?: string })[];
  requiresNda?: boolean;
  ndaText?: string;
  ndaAccepted?: boolean;
  attachments?: JobAttachment[];
  createdAt: string;
}

export type ProjectType = "freelance" | "contract";

// Bid-based work — separate from Job (salaried employment). Posted by Client
// accounts; freelancers propose their own rate/delivery time per application
// rather than accepting a fixed salary.
export interface Project {
  _id: string;
  employer: { _id: string; name: string; avatar?: string; email?: string } | string;
  title: string;
  companyName: string;
  description: string;
  requirements?: string;
  type: ProjectType;
  category?: string;
  subCategory?: string;
  skills: string[];
  location: string;
  isRemote: boolean;
  budgetMin: number;
  budgetMax: number;
  expectedDeliveryDays?: number;
  currency: string;
  status: "open" | "closed" | "draft";
  applicationsCount: number;
  viewsCount: number;
  visibility?: JobVisibility;
  invitedFreelancers?: (string | { _id: string; name: string; avatar?: string; email?: string })[];
  requiresNda?: boolean;
  ndaText?: string;
  ndaAccepted?: boolean;
  attachments?: JobAttachment[];
  createdAt: string;
}

export const CAMPAIGN_PLATFORMS = ["instagram", "youtube", "linkedin", "twitter", "facebook", "other"] as const;
export type CampaignPlatform = (typeof CAMPAIGN_PLATFORMS)[number];

// A brand's influencer-marketing brief — shaped like Job (employer/
// companyName/location/status/applicationsCount/viewsCount) so it plugs into
// the same Application flow (status, viewedAt, contract, withdraw) via
// Application.onModel="Campaign".
export interface Campaign {
  _id: string;
  employer: { _id: string; name: string; avatar?: string; email?: string } | string;
  title: string;
  companyName: string;
  description: string;
  platform: CampaignPlatform;
  deliverables?: string;
  niche?: string;
  location: string;
  budgetMin: number;
  budgetMax: number;
  currency: string;
  status: "open" | "closed" | "draft";
  applicationsCount: number;
  viewsCount: number;
  createdAt: string;
}

export interface JobAccessLogEntry {
  _id: string;
  job: string;
  user: { _id: string; name: string; avatar?: string } | string;
  action: "viewed_details" | "accepted_nda" | "viewed_attachment";
  attachmentName?: string;
  ip?: string;
  userAgent?: string;
  createdAt: string;
}

export type ApplicationStatus = "applied" | "shortlisted" | "interview" | "rejected" | "hired" | "withdrawn";

export interface Application {
  _id: string;
  job: Job | Project | Campaign | string;
  onModel?: "Job" | "Project" | "Campaign";
  applicant: { _id: string; name: string; avatar?: string; email?: string; headline?: string; location?: string } | string;
  coverLetter?: string;
  resumeUrl?: string;
  proposedRate?: number;
  deliveryDays?: number;
  status: ApplicationStatus;
  withdrawnAt?: string;
  viewedAt?: string;
  interview?: {
    scheduledAt?: string;
    mode?: "video" | "in_person" | "phone";
    meetingLink?: string;
    location?: string;
    note?: string;
    status?: "scheduled" | "confirmed" | "cancelled";
  };
  contract?: {
    text?: string;
    employerSignedAt?: string;
    employerSignatureName?: string;
    freelancerSignedAt?: string;
    freelancerSignatureName?: string;
  };
  createdAt: string;
}
