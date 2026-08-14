import { useState, lazy, Suspense, useMemo } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Users, Trophy, ArrowRight } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { FreelancerCard } from "@/roles/freelancer/components/FreelancerCard";
import { ContestCard } from "@/pages/contests/ContestCard";
import { Pagination } from "@/components/shared/Pagination";
import { freelancerApi, type FreelancerSort } from "@/api/freelancers";
import { contestApi } from "@/api/contests";
import PremiumHero from "@/roles/freelancer/components/PremiumHero";
import MarketplaceTabs from "@/roles/freelancer/components/MarketplaceTabs";
import FilterSidebar from "@/roles/freelancer/components/FilterSidebar";
import { CategoryBrowsePanel } from "@/roles/freelancer/components/CategoryBrowsePanel";
import { SERVICE_CATEGORY_NAMES } from "@/lib/mockData";
// Code-split — each tab's browsing/filter logic only downloads once someone
// actually opens that tab, instead of bundling it all into this hub page.
const GigList = lazy(() => import("@/pages/gigs/GigList"));
const ProjectList = lazy(() => import("@/pages/projects/ProjectList"));

type SectionTab = "freelancers" | "services" | "projects" | "contests";
const SECTION_TABS: SectionTab[] = ["freelancers", "services", "projects", "contests"];

// "0-1000" / "2000-" / "any" -> { rateMin, rateMax } — keeps the hero's and
// toolbar's single Budget dropdown wired straight to the real rateMin/rateMax
// query params the backend already supports.
function parseBudget(budget: string): { rateMin?: number; rateMax?: number } {
  if (budget === "any" || !budget) return {};
  const [min, max] = budget.split("-");
  return { rateMin: min ? Number(min) : undefined, rateMax: max ? Number(max) : undefined };
}

export default function FreelancerList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get("tab");
  const [tab, setTabState] = useState<SectionTab>(SECTION_TABS.includes(initialTab as SectionTab) ? (initialTab as SectionTab) : "freelancers");

  // Writes the active tab back to the URL — previously this only ever read
  // ?tab= once on mount, so switching tabs left the URL out of sync. That
  // meant a category picked on, say, the Services tab ended up in a URL with
  // no tab= at all, and a refresh would default back to "freelancers" and
  // misapply that category there instead.
  const setTab = (next: SectionTab) => {
    setTabState(next);
    setSearchParams((prev) => {
      const nextParams = new URLSearchParams(prev);
      if (next === "freelancers") nextParams.delete("tab");
      else nextParams.set("tab", next);
      return nextParams;
    });
  };

  // Each tab keeps its own search text — switching tabs shouldn't carry a
  // freelancer-skill query over into contests, and vice versa.
  const [searchByTab, setSearchByTab] = useState<Record<SectionTab, string>>({
    freelancers: "",
    services: "",
    projects: "",
    contests: "",
  });
  const search = searchByTab[tab];
  const setSearch = (value: string) => setSearchByTab((prev) => ({ ...prev, [tab]: value }));

  // Reads ?category= / ?subCategory= so the navbar's category mega-menu can
  // deep-link straight into a filtered result set, not just the bare page —
  // and writes back to the URL too (via applyCategory below), so the
  // selection survives a refresh, a back-nav, or being shared as a link,
  // instead of only ever being a one-way read on mount.
  const initialCategory = searchParams.get("category");
  const [category, setCategoryState] = useState(initialCategory && SERVICE_CATEGORY_NAMES.includes(initialCategory) ? initialCategory : "all");
  const [subCategory, setSubCategoryState] = useState(searchParams.get("subCategory") ?? "all");

  // Both fields update together in one setSearchParams call — calling it
  // twice back-to-back (once for category, once for subCategory) would have
  // each read the same stale `prev`, so the second call would silently
  // clobber the first.
  const applyCategory = (cat: string, sub: string) => {
    setCategoryState(cat);
    setSubCategoryState(sub);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (cat === "all") next.delete("category");
      else next.set("category", cat);
      if (sub === "all") next.delete("subCategory");
      else next.set("subCategory", sub);
      return next;
    });
  };
  const [location, setLocation] = useState("");
  const [budget, setBudget] = useState("any");
  const [minExperience, setMinExperience] = useState("any");
  const [minRating, setMinRating] = useState("any");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [availability, setAvailability] = useState("any");
  const [sort, setSort] = useState<FreelancerSort>("best_match");
  const [page, setPage] = useState(1);

  const { rateMin, rateMax } = useMemo(() => parseBudget(budget), [budget]);
  const resetPage = () => setPage(1);

  const { data: freelancers, isLoading: loadingFreelancers } = useQuery({
    queryKey: [
      "freelancers",
      { search, category, subCategory, location, rateMin, rateMax, minExperience, minRating, verifiedOnly, availability, sort, page },
    ],
    queryFn: () =>
      freelancerApi.list({
        search: search || undefined,
        category: category === "all" ? undefined : category,
        subCategory: category !== "all" && subCategory !== "all" ? subCategory : undefined,
        location: location || undefined,
        rateMin,
        rateMax,
        minExperience: minExperience === "any" ? undefined : Number(minExperience),
        minRating: minRating === "any" ? undefined : Number(minRating),
        verifiedOnly: verifiedOnly || undefined,
        availability: availability === "any" ? undefined : (availability as "available" | "busy"),
        sort,
        page,
        limit: 12,
      }),
    enabled: tab === "freelancers",
  });

  const { data: contests, isLoading: loadingContests } = useQuery({
    queryKey: ["contests", { search }],
    queryFn: () => contestApi.list({ search: search || undefined, limit: 12 }),
    enabled: tab === "contests",
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    resetPage();
  };

  // Shared by every entry point that can change the category (browse panel,
  // sidebar select) — switching category always clears out a now-irrelevant
  // sub-category from the previous one.
  const selectCategory = (v: string) => {
    applyCategory(v, "all");
    resetPage();
  };
  const selectSubCategory = (cat: string, sub: string) => {
    applyCategory(cat, sub);
    resetPage();
  };
  return (
    <div className="bg-black">
      {/* Section switcher */}
      <div className="sticky top-16 z-30 border-b border-white/[0.08] bg-black py-2">
        <div className="container flex justify-center">
          <MarketplaceTabs tab={tab} setTab={setTab} />
        </div>
      </div>

      {/* Hero — content, search fields, and the real count all adapt to the active tab */}
      <PremiumHero
        tab={tab}
        search={search}
        setSearch={setSearch}
        location={location}
        setLocation={setLocation}
        handleSearch={handleSearch}
        totalCount={
          tab === "freelancers" ? freelancers?.pagination.total ?? 0 : tab === "contests" ? contests?.pagination.total ?? 0 : undefined
        }
      />

      {tab === "freelancers" && (
        <div className="border-b border-white/[0.08] bg-black lg:sticky lg:top-[136px] lg:z-[25]">
          <div className="container">
            <CategoryBrowsePanel
              activeCategory={category}
              onSelectCategory={selectCategory}
              onSelectSubCategory={selectSubCategory}
              onViewAll={selectCategory}
              popup
              variant="dark"
            />
          </div>
        </div>
      )}

      <div className="container py-8">
        {tab === "freelancers" ? (
          <div className="grid grid-cols-1 items-start gap-2 lg:grid-cols-[260px_1fr]">
            <FilterSidebar
              category={category}
              setCategory={selectCategory}
              subCategory={subCategory}
              setSubCategory={(v) => {
                applyCategory(category, v);
                resetPage();
              }}
              minExperience={minExperience}
              setMinExperience={(v) => {
                setMinExperience(v);
                resetPage();
              }}
              budget={budget}
              setBudget={(v) => {
                setBudget(v);
                resetPage();
              }}
              minRating={minRating}
              setMinRating={(v) => {
                setMinRating(v);
                resetPage();
              }}
              verifiedOnly={verifiedOnly}
              setVerifiedOnly={(v) => {
                setVerifiedOnly(v);
                resetPage();
              }}
              availability={availability}
              setAvailability={(v) => {
                setAvailability(v);
                resetPage();
              }}
              sort={sort}
              setSort={(v) => {
                setSort(v);
                resetPage();
              }}
              resultCount={freelancers?.pagination.total ?? 0}
              variant="dark"
            />

            <div>
              {loadingFreelancers ? (
                <GridSkeleton />
              ) : !freelancers?.data.length ? (
                <EmptyState icon={Users} text="No freelancers found. Try a different search or filter." />
              ) : (
                <>
                  <div className="grid grid-cols-1 items-stretch gap-5 mb-5 sm:grid-cols-2 xl:grid-cols-4">
                    {freelancers.data.map((f) => (
                      <FreelancerCard key={f._id} freelancer={f} variant="dark" />
                    ))}
                  </div>
                  <Pagination page={page} pages={freelancers.pagination.pages} onChange={setPage} />
                </>
              )}
            </div>
          </div>
        ) : tab === "services" ? (
          <Suspense fallback={<GridSkeleton />}>
            <GigList search={search} />
          </Suspense>
        ) : tab === "projects" ? (
          <Suspense fallback={<GridSkeleton />}>
            <ProjectList search={search} />
          </Suspense>
        ) : loadingContests ? (
          <GridSkeleton />
        ) : !contests?.data.length ? (
          <EmptyState icon={Trophy} text="No contests running yet." />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {contests.data.map((contest) => (
              <ContestCard key={contest._id} contest={contest} />
            ))}
          </div>
        )}
      </div>

      {/* Final CTA — closes the page with the same dual "hire or get hired"
          framing as the hero, matching Home.tsx's FinalCta styling. */}
      <section className="relative overflow-hidden border-t border-white/[0.08] py-16 text-center sm:py-20">
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#22C55E]/15 blur-[120px]" />
        <div className="container relative">
          <h2 className="mx-auto max-w-lg font-display text-[26px] font-black leading-tight tracking-tight text-white sm:text-[32px]">
            Ready to build your next big thing?
          </h2>
          <p className="mx-auto mt-3 max-w-md text-[15px] leading-relaxed text-[#A1A1AA]">
            Find the right freelancer, or start offering your expertise on GrowHive.
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-b from-[#E8FF25] to-[#22C55E] px-6 py-3 text-[14.5px] font-semibold text-black transition-all hover:brightness-110"
            >
              Find a Freelancer <ArrowRight className="h-4 w-4" />
            </a>
            <Link
              to="/register"
              className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/5 px-6 py-3 text-[14.5px] font-semibold text-white transition-colors hover:border-white/20 hover:bg-white/10"
            >
              Join as Freelancer
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function GridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <Skeleton key={i} className="h-80 w-full rounded-[22px] bg-white/5" />
      ))}
    </div>
  );
}

function EmptyState({ icon: Icon, text }: { icon: typeof Users; text: string }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-white/[0.08] py-16 text-center">
      <Icon className="h-9 w-9 text-[#71717A]" />
      <p className="max-w-sm text-sm text-[#A1A1AA]">{text}</p>
    </div>
  );
}
