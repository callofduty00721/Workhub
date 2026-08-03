import { z } from "zod";
import type { Startup } from "@/types";

export const STAGES = ["idea", "pre_seed", "seed", "series_a", "series_b", "growth"] as const;
export const OPEN_ROLE_TYPES = ["full_time", "part_time"] as const;
export const WORK_MODES = ["on_site", "remote", "hybrid"] as const;
export const PRODUCT_STATUSES = ["live", "beta", "coming_soon"] as const;
export const PRODUCT_STATUS_LABELS: Record<(typeof PRODUCT_STATUSES)[number], string> = {
  live: "Live",
  beta: "Beta",
  coming_soon: "Coming Soon",
};
export const DOCUMENT_CATEGORIES = ["Legal & Registration", "Financials", "Business Plan", "Pitch Deck", "Product", "Other"] as const;
export const INCORPORATION_TYPES = ["Not Registered", "Sole Proprietorship", "Partnership", "LLP", "Private Limited", "Public Limited", "Other"] as const;

export const STEPS = [
  { id: 1, title: "Overview", desc: "Story, problem/solution and business plan" },
  { id: 2, title: "Team", desc: "Team members and open roles" },
  { id: 3, title: "Funding & Needs", desc: "Funding requirement and fund usage" },
  { id: 4, title: "Product / Plan", desc: "Product, roadmap and market opportunity" },
  { id: 5, title: "Documents", desc: "Media, links and documents" },
] as const;

// Stage-specific guidance shown at the top of each step — what an idea-stage
// founder should focus on is different from what a Series A founder should,
// so the same 5 steps carry different framing depending on the selected stage.
export const STAGE_TIPS: Record<(typeof STAGES)[number], Partial<Record<(typeof STEPS)[number]["id"], string>>> = {
  idea: {
    1: "Idea stage tip: focus on the problem, who it's for, and your proposed solution — that's what co-founders and mentors evaluate first.",
    2: "List the co-founder roles you're looking for (e.g. Technical, Business) — team-building is the main goal at this stage.",
    3: "Funding is optional right now. Only fill this in if you're already open to early investor conversations.",
    4: "Keep this high-level — a rough MVP plan and market opportunity is enough, detailed traction isn't expected yet.",
  },
  pre_seed: {
    1: "Add any early validation you have — waitlist signups, pilot users, or informal feedback — alongside the problem/solution.",
    2: "Show your core team as it stands today — early-stage investors weigh the founding team heavily.",
    3: "Clearly state your funding ask and how you'll use it — this is what pre-seed investors look at first.",
    4: "Show your MVP/prototype status and any early market signal you've picked up.",
  },
  seed: {
    1: "Fill in real traction stats (users, revenue, growth) and milestones — this is where a seed pitch is won or lost.",
    2: "Show team size and the key roles you still need to fill.",
    3: "Be precise on funding goal, minimum investment, and duration — this is a formal round.",
    4: "Go deeper on market opportunity and competitive advantage — investors expect specifics here.",
  },
  series_a: {
    1: "Lead with revenue/ARR and growth-rate numbers — Series A investors are validating a proven business model.",
    2: "Highlight your leadership team and any key open roles for scaling.",
    3: "Be specific on round size and investment terms — this is evaluated by professional investors.",
    4: "Market size (TAM/SAM) and your competitive moat should be strongly established here.",
  },
  series_b: {
    1: "Focus on scale metrics — revenue growth, retention, and expansion — over the original idea narrative.",
    2: "Show your leadership bench strength and org structure as you scale.",
    3: "Round size, use of funds for scaling, and terms should be precise and investor-ready.",
    4: "Show market leadership position and how your moat has widened since Series A.",
  },
  growth: {
    1: "Focus on scale metrics and market leadership — the story should be about proven, repeatable growth.",
    2: "Show organizational depth across leadership and key functions.",
    3: "Round size and terms should reflect a mature, data-backed ask.",
    4: "Demonstrate category leadership and durable competitive advantage.",
  },
};

export const schema = z.object({
  name: z.string().min(2, "Startup name is required").max(100),
  tagline: z.string().min(5, "Tagline is required").max(120),
  industry: z.string().min(1, "Select an industry"),
  subIndustry: z.string().optional(),
  stage: z.enum(STAGES),
  incorporationType: z.string().optional(),
  registrationNumber: z.string().optional(),
  foundedDate: z.string().optional(),
  country: z.string().min(1, "Select a country"),
  state: z.string().min(1, "State is required"),
  city: z.string().min(1, "City is required"),
  description: z.string().min(20, "Description should be at least 20 characters").max(500),
  problemStatement: z.string().optional(),
  solution: z.string().optional(),
  targetAudience: z.string().optional(),
  missionStatement: z.string().optional(),
  highlightsText: z.string().optional(),
  website: z.string().optional(),
  socialLinkedin: z.string().optional(),
  socialTwitter: z.string().optional(),
  socialFacebook: z.string().optional(),
  socialInstagram: z.string().optional(),

  team: z.array(
    z.object({
      name: z.string().min(1, "Name required"),
      role: z.string().min(1, "Role required"),
      bio: z.string().optional(),
      linkedin: z.string().optional(),
      skills: z.string().optional(),
      joinedDate: z.string().optional(),
    })
  ),

  openRoles: z.array(
    z.object({
      title: z.string().min(1, "Role title required"),
      type: z.enum(OPEN_ROLE_TYPES),
      workMode: z.enum(WORK_MODES),
      description: z.string().optional(),
      requiredSkills: z.string().optional(),
      requiredExperience: z.string().optional(),
      salary: z.string().optional(),
      responsibilitiesText: z.string().optional(),
    })
  ),

  tractionStats: z.array(z.object({ label: z.string().min(1, "Label required"), value: z.string().min(1, "Value required") })),
  businessPlan: z.array(z.object({ label: z.string().min(1, "Label required"), value: z.string().min(1, "Value required") })),
  milestones: z.array(
    z.object({ title: z.string().min(1, "Milestone title required"), description: z.string().optional(), date: z.string().min(1, "Date required") })
  ),

  fundingNeeded: z.coerce.number().min(0).optional(),
  fundingRaised: z.coerce.number().min(0).optional(),
  fundingTypeText: z.string().optional(),
  investmentType: z.string().optional(),
  minimumInvestment: z.coerce.number().min(0).optional(),
  fundingDurationMonths: z.coerce.number().min(0).optional(),
  expectedClosingDate: z.string().optional(),
  fundUsagePlan: z.array(
    z.object({ category: z.string().min(1, "Category required"), description: z.string().optional(), estimatedCost: z.coerce.number().min(0) })
  ),
  expectedOutcomes: z.array(z.object({ label: z.string().min(1, "Label required"), value: z.string().min(1, "Value required") })),
  whyInvestText: z.string().optional(),

  products: z.array(
    z.object({
      name: z.string().min(1, "Product name required"),
      description: z.string().optional(),
      images: z.array(z.object({ url: z.string() })),
      url: z.string().optional(),
      price: z.string().optional(),
      status: z.enum(PRODUCT_STATUSES).default("live"),
      featuresText: z.string().optional(),
      tagsText: z.string().optional(),
    })
  ),
  productHighlightsText: z.string().optional(),
  howItWorks: z.array(z.object({ title: z.string().min(1, "Step title required"), description: z.string().optional() })),
  planPhases: z.array(
    z.object({ title: z.string().min(1, "Phase title required"), timeframe: z.string().optional(), checklistText: z.string().optional(), estimatedCost: z.coerce.number().min(0) })
  ),
  marketStats: z.array(z.object({ value: z.string().min(1, "Value required"), label: z.string().min(1, "Label required") })),
  competitiveAdvantageText: z.string().optional(),
  whyProductText: z.string().optional(),

  documents: z.array(
    z.object({
      name: z.string().min(1, "Document name required"),
      description: z.string().optional(),
      url: z.string().min(1, "Upload a file"),
      category: z.enum(DOCUMENT_CATEGORIES),
      fileSize: z.string().optional(),
    })
  ),
  logo: z.string().optional(),
  coverImage: z.string().optional(),
  pitchDeckUrl: z.string().optional(),
});

export type FormValues = z.infer<typeof schema>;

export const STEP_FIELDS: Record<number, (keyof FormValues)[]> = {
  1: [
    "name", "tagline", "industry", "stage", "country", "state", "city", "description",
    "problemStatement", "solution", "targetAudience",
    "missionStatement", "highlightsText", "businessPlan", "tractionStats", "milestones",
  ],
  2: ["team", "openRoles"],
  3: ["fundingNeeded", "fundingRaised", "fundUsagePlan", "expectedOutcomes"],
  4: ["products", "howItWorks", "planPhases", "marketStats", "competitiveAdvantageText", "whyProductText"],
  5: ["documents", "website"],
};

export function splitLines(text?: string) {
  return (text ?? "").split("\n").map((s) => s.trim()).filter(Boolean);
}
export function joinLines(items?: string[]) {
  return (items ?? []).join("\n");
}
export function splitCommas(text?: string) {
  return (text ?? "").split(",").map((s) => s.trim()).filter(Boolean);
}
export function joinCommas(items?: string[]) {
  return (items ?? []).join(", ");
}

export const emptyDefaults: FormValues = {
  name: "",
  tagline: "",
  industry: "",
  subIndustry: "",
  stage: "idea",
  incorporationType: "",
  registrationNumber: "",
  foundedDate: "",
  country: "India",
  state: "",
  city: "",
  description: "",
  problemStatement: "",
  solution: "",
  targetAudience: "",
  missionStatement: "",
  highlightsText: "",
  website: "",
  socialLinkedin: "",
  socialTwitter: "",
  socialFacebook: "",
  socialInstagram: "",
  team: [{ name: "", role: "", bio: "", linkedin: "", skills: "", joinedDate: "" }],
  openRoles: [],
  tractionStats: [],
  businessPlan: [],
  milestones: [],
  fundingNeeded: 0,
  fundingRaised: 0,
  fundingTypeText: "",
  investmentType: "",
  minimumInvestment: 0,
  fundingDurationMonths: 0,
  expectedClosingDate: "",
  fundUsagePlan: [],
  expectedOutcomes: [],
  whyInvestText: "",
  products: [],
  productHighlightsText: "",
  howItWorks: [],
  planPhases: [],
  marketStats: [],
  competitiveAdvantageText: "",
  whyProductText: "",
  documents: [],
  logo: "",
  coverImage: "",
  pitchDeckUrl: "",
};

export function buildPayload(values: FormValues, status: "draft" | "published"): Partial<Startup> {
  return {
    name: values.name,
    tagline: values.tagline,
    industry: values.industry,
    subIndustry: values.subIndustry,
    stage: values.stage,
    incorporationType: values.incorporationType,
    registrationNumber: values.registrationNumber,
    foundedDate: values.foundedDate || undefined,
    location: [values.city, values.state, values.country].filter(Boolean).join(", "),
    description: values.description,
    problemStatement: values.problemStatement,
    solution: values.solution,
    targetAudience: values.targetAudience,
    missionStatement: values.missionStatement,
    highlights: splitLines(values.highlightsText),
    website: values.website,
    socialLinks: {
      linkedin: values.socialLinkedin ?? "",
      twitter: values.socialTwitter ?? "",
      facebook: values.socialFacebook ?? "",
      instagram: values.socialInstagram ?? "",
    },
    team: values.team.map((t) => ({
      ...t,
      skills: (t.skills ?? "").split(",").map((s) => s.trim()).filter(Boolean),
      joinedDate: t.joinedDate || undefined,
    })),
    openRoles: values.openRoles.map((r) => ({
      title: r.title,
      type: r.type,
      workMode: r.workMode,
      description: r.description,
      requiredSkills: (r.requiredSkills ?? "").split(",").map((s) => s.trim()).filter(Boolean),
      requiredExperience: r.requiredExperience ?? "",
      salary: r.salary ?? "",
      responsibilities: splitLines(r.responsibilitiesText),
    })),
    tractionStats: values.tractionStats,
    businessPlan: values.businessPlan,
    milestones: values.milestones,
    fundingNeeded: values.fundingNeeded ?? 0,
    fundingRaised: values.fundingRaised ?? 0,
    fundingType: splitCommas(values.fundingTypeText),
    investmentType: values.investmentType,
    minimumInvestment: values.minimumInvestment ?? 0,
    fundingDurationMonths: values.fundingDurationMonths ?? 0,
    expectedClosingDate: values.expectedClosingDate || undefined,
    fundUsagePlan: values.fundUsagePlan,
    expectedOutcomes: values.expectedOutcomes,
    whyInvest: splitLines(values.whyInvestText),
    products: values.products.map((p) => ({
      name: p.name,
      description: p.description,
      url: p.url,
      price: p.price,
      status: p.status,
      features: splitLines(p.featuresText),
      tags: splitCommas(p.tagsText),
      images: p.images.map((i) => i.url).filter(Boolean),
    })),
    productHighlights: splitLines(values.productHighlightsText),
    howItWorks: values.howItWorks,
    planPhases: values.planPhases.map((p) => ({ title: p.title, timeframe: p.timeframe, checklist: splitLines(p.checklistText), estimatedCost: p.estimatedCost })),
    marketStats: values.marketStats,
    competitiveAdvantage: splitLines(values.competitiveAdvantageText),
    whyProduct: splitLines(values.whyProductText),
    documents: values.documents,
    logo: values.logo,
    coverImage: values.coverImage,
    pitchDeckUrl: values.pitchDeckUrl,
    status,
  };
}
