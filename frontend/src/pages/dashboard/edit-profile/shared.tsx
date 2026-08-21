import { ShieldCheck, Clock, ShieldAlert } from "lucide-react";
import type { PartnerType, ExperienceEntry, EducationEntry, AchievementEntry, PortfolioItem, StartupStage, CompanySize } from "@/types";

export const EMPTY_EXPERIENCE: ExperienceEntry = { title: "", company: "", location: "", startLabel: "", endLabel: "Present", description: "" };
export const EMPTY_EDUCATION: EducationEntry = { degree: "", institution: "", startLabel: "", endLabel: "" };
export const EMPTY_ACHIEVEMENT: AchievementEntry = { title: "", description: "", dateLabel: "" };
export const EMPTY_PORTFOLIO_ITEM: PortfolioItem = {
  title: "",
  description: "",
  images: [],
  video: "",
  pdf: "",
  websiteLink: "",
  githubLink: "",
  liveDemoLink: "",
  tags: [],
  clientName: "",
  projectRole: "",
};
export const TYPE_LABELS: Record<string, string> = {
  gig_order: "Gig Order",
  job_hire: "Job / Project",
  contest_prize: "Contest Prize",
  campaign: "Influencer Campaign",
};
export const WORKING_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// Shared pill for the 4-state unverified/pending/verified/rejected flows below,
// plus a simpler boolean form for email/phone (which have no admin review step).
export function VerificationStatusPill({ status, verified }: { status?: "unverified" | "pending" | "verified" | "rejected"; verified?: boolean }) {
  const resolved = status ?? (verified ? "verified" : "unverified");
  if (resolved === "verified") {
    return (
      <span className="flex items-center gap-1 rounded-full bg-success/10 px-3 py-1 text-xs font-medium text-success">
        <ShieldCheck className="h-3.5 w-3.5" /> Verified
      </span>
    );
  }
  if (resolved === "pending") {
    return (
      <span className="flex items-center gap-1 rounded-full bg-warning/10 px-3 py-1 text-xs font-medium text-warning">
        <Clock className="h-3.5 w-3.5" /> Under Review
      </span>
    );
  }
  if (resolved === "rejected") {
    return (
      <span className="flex items-center gap-1 rounded-full bg-danger/10 px-3 py-1 text-xs font-medium text-danger">
        <ShieldAlert className="h-3.5 w-3.5" /> Rejected
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
      <ShieldAlert className="h-3.5 w-3.5" /> Not Verified
    </span>
  );
}

// "9:00 AM - 6:00 PM" (display string, what's actually saved) <-> "09:00"/"18:00"
// (24h values <input type="time"> needs) — converts between the two so the
// picker can be pre-filled from an existing profile and still save the same
// human-readable format shown elsewhere.
export function to24Hour(label: string): string {
  const match = label.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!match) return "";
  let [, h, m, ampm] = match;
  let hour = Number(h);
  if (ampm.toUpperCase() === "PM" && hour !== 12) hour += 12;
  if (ampm.toUpperCase() === "AM" && hour === 12) hour = 0;
  return `${String(hour).padStart(2, "0")}:${m}`;
}

export function to12Hour(value: string): string {
  if (!value) return "";
  const [h, m] = value.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${ampm}`;
}

// 30-minute-increment options for the Working Hours dropdowns — { value:
// "09:00" (24h, used internally) label: "9:00 AM" (shown in the list) }.
export const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
  const value = `${String(Math.floor(i / 2)).padStart(2, "0")}:${i % 2 === 0 ? "00" : "30"}`;
  return { value, label: to12Hour(value) };
});

export const STAGE_OPTIONS: { value: StartupStage; label: string }[] = [
  { value: "idea", label: "Idea" },
  { value: "pre_seed", label: "Pre-Seed" },
  { value: "seed", label: "Seed" },
  { value: "series_a", label: "Series A" },
  { value: "series_b", label: "Series B" },
  { value: "growth", label: "Growth" },
];

export const COMPANY_SIZES: CompanySize[] = ["1-10", "11-50", "51-200", "201-500", "500+"];

export const PARTNER_TYPES: { value: PartnerType; label: string }[] = [
  { value: "agency", label: "Agency" },
  { value: "company", label: "Company" },
  { value: "consultant", label: "Consultant" },
  { value: "service_provider", label: "Service Provider" },
  { value: "technology_partner", label: "Technology Partner" },
  { value: "strategic_partner", label: "Strategic Partner" },
];

export function splitList(input: string): string[] {
  return input
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}
