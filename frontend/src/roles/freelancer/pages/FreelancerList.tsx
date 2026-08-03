import { useState, lazy, Suspense, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Users, Trophy } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { FreelancerCard } from "@/roles/freelancer/components/FreelancerCard";
import { ContestCard } from "@/components/contests/ContestCard";
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
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get("tab");
  const [tab, setTab] = useState<SectionTab>(SECTION_TABS.includes(initialTab as SectionTab) ? (initialTab as SectionTab) : "freelancers");

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
  // deep-link straight into a filtered result set, not just the bare page.
  const initialCategory = searchParams.get("category");
  const [category, setCategory] = useState(initialCategory && SERVICE_CATEGORY_NAMES.includes(initialCategory) ? initialCategory : "all");
  const [subCategory, setSubCategory] = useState(searchParams.get("subCategory") ?? "all");
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
    setCategory(v);
    setSubCategory("all");
    resetPage();
  };
  const selectSubCategory = (cat: string, sub: string) => {
    setCategory(cat);
    setSubCategory(sub);
    resetPage();
  };
  return (
    <div>
      {/* Section switcher */}
      <div className="sticky top-16 z-30 border-b bg-white py-2">
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
        <div className="border-b border-neutral-200 bg-white lg:sticky lg:top-[136px] lg:z-[25]">
          <div className="container">
            <CategoryBrowsePanel
              activeCategory={category}
              onSelectCategory={selectCategory}
              onSelectSubCategory={selectSubCategory}
              onViewAll={selectCategory}
              popup
            />
          </div>
        </div>
      )}

      <div className="container py-6">
        {tab === "freelancers" ? (
          <div className="grid grid-cols-1 items-start gap-2 lg:grid-cols-[260px_1fr]">
            <FilterSidebar
              category={category}
              setCategory={selectCategory}
              subCategory={subCategory}
              setSubCategory={(v) => {
                setSubCategory(v);
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
            />

            <div>
              {loadingFreelancers ? (
                <GridSkeleton />
              ) : !freelancers?.data.length ? (
                <EmptyState icon={Users} text="No freelancers found. Try a different search or filter." />
              ) : (
                <>
                  <div className="grid grid-cols-1 items-stretch gap-5 sm:grid-cols-2 sm:gap-5 xl:grid-cols-3 ">
                    {freelancers.data.map((f) => (
                      <FreelancerCard key={f._id} freelancer={f} />
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
    </div>
  );
}

function GridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <Skeleton key={i} className="h-80 w-full rounded-[22px]" />
      ))}
    </div>
  );
}

function EmptyState({ icon: Icon, text }: { icon: typeof Users; text: string }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border py-16 text-center">
      <Icon className="h-9 w-9 text-muted-foreground" />
      <p className="max-w-sm text-sm text-muted-foreground">{text}</p>
    </div>
  );
}
