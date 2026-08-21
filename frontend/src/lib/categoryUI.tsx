import { Rocket, Briefcase, Building2 } from "lucide-react";
import type { RoleCategory } from "@/types";

// Shared visual language for the category picker — used by Explore.tsx (the
// first-time onboarding landing page) and SelectCategory.tsx/SelectRoles.tsx
// (the "add another role later" flow from the navbar). Kept in one place so
// both surfaces look and feel identical instead of drifting apart.
export const CATEGORY_OPTIONS: { value: RoleCategory; desc: string; icon: typeof Rocket }[] = [
  { value: "talent", desc: "Find gigs, jobs, or grow as a creator", icon: Briefcase },
  { value: "hiring", desc: "Hire freelancers or full-time employees", icon: Building2 },
  { value: "startup", desc: "Build, invest in, or support startups", icon: Rocket },
];

// One accent per category — echoes the GrowHive mark (teal/emerald "Grow" +
// orange "Hive"), plus violet for Startup Ecosystem as a third, distinct
// identity. Scoped to this picker rather than changing --primary globally.
export const CATEGORY_STYLES: Record<
  RoleCategory,
  { iconBg: string; iconColor: string; border: string; tint: string; ring: string; gradient: string; glow: string }
> = {
  talent: {
    iconBg: "bg-teal-100 dark:bg-teal-500/15",
    iconColor: "text-teal-600 dark:text-teal-400",
    border: "border-teal-500",
    tint: "bg-teal-50 dark:bg-teal-500/10",
    ring: "ring-teal-500/30",
    gradient: "from-teal-500 to-emerald-500",
    glow: "shadow-[0_16px_40px_-20px_rgba(20,184,166,0.55)]",
  },
  hiring: {
    iconBg: "bg-amber-100 dark:bg-amber-500/15",
    iconColor: "text-amber-600 dark:text-amber-400",
    border: "border-amber-500",
    tint: "bg-amber-50 dark:bg-amber-500/10",
    ring: "ring-amber-500/30",
    gradient: "from-amber-500 to-orange-500",
    glow: "shadow-[0_16px_40px_-20px_rgba(245,158,11,0.55)]",
  },
  startup: {
    iconBg: "bg-violet-100 dark:bg-violet-500/15",
    iconColor: "text-violet-600 dark:text-violet-400",
    border: "border-violet-500",
    tint: "bg-violet-50 dark:bg-violet-500/10",
    ring: "ring-violet-500/30",
    gradient: "from-violet-500 to-purple-500",
    glow: "shadow-[0_16px_40px_-20px_rgba(139,92,246,0.55)]",
  },
};
