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

// Same "Company Type" categories naukri.com's job filter uses.
export const COMPANY_TYPES = ["Corporate", "Startup", "Foreign MNC", "Indian MNC", "Others"] as const;
export type CompanyType = (typeof COMPANY_TYPES)[number];

// Naukri.com-style industry -> sub-industry map. Mirrors SUB_INDUSTRIES_MAP
// in backend/job.model.js — kept in sync manually, same pattern as
// SERVICE_CATEGORIES/SERVICE_SUBCATEGORIES in lib/mockData.ts.
export const INDUSTRY_SUB_INDUSTRIES: Record<string, string[]> = {
  "Information Technology": [
    "Software Development",
    "SaaS",
    "IT Services",
    "Cloud Computing",
    "AI & Machine Learning",
    "Data Science & Analytics",
    "Cybersecurity",
    "Web Development",
    "Mobile App Development",
    "IT Support",
    "Networking",
    "Blockchain & Web3",
  ],
  Telecommunications: ["Telecom Services", "Mobile Networks", "Internet Services", "Fiber & Broadband", "Network Infrastructure", "Satellite Communication"],
  "Banking & Finance": [
    "Commercial Banking",
    "Investment Banking",
    "NBFC",
    "Microfinance",
    "FinTech",
    "Payments",
    "Stock Broking",
    "Wealth Management",
    "Asset Management",
  ],
  Insurance: ["Life Insurance", "Health Insurance", "General Insurance", "Reinsurance", "Insurance Broking", "InsurTech"],
  "Accounting & Auditing": ["Accounting Services", "Taxation", "Auditing", "Bookkeeping", "Financial Advisory", "Payroll Services"],
  Healthcare: ["Hospitals", "Clinics", "Diagnostics", "Nursing", "Healthcare Services", "HealthTech", "Elder Care", "Dental Care"],
  Pharmaceuticals: ["Pharmaceutical Manufacturing", "Generic Drugs", "Biotechnology", "Clinical Research", "Drug Distribution", "Pharma Retail"],
  "Medical & Biotechnology": ["Medical Devices", "Biotechnology", "Laboratory Services", "Medical Research", "Life Sciences", "Genomics"],
  Education: ["Schools", "Colleges & Universities", "Coaching", "EdTech", "Vocational Training", "Skill Development", "Online Education"],
  Manufacturing: ["Industrial Manufacturing", "Machinery", "Electrical Equipment", "Electronics Manufacturing", "Factory Operations", "Industrial Automation"],
  Automobile: ["Passenger Vehicles", "Commercial Vehicles", "Electric Vehicles", "Auto Components", "Automobile Services", "Automotive Technology"],
  Electronics: ["Consumer Electronics", "Semiconductors", "Embedded Systems", "Electronic Components", "Consumer Appliances"],
  "Textiles & Apparel": ["Textile Manufacturing", "Garments", "Fashion", "Spinning", "Weaving", "Dyeing", "Footwear", "Leather"],
  Chemicals: ["Specialty Chemicals", "Industrial Chemicals", "Petrochemicals", "Paints & Coatings", "Fertilizers", "Chemical Manufacturing"],
  "Food & Beverage": ["Food Processing", "Dairy", "Beverages", "Bakery", "Packaged Foods", "Restaurants", "Food Distribution"],
  Agriculture: ["Farming", "Agribusiness", "AgriTech", "Seeds", "Fertilizers", "Agricultural Equipment", "Organic Farming"],
  "Dairy & Animal Husbandry": ["Dairy Farming", "Milk Processing", "Poultry", "Livestock", "Animal Feed", "Veterinary Services"],
  Construction: ["Residential Construction", "Commercial Construction", "Infrastructure", "Civil Engineering", "Construction Services"],
  "Real Estate": ["Property Development", "Property Management", "Commercial Real Estate", "Residential Real Estate", "Real Estate Brokerage"],
  "Architecture & Design": ["Architecture", "Interior Design", "Landscape Design", "Urban Planning", "Product Design"],
  Retail: ["Supermarkets", "Department Stores", "Fashion Retail", "Electronics Retail", "Jewellery Retail", "FMCG Retail"],
  "E-commerce": ["Online Marketplace", "D2C", "Online Retail", "E-commerce Operations", "E-commerce Logistics"],
  FMCG: ["Personal Care", "Home Care", "Food Products", "Beverages", "Consumer Products"],
  "Logistics & Supply Chain": ["Logistics", "Warehousing", "Supply Chain Management", "Freight", "Courier & Delivery", "3PL"],
  Transportation: ["Road Transport", "Rail Transport", "Public Transport", "Fleet Management", "Taxi & Mobility"],
  "Aviation & Aerospace": ["Airlines", "Airports", "Aviation Services", "Aerospace Manufacturing", "Aircraft Maintenance"],
  "Shipping & Maritime": ["Shipping", "Ports", "Marine Services", "Shipbuilding", "Cargo & Freight"],
  "Travel & Tourism": ["Travel Agencies", "Tour Operators", "Tourism Services", "Travel Technology", "Adventure Tourism"],
  Hospitality: ["Hotels", "Resorts", "Restaurants", "Catering", "Food Services", "Guest Services"],
  "Media & Entertainment": ["Film & TV", "Music", "Digital Media", "News", "Publishing", "Content Production"],
  Gaming: ["Game Development", "Mobile Gaming", "PC Gaming", "Console Gaming", "Esports"],
  "Animation & VFX": ["Animation", "VFX", "3D Design", "Motion Graphics", "Game Art"],
  "Advertising & Marketing": ["Advertising", "Digital Marketing", "SEO", "Social Media Marketing", "Content Marketing", "Performance Marketing"],
  "Public Relations": ["PR Agencies", "Corporate Communications", "Media Relations", "Brand Communications"],
  "Human Resources": ["Recruitment", "Staffing", "HR Consulting", "Payroll", "Learning & Development"],
  "BPO & KPO": ["Customer Support", "Call Centers", "Data Processing", "Back Office", "Knowledge Services", "Technical Support"],
  Consulting: ["Management Consulting", "IT Consulting", "Financial Consulting", "HR Consulting", "Business Consulting"],
  "Legal Services": ["Corporate Law", "Litigation", "Legal Consulting", "Intellectual Property", "Compliance"],
  Energy: ["Power Generation", "Power Distribution", "Renewable Energy", "Solar Energy", "Wind Energy"],
  "Oil & Gas": ["Exploration", "Refining", "Petroleum Products", "Oilfield Services", "Gas Distribution"],
  "Mining & Metals": ["Mining", "Steel", "Aluminium", "Copper", "Mineral Processing", "Metal Manufacturing"],
  "Environmental Services": ["Waste Management", "Recycling", "Water Treatment", "Environmental Consulting", "Sustainability"],
  "Government & Public Administration": ["Central Government", "State Government", "Local Government", "Public Administration", "Public Services"],
  "Defence & Security": ["Defence", "Military Services", "Aerospace Defence", "Private Security", "Security Technology"],
  "NGO & Social Services": ["NGOs", "Social Development", "Community Services", "Non-Profit Organizations", "Humanitarian Services"],
  "Fitness & Wellness": ["Gyms", "Fitness Centers", "Yoga", "Wellness", "Sports Training", "Nutrition"],
  "Beauty & Personal Care": ["Beauty Salons", "Cosmetics", "Skincare", "Haircare", "Personal Grooming"],
  "Fashion & Lifestyle": ["Fashion Design", "Luxury Goods", "Lifestyle Products", "Accessories", "Fashion Retail"],
  "Jewellery & Gems": ["Jewellery Manufacturing", "Jewellery Retail", "Gemstones", "Diamond Industry"],
  "Printing & Publishing": ["Printing", "Digital Printing", "Book Publishing", "Newspaper Publishing", "Packaging Printing"],
  Packaging: ["Flexible Packaging", "Paper Packaging", "Plastic Packaging", "Industrial Packaging"],
  "Furniture & Home": ["Furniture Manufacturing", "Home Decor", "Modular Furniture", "Woodworking", "Interior Products"],
  "Facility Management": ["Building Management", "Housekeeping", "Maintenance", "Property Services"],
  "Security Services": ["Security Guards", "Surveillance", "CCTV", "Security Systems", "Risk Management"],
  "Home Services": ["Cleaning", "Plumbing", "Electrical Services", "Repair & Maintenance", "Home Improvement"],
  "Import & Export": ["Import Trading", "Export Trading", "International Trade", "Customs & Compliance"],
  "Wholesale & Distribution": ["FMCG Distribution", "Industrial Distribution", "Pharmaceutical Distribution", "Consumer Goods Distribution"],
  "Research & Development": ["Scientific Research", "Industrial R&D", "Product Research", "Market Research"],
  "Professional Services": ["Business Services", "Documentation", "Translation", "Outsourcing", "Administrative Services"],
  Other: ["Other Industries", "General Services"],
};
export const INDUSTRY_TYPES = Object.keys(INDUSTRY_SUB_INDUSTRIES);
export type IndustryType = string;

export interface JobAttachment {
  key?: string;
  name: string;
}

export interface Job {
  _id: string;
  employer: { _id: string; name: string; avatar?: string; email?: string; rating?: number; reviewCount?: number } | string;
  title: string;
  companyName: string;
  description: string;
  responsibilities?: string;
  requirements?: string;
  type: JobType;
  category: JobCategory;
  experienceLevel: ExperienceLevel;
  role?: string;
  industryType?: IndustryType | "";
  subIndustry?: string;
  companyType?: CompanyType | "";
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
  // Admin-only moderation data (not selected on any public-facing query) —
  // present on the /admin/jobs response so an admin can see report volume.
  reports?: { user: string; reason: string; createdAt: string }[];
  isDemo?: boolean;
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
  isDemo?: boolean;
  createdAt: string;
}

export const CAMPAIGN_PLATFORMS = ["instagram", "youtube", "linkedin", "twitter", "facebook", "other"] as const;
export type CampaignPlatform = (typeof CAMPAIGN_PLATFORMS)[number];

export const COLLABORATION_TYPES = ["paid", "barter", "affiliate", "hybrid"] as const;
export type CollaborationType = (typeof COLLABORATION_TYPES)[number];

export const PAYMENT_MODES = ["bank_transfer", "upi", "escrow", "other"] as const;
export type PaymentMode = (typeof PAYMENT_MODES)[number];

// A brand's influencer-marketing brief — shaped like Job (employer/
// companyName/location/status/applicationsCount/viewsCount) so it plugs into
// the same Application flow (status, viewedAt, contract, withdraw) via
// Application.onModel="Campaign".
export interface Campaign {
  _id: string;
  // Real, stored, unique reference code (e.g. "CMP-7X9K2M") — assigned once
  // at creation server-side, not derived from _id at display time.
  campaignId?: string;
  employer:
    | {
        _id: string;
        name: string;
        avatar?: string;
        email?: string;
        isVerified?: boolean;
        rating?: number;
        reviewCount?: number;
        role?: string;
        agencyProfile?: { clients?: { clientName: string; logoUrl?: string; description?: string }[] };
      }
    | string;
  // Set when an agency posts this for a client brand it manages (see
  // agencyClient.model.js) — `employer` stays the agency, this is who it's
  // really for.
  onBehalfOf?: { _id: string; name: string; avatar?: string } | string;
  title: string;
  companyName: string;
  description: string;
  // A campaign can run across more than one platform at once — first entry
  // is the "lead" platform wherever only one can be shown (banner color).
  platforms: CampaignPlatform[];
  deliverables?: string;
  niche?: string;
  influencerCategory?: string;
  minFollowers?: number;
  location: string;
  budgetMin: number;
  budgetMax: number;
  currency: string;
  status: "open" | "closed" | "draft";
  applicationsCount: number;
  viewsCount: number;
  // Brand-set targeting/logistics fields — all optional, all filled in by
  // whoever posts the campaign, never inferred or estimated.
  collaboratorsMin?: number;
  collaboratorsMax?: number;
  startDate?: string;
  endDate?: string;
  applicationDeadline?: string;
  targetAgeMin?: number;
  targetAgeMax?: number;
  // A requirement/filter (like minFollowers), not a claim about any specific
  // influencer's actual audience.
  minEngagementRate?: number;
  // The brand's own stated reach goal — same trust level as budgetMin/Max,
  // not a platform-computed estimate.
  estimatedReachMin?: number;
  estimatedReachMax?: number;
  collaborationType?: CollaborationType;
  paymentMode?: PaymentMode;
  highlights?: string[];
  termsAndConditions?: string;
  imageUrl?: string;
  // Admin-only — see campaign.controller.js's toggleCampaignFeatured; a
  // brand can never set this on itself.
  isFeatured?: boolean;
  isDemo?: boolean;
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
  // "invited" = the poster started this application by directly inviting
  // the applicant (see campaignApi.invite), not the applicant applying to
  // an open posting themselves.
  origin?: "applied" | "invited";
  coverLetter?: string;
  resumeUrl?: string;
  proposedRate?: number;
  deliveryDays?: number;
  status: ApplicationStatus;
  withdrawnAt?: string;
  viewedAt?: string;
  lastEditedAt?: string;
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
  // Campaign hires only — set once the brand pays a facilitation fee to
  // settle this hire off-platform instead of through escrow.
  offPlatformSettledAt?: string;
  // Set when the employer asks for a revised rate (see requestRateChange) —
  // cleared the moment the applicant edits their proposal in response.
  negotiationRequest?: {
    message?: string;
    suggestedRate?: number;
    requestedAt: string;
  };
  createdAt: string;
}
