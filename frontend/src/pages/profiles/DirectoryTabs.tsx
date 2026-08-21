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

export function DirectoryTabs() {
  return (
    <div className="sticky top-16 z-30 bg-white py-2">
      <div className="container flex justify-center">
        <div className="flex w-full max-w-3xl gap-1 rounded-xl border border-neutral-200 bg-neutral-50 p-1.5 sm:gap-1.5">
          {TABS.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              aria-label={tab.label}
              className={({ isActive }) =>
                cn(
                  "flex min-w-0 flex-1 items-center justify-center gap-1 rounded-lg px-1.5 py-2 text-[11px] font-medium transition-all sm:gap-1.5 sm:px-3 sm:py-2.5 sm:text-sm lg:px-6 lg:text-base",
                  isActive ? "bg-[#171717] text-white" : "text-neutral-500 hover:bg-white hover:text-neutral-900"
                )
              }
            >
              <tab.icon className="h-4 w-4 shrink-0" />
              {/* Icon-only below sm (5 tabs in one row leaves no room for
                  text at mobile widths — see MarketplaceTabs.tsx's identical
                  reasoning for 4 tabs). Short label from sm, full label only
                  from lg where there's room for "Influencers" alongside the
                  other four. */}
              <span className="hidden truncate sm:inline lg:hidden">{tab.shortLabel}</span>
              <span className="hidden truncate lg:inline">{tab.label}</span>
            </NavLink>
          ))}
        </div>
      </div>
    </div>
  );
}
