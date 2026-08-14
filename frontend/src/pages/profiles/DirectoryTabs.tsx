import { NavLink } from "react-router-dom";
import { Users, Building2, Briefcase, Handshake, Megaphone } from "lucide-react";
import { cn } from "@/lib/utils";

// Same pill-row look as FreelancerList's MarketplaceTabs (rounded-xl
// neutral-50 pill container, active tab as a solid black rounded-lg
// segment) — but route-based via NavLink, not state-based, since
// Influencers/Brands/Agencies/Talent Partners/Campaigns are five different
// list endpoints/routes, not sub-views of one page.
// "Partners" (not "Talent Partners") at every width — same one-line height
// as the other tabs; the full name still appears as the page title.
const TABS = [
  { label: "Influencers", shortLabel: "Creators", to: "/influencers", icon: Users },
  { label: "Brands", shortLabel: "Brands", to: "/brands", icon: Building2 },
  { label: "Agencies", shortLabel: "Agencies", to: "/agencies", icon: Briefcase },
  { label: "Partners", shortLabel: "Partners", to: "/talent-partners", icon: Handshake },
  { label: "Campaigns", shortLabel: "Campaigns", to: "/campaigns", icon: Megaphone },
];

// "dark": premium black+neon variant, used only by the Influencers page —
// Brands/Agencies/Partners/Campaigns keep the original light tab strip.
export function DirectoryTabs({ variant = "default" }: { variant?: "default" | "dark" }) {
  const dark = variant === "dark";
  return (
    <div className={cn("sticky top-16 z-30 border-b py-2", dark ? "border-white/[0.08] bg-black" : "bg-white")}>
      <div className="container flex justify-center">
        <div
          className={cn(
            "flex w-full max-w-3xl gap-1 rounded-xl border p-1.5 sm:gap-1.5",
            dark ? "border-white/[0.08] bg-[#0A0A0A]" : "border-neutral-200 bg-neutral-50"
          )}
        >
          {TABS.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              className={({ isActive }) =>
                cn(
                  "flex flex-1 items-center justify-center gap-1 rounded-lg px-1.5 py-2 text-[11px] font-medium transition-all duration-200 sm:gap-2 sm:px-6 sm:py-2.5 sm:text-base",
                  dark
                    ? isActive
                      ? "bg-gradient-to-b from-[#E8FF25] to-[#22C55E] text-black"
                      : "text-[#A1A1AA] hover:bg-white/5 hover:text-white"
                    : isActive
                      ? "bg-[#171717] text-white"
                      : "text-neutral-500 hover:bg-white hover:text-neutral-900"
                )
              }
            >
              <tab.icon className="h-4 w-4 shrink-0" />
              <span className="sm:hidden">{tab.shortLabel}</span>
              <span className="hidden sm:inline">{tab.label}</span>
            </NavLink>
          ))}
        </div>
      </div>
    </div>
  );
}
