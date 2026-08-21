import { useState } from "react";
import { useSearchParams } from "react-router-dom";

import MarketplaceTabs from "@/roles/freelancer/components/MarketplaceTabs";
import { FreelancerMarketplace } from "@/roles/freelancer/components/marketplace/FreelancerMarketplace";
import { GigMarketplace } from "@/pages/gigs/marketplace/GigMarketplace";
import { ProjectMarketplace } from "@/pages/projects/marketplace/ProjectMarketplace";
import { ContestMarketplace } from "@/pages/contests/marketplace/ContestMarketplace";

type SectionTab = "freelancers" | "services" | "projects" | "contests";
const SECTION_TABS: SectionTab[] = ["freelancers", "services", "projects", "contests"];

export default function FreelancerList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get("tab");
  const [tab, setTabState] = useState<SectionTab>(SECTION_TABS.includes(initialTab as SectionTab) ? (initialTab as SectionTab) : "freelancers");

  // Writes the active tab back to the URL — previously this only ever read
  // ?tab= once on mount, so switching tabs left the URL out of sync.
  const setTab = (next: SectionTab) => {
    setTabState(next);
    setSearchParams((prev) => {
      const nextParams = new URLSearchParams(prev);
      if (next === "freelancers") nextParams.delete("tab");
      else nextParams.set("tab", next);
      return nextParams;
    });
  };

  return (
    <div>
      {/* Section switcher */}
      <div className="sticky top-16 z-30  bg-white py-0">
        <div className="container flex justify-center">
          <MarketplaceTabs tab={tab} setTab={setTab} />
        </div>
      </div>

      {tab === "freelancers" ? (
        <FreelancerMarketplace />
      ) : tab === "services" ? (
        <GigMarketplace />
      ) : tab === "projects" ? (
        <ProjectMarketplace />
      ) : (
        <ContestMarketplace />
      )}
    </div>
  );
}
