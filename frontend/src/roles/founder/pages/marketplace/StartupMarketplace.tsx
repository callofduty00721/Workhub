import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowRight,
  BadgeCheck,
  Bookmark,
  Briefcase,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  List,
  Loader2,
  MapPin,
  Rocket,
  Search,
  Send,
  SlidersHorizontal,
  Sparkles,
  Wallet,
  X,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DemoBadge } from "@/components/DemoBadge";
import { Skeleton } from "@/components/ui/skeleton";
import { Pagination } from "@/components/shared/Pagination";
import { startupApi, type StartupFilters } from "@/api/startups";
import { chatApi } from "@/api/chat";
import { useAuth } from "@/context/AuthContext";
import { INDUSTRIES, INDUSTRY_SUBCATEGORIES } from "@/lib/mockData";
import { cn, formatFundingCompact, initialsFromName } from "@/lib/utils";
import type { Startup, StartupStage } from "@/types";

// Real top-level industries from INDUSTRY_SUBCATEGORIES that most closely
// match the brief's suggested search terms — actual filterable values, not
// invented ones.
const POPULAR_SEARCHES = ["FinTech", "EdTech", "HealthTech", "Software / SaaS", "Artificial Intelligence (AI)", "AgriTech", "CleanTech", "E-commerce"];

const STAGE_TABS: { value: StartupStage; label: string }[] = [
  { value: "idea", label: "Idea" },
  { value: "pre_seed", label: "Pre-Seed" },
  { value: "seed", label: "Seed" },
  { value: "series_a", label: "Series A" },
  { value: "series_b", label: "Series B" },
  { value: "growth", label: "Growth" },
];

const STAGE_LABELS: Record<StartupStage, string> = {
  idea: "Idea",
  pre_seed: "Pre-Seed",
  seed: "Seed",
  series_a: "Series A",
  series_b: "Series B",
  growth: "Growth",
};

// idea/pre_seed lean gray-ish (earliest), seed/series_a lean green (real
// traction), series_b/growth lean blue (scaling) — same 3-tone family used
// for status badges elsewhere in the app.
const STAGE_BADGE_STYLE: Record<StartupStage, string> = {
  idea: "bg-[#F1F3EF] text-[#4B5563]",
  pre_seed: "bg-[#F1F3EF] text-[#4B5563]",
  seed: "bg-[#ECFDF3] text-[#16A34A]",
  series_a: "bg-[#ECFDF3] text-[#16A34A]",
  series_b: "bg-[#EFF6FF] text-[#2563EB]",
  growth: "bg-[#EFF6FF] text-[#2563EB]",
};

type SortOption = "recommended" | "funding" | "rating";

const SORT_OPTIONS: { label: string; value: SortOption }[] = [
  { label: "Recommended", value: "recommended" },
  { label: "Most Funded", value: "funding" },
  { label: "Top Rated", value: "rating" },
];

function isVerifiedStartup(s: Startup) {
  return s.isVerified || s.founderVerified;
}

function isHiring(s: Startup) {
  return (s.openRoles?.length ?? 0) > 0;
}

function isSeekingInvestment(s: Startup) {
  return s.fundingNeeded > 0 && s.fundingRaised < s.fundingNeeded;
}

// Self-contained Startup discovery page — mirrors the Freelancer/Gig/
// Project/Contest/Influencer/Brand/Agency/Partner Marketplace pattern (own
// hero, search, category+stage nav, filters, results), real-data-only
// throughout. The main GrowHive navbar is untouched — this page integrates
// into the existing /startups route rather than introducing a new navbar.
export default function StartupMarketplace() {
  const [search, setSearch] = useState("");
  const [searchDraft, setSearchDraft] = useState("");
  const [industry, setIndustry] = useState("all");
  const [subIndustry, setSubIndustry] = useState("all");
  const [stage, setStage] = useState<StartupStage | "all">("all");
  const [location, setLocation] = useState("");
  const [hiringOnly, setHiringOnly] = useState(false);
  const [investmentOnly, setInvestmentOnly] = useState(false);
  const [sort, setSort] = useState<SortOption>("recommended");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [page, setPage] = useState(1);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const resetPage = () => setPage(1);

  const selectIndustry = (v: string) => {
    setIndustry(v);
    setSubIndustry("all");
    resetPage();
  };

  const selectStage = (v: StartupStage | "all") => {
    setStage(v);
    resetPage();
  };

  const clearFilters = () => {
    setIndustry("all");
    setSubIndustry("all");
    setStage("all");
    setLocation("");
    setHiringOnly(false);
    setInvestmentOnly(false);
    setSearch("");
    setSearchDraft("");
    resetPage();
  };

  const activeFilterCount = [industry !== "all", subIndustry !== "all", stage !== "all", !!location, hiringOnly, investmentOnly].filter(Boolean).length;

  const { data, isLoading } = useQuery({
    queryKey: ["startups", "marketplace", { search, industry, subIndustry, stage, sort, page }],
    queryFn: () =>
      startupApi.list({
        search: search || undefined,
        industry: industry === "all" ? undefined : industry,
        subIndustry: subIndustry === "all" ? undefined : subIndustry,
        stage: stage === "all" ? undefined : stage,
        sort: sort === "recommended" ? undefined : (sort as StartupFilters["sort"]),
        page,
        limit: 12,
      }),
  });

  const total = data?.pagination.total ?? 0;

  // Location, Hiring, and Investment have no server-side param, so these are
  // real fields/computed signals filtered honestly on whatever page is
  // currently loaded.
  const filteredResults = (data?.data ?? []).filter((s) => {
    if (location && !s.location?.toLowerCase().includes(location.toLowerCase())) return false;
    if (hiringOnly && !isHiring(s)) return false;
    if (investmentOnly && !isSeekingInvestment(s)) return false;
    return true;
  });

  // Real-data-only "Featured" pick — prefers the platform's own isFeatured
  // flag; falls back to the most real funding raised on page 1 only when no
  // startup is flagged. Never a fabricated/curated placement.
  const featured =
    page === 1 && !isLoading
      ? filteredResults.find((s) => s.isFeatured) ?? [...filteredResults].sort((a, b) => b.fundingRaised - a.fundingRaised).find((s) => s.fundingRaised > 0)
      : undefined;
  const gridResults = featured ? filteredResults.filter((s) => s._id !== featured._id) : filteredResults;

  const subIndustryOptions = industry !== "all" ? INDUSTRY_SUBCATEGORIES[industry] ?? [] : [];

  return (
    <div className="bg-[#F7F8F5]">
      {/* Header */}
      <div className="border-b border-[#E5E7EB] bg-[#F7F8F5] py-10 sm:py-14">
        <div className="container">
          <p className="text-xs font-medium text-[#9CA3AF]">
            <Link to="/" className="hover:text-[#111111]">
              Home
            </Link>{" "}
            / <span className="text-[#6B7280]">Startups</span>
          </p>
          <h1 className="mt-3 max-w-2xl text-3xl font-extrabold tracking-tight text-[#111111] sm:text-4xl">Discover startups building what's next.</h1>
          <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-[#6B7280]">
            Explore innovative startups, discover emerging ideas and connect with founders, teams and opportunities.
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              setSearch(searchDraft);
              resetPage();
            }}
            className="mt-5 flex w-full max-w-2xl items-center gap-2 rounded-2xl border border-[#DDE1DA] bg-white p-2 shadow-[0_8px_24px_-16px_rgba(17,17,17,0.15)]"
          >
            <Search className="ml-2 h-4.5 w-4.5 shrink-0 text-[#9CA3AF]" />
            <input
              value={searchDraft}
              onChange={(e) => setSearchDraft(e.target.value)}
              placeholder="Search startups, industries or ideas..."
              className="h-10 min-w-0 flex-1 bg-transparent text-sm text-[#111111] placeholder:text-[#9CA3AF] focus:outline-none"
            />
            <button
              type="submit"
              className="shrink-0 rounded-xl bg-[#111111] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#B6FF00] hover:text-[#111111]"
            >
              Search
            </button>
          </form>

          <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1.5 text-xs">
            <span className="font-semibold text-[#9CA3AF]">Popular:</span>
            {POPULAR_SEARCHES.map((term) => (
              <button
                key={term}
                type="button"
                onClick={() => {
                  setSearch(term);
                  setSearchDraft(term);
                  resetPage();
                }}
                className="rounded-full px-2 py-0.5 font-medium text-[#4B5563] transition-colors hover:bg-[#F1FFD6] hover:text-[#111111]"
              >
                {term}
              </button>
            ))}
          </div>

          {/* Industry navigation — real INDUSTRY_SUBCATEGORIES taxonomy, same
              one the server-side `industry`/`subIndustry` params match against. */}
          <ScrollableChipRow className="mt-6">
            <CategoryChip label="All" checked={industry === "all"} onChange={() => selectIndustry("all")} />
            {INDUSTRIES.map((c) => (
              <CategoryChip key={c} label={c} checked={industry === c} onChange={() => selectIndustry(c)} />
            ))}
          </ScrollableChipRow>

          {subIndustryOptions.length > 0 && (
            <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-semibold text-[#9CA3AF]">Sub-category:</span>
              <CategoryChip label={`All ${industry}`} checked={subIndustry === "all"} onChange={() => { setSubIndustry("all"); resetPage(); }} />
              {subIndustryOptions.map((s) => (
                <CategoryChip key={s} label={s} checked={subIndustry === s} onChange={() => { setSubIndustry(s); resetPage(); }} />
              ))}
            </div>
          )}

          {/* Stage tabs — compact second-level filter, real StartupStage enum. */}
          <div className="mt-4 flex flex-wrap gap-1 border-b border-[#E5E7EB] pb-0.5">
            <StageTab label="All Stages" active={stage === "all"} onClick={() => selectStage("all")} />
            {STAGE_TABS.map((t) => (
              <StageTab key={t.value} label={t.label} active={stage === t.value} onClick={() => selectStage(t.value)} />
            ))}
          </div>
        </div>
      </div>

      {/* Main layout */}
      <div className="container grid grid-cols-1 items-start gap-6 py-6 lg:grid-cols-[260px_1fr]">
        <FilterSidebar
          className="hidden lg:block"
          industry={industry}
          subIndustry={subIndustry}
          stage={stage}
          location={location}
          setLocation={(v) => { setLocation(v); resetPage(); }}
          hiringOnly={hiringOnly}
          setHiringOnly={(v) => { setHiringOnly(v); resetPage(); }}
          investmentOnly={investmentOnly}
          setInvestmentOnly={(v) => { setInvestmentOnly(v); resetPage(); }}
          onApply={resetPage}
          onClear={clearFilters}
        />

        <div className="min-w-0">
          {/* Results header */}
          <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-[#111111]">Explore Startups</h2>
              {total > 0 && <span className="text-sm text-[#9CA3AF]">{total.toLocaleString()} found</span>}
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(true)}
                className="ml-1 flex items-center gap-1.5 rounded-full border border-[#E5E7EB] bg-white px-3 py-1.5 text-xs font-semibold text-[#111111] lg:hidden"
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
              </button>
            </div>

            <div className="flex items-center gap-2">
              <SortDropdown sort={sort} setSort={(v) => { setSort(v); resetPage(); }} />
              <div className="flex items-center gap-0.5 rounded-full border border-[#E5E7EB] bg-white p-0.5">
                <button
                  type="button"
                  onClick={() => setView("grid")}
                  aria-label="Grid view"
                  className={cn("flex h-8 w-8 items-center justify-center rounded-full transition-colors", view === "grid" ? "bg-[#111111] text-white" : "text-[#9CA3AF] hover:text-[#111111]")}
                >
                  <LayoutGrid className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setView("list")}
                  aria-label="List view"
                  className={cn("flex h-8 w-8 items-center justify-center rounded-full transition-colors", view === "list" ? "bg-[#111111] text-white" : "text-[#9CA3AF] hover:text-[#111111]")}
                >
                  <List className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>

          {isLoading ? (
            <SkeletonGrid view={view} />
          ) : filteredResults.length === 0 ? (
            <EmptyState onClear={clearFilters} />
          ) : (
            <>
              {featured && <FeaturedStartupCard startup={featured} />}

              <div className={view === "grid" ? "grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3" : "flex flex-col gap-4"}>
                {gridResults.map((s) => (
                  <StartupMarketCard key={s._id} startup={s} layout={view} />
                ))}
              </div>

              <Pagination page={page} pages={data?.pagination.pages ?? 1} onChange={setPage} />
            </>
          )}
        </div>
      </div>

      {mobileFiltersOpen && (
        <MobileFilterDrawer onClose={() => setMobileFiltersOpen(false)}>
          <FilterSidebar
            industry={industry}
            subIndustry={subIndustry}
            stage={stage}
            location={location}
            setLocation={(v) => { setLocation(v); resetPage(); }}
            hiringOnly={hiringOnly}
            setHiringOnly={(v) => { setHiringOnly(v); resetPage(); }}
            investmentOnly={investmentOnly}
            setInvestmentOnly={(v) => { setInvestmentOnly(v); resetPage(); }}
            onApply={() => { resetPage(); setMobileFiltersOpen(false); }}
            onClear={clearFilters}
          />
        </MobileFilterDrawer>
      )}
    </div>
  );
}

// ============================================================
// Filter sidebar — Industry/Sub-category/Stage are already covered by the
// top nav (all real, server-backed). Location, Hiring, and Seeking
// Investment are real fields/signals with no server param for this
// endpoint, so they're applied honestly to whichever page is currently
// loaded. Business Model, Funding Stage (a duplicate of Stage on this data
// model), Team Size, Funding Requirement range, and Startup Type from the
// original brief have no real backing and were left out rather than built
// as non-functional controls.
// ============================================================
function FilterSidebar({
  className,
  industry,
  subIndustry,
  stage,
  location,
  setLocation,
  hiringOnly,
  setHiringOnly,
  investmentOnly,
  setInvestmentOnly,
  onApply,
  onClear,
}: {
  className?: string;
  industry: string;
  subIndustry: string;
  stage: StartupStage | "all";
  location: string;
  setLocation: (v: string) => void;
  hiringOnly: boolean;
  setHiringOnly: (v: boolean) => void;
  investmentOnly: boolean;
  setInvestmentOnly: (v: boolean) => void;
  onApply: () => void;
  onClear: () => void;
}) {
  return (
    <aside className={cn("rounded-[20px] border border-[#E5E7EB] bg-white p-5 lg:sticky lg:top-24", className)}>
      <h3 className="text-sm font-bold text-[#111111]">Filter Startups</h3>

      {(industry !== "all" || stage !== "all") && (
        <div className="mt-4 flex flex-wrap gap-1.5 border-t border-[#E5E7EB] pt-4">
          <p className="w-full text-xs font-semibold text-[#111111]">Filtering by</p>
          {industry !== "all" && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#B6FF00] bg-[#B6FF00]/10 px-3 py-1.5 text-xs font-medium text-[#111111]">
              {subIndustry !== "all" ? subIndustry : industry}
            </span>
          )}
          {stage !== "all" && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#B6FF00] bg-[#B6FF00]/10 px-3 py-1.5 text-xs font-medium text-[#111111]">
              {STAGE_LABELS[stage]}
            </span>
          )}
        </div>
      )}

      <div className="mt-4 border-t border-[#E5E7EB] pt-4">
        <p className="mb-2 text-xs font-semibold text-[#111111]">Location</p>
        <input
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="City, state..."
          className="h-9 w-full rounded-lg border border-[#E5E7EB] px-3 text-[13px] text-[#111111] placeholder:text-[#9CA3AF] focus:border-[#B6FF00] focus:outline-none"
        />
      </div>

      <div className="mt-4 space-y-2 border-t border-[#E5E7EB] pt-4">
        <p className="mb-1 text-xs font-semibold text-[#111111]">Looking For</p>
        <button
          type="button"
          onClick={() => setHiringOnly(!hiringOnly)}
          className={cn(
            "flex w-full items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-[13px] font-medium transition-colors",
            hiringOnly ? "border-[#B6FF00] bg-[#B6FF00]/10 text-[#111111]" : "border-[#E5E7EB] text-[#4B5563] hover:border-[#B6FF00]/50"
          )}
        >
          Hiring
        </button>
        <button
          type="button"
          onClick={() => setInvestmentOnly(!investmentOnly)}
          className={cn(
            "flex w-full items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-[13px] font-medium transition-colors",
            investmentOnly ? "border-[#B6FF00] bg-[#B6FF00]/10 text-[#111111]" : "border-[#E5E7EB] text-[#4B5563] hover:border-[#B6FF00]/50"
          )}
        >
          Seeking Investment
        </button>
      </div>

      <div className="mt-5 flex gap-2">
        <button
          type="button"
          onClick={onClear}
          className="flex-1 rounded-xl border border-[#E5E7EB] bg-white py-2.5 text-sm font-semibold text-[#4B5563] transition-colors hover:bg-[#F1F3EF]"
        >
          Clear All
        </button>
        <button
          type="button"
          onClick={onApply}
          className="flex-1 rounded-xl bg-[#111111] py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#B6FF00] hover:text-[#111111]"
        >
          Apply Filters
        </button>
      </div>
    </aside>
  );
}

function CategoryChip({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      onClick={onChange}
      aria-pressed={checked}
      className={cn(
        "shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
        checked ? "border-[#B6FF00] bg-[#B6FF00] text-[#111111]" : "border-[#E5E7EB] bg-white text-[#4B5563] hover:border-[#B6FF00]/50"
      )}
    >
      {label}
    </button>
  );
}

function StageTab({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn("relative px-3 py-2 text-[13px] font-medium transition-colors", active ? "text-[#111111]" : "text-[#6B7280] hover:text-[#111111]")}
    >
      {label}
      {active && <span className="absolute inset-x-2 -bottom-[1px] h-[2px] rounded-full bg-[#B6FF00]" />}
    </button>
  );
}

// Wraps a horizontally-scrolling chip row with the affordances a bare
// `overflow-x-auto` div doesn't get for free: a normal (vertical) mouse
// wheel does nothing on a horizontal-only scroller by default — only
// trackpad/touch swipes do — so this redirects wheel input, and adds
// click-to-scroll chevrons that only appear when there's more to see.
function ScrollableChipRow({ children, className }: { children: React.ReactNode; className?: string }) {
  const rowRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollButtons = () => {
    const el = rowRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  };

  useEffect(() => {
    const el = rowRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (el.scrollWidth <= el.clientWidth) return;
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
      e.preventDefault();
      el.scrollLeft += e.deltaY;
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    updateScrollButtons();
    const onResize = () => updateScrollButtons();
    window.addEventListener("resize", onResize);
    return () => {
      el.removeEventListener("wheel", onWheel);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  const scrollByAmount = (amount: number) => rowRef.current?.scrollBy({ left: amount, behavior: "smooth" });

  return (
    <div className={cn("relative", className)}>
      {canScrollLeft && (
        <button
          type="button"
          aria-label="Scroll left"
          onClick={() => scrollByAmount(-240)}
          className="absolute left-0 top-0 z-10 flex h-full w-8 items-center justify-center bg-gradient-to-r from-[#F7F8F5] via-[#F7F8F5]/90 to-transparent text-[#6B7280] hover:text-[#111111]"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      )}
      <div ref={rowRef} onScroll={updateScrollButtons} className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 scrollbar-hide">
        {children}
      </div>
      {canScrollRight && (
        <button
          type="button"
          aria-label="Scroll right"
          onClick={() => scrollByAmount(240)}
          className="absolute right-0 top-0 z-10 flex h-full w-8 items-center justify-center bg-gradient-to-l from-[#F7F8F5] via-[#F7F8F5]/90 to-transparent text-[#6B7280] hover:text-[#111111]"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

// ============================================================
// Sort dropdown
// ============================================================
function SortDropdown({ sort, setSort }: { sort: SortOption; setSort: (v: SortOption) => void }) {
  const [open, setOpen] = useState(false);
  const activeLabel = SORT_OPTIONS.find((o) => o.value === sort)?.label ?? "Recommended";

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        className="flex items-center gap-1.5 rounded-full border border-[#E5E7EB] bg-white px-3.5 py-2 text-xs font-semibold text-[#111111]"
      >
        {activeLabel}
        <ChevronDown className={cn("h-3.5 w-3.5 text-[#9CA3AF] transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-20 mt-1.5 w-44 overflow-hidden rounded-xl border border-[#E5E7EB] bg-white py-1 shadow-[0_16px_40px_-20px_rgba(17,17,17,0.25)]">
          {SORT_OPTIONS.map((o) => (
            <button
              key={o.value}
              type="button"
              onMouseDown={() => setSort(o.value)}
              className={cn(
                "flex w-full items-center px-3.5 py-2 text-left text-sm transition-colors hover:bg-[#F1F3EF]",
                sort === o.value ? "font-semibold text-[#111111]" : "text-[#4B5563]"
              )}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================
// Mobile filter drawer — bottom sheet
// ============================================================
function MobileFilterDrawer({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end lg:hidden">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative max-h-[85vh] w-full overflow-y-auto rounded-t-[24px] bg-[#F7F8F5] p-4 pb-6">
        <div className="mb-2 flex items-center justify-between">
          <span className="mx-auto h-1.5 w-10 rounded-full bg-[#E5E7EB]" />
          <button type="button" onClick={onClose} className="absolute right-4 top-4 rounded-full border border-[#E5E7EB] bg-white p-1.5">
            <X className="h-4 w-4 text-[#111111]" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ============================================================
// Shared bits
// ============================================================
function StartupLogo({ startup, size = "md" }: { startup: Startup; size?: "md" | "lg" }) {
  const dims = size === "lg" ? "h-16 w-16 rounded-2xl" : "h-12 w-12 rounded-[14px]";
  return (
    <Avatar className={cn(dims, "shrink-0 border border-[#E5E7EB] bg-white")}>
      <AvatarImage src={startup.logo} alt={startup.name} className={size === "lg" ? "rounded-2xl object-contain" : "rounded-[14px] object-contain"} />
      <AvatarFallback className={cn(size === "lg" ? "rounded-2xl" : "rounded-[14px]", "bg-[#111111] font-semibold text-white")}>
        {initialsFromName(startup.name)}
      </AvatarFallback>
    </Avatar>
  );
}

function TeamPreview({ startup }: { startup: Startup }) {
  const founder = typeof startup.founder === "object" ? startup.founder : null;
  const people = [...(founder ? [{ name: founder.name, avatar: founder.avatar }] : []), ...(startup.team ?? []).map((m) => ({ name: m.name, avatar: m.avatar }))];
  const visible = people.slice(0, 3);
  if (people.length === 0) return null;
  return (
    <div className="flex items-center gap-2">
      <div className="flex -space-x-2">
        {visible.map((p, i) => (
          <Avatar key={i} className="h-6 w-6 border-2 border-white">
            <AvatarImage src={p.avatar} alt={p.name} />
            <AvatarFallback className="bg-[#111111] text-[9px] font-bold text-white">{initialsFromName(p.name)}</AvatarFallback>
          </Avatar>
        ))}
        {people.length > 3 && (
          <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-[#111111] text-[9px] font-bold text-white">+{people.length - 3}</div>
        )}
      </div>
      <span className="text-[11px] text-[#9CA3AF]">{people.length} member{people.length === 1 ? "" : "s"}</span>
    </div>
  );
}

function HiringChips({ startup }: { startup: Startup }) {
  const roleTitles = (startup.openRoles ?? []).slice(0, 2).map((r) => r.title);
  const extraRoles = (startup.openRoles?.length ?? 0) - roleTitles.length;
  if (roleTitles.length === 0) return null;
  return (
    <div>
      <span className="mb-1 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-[#9CA3AF]">
        <Briefcase className="h-3 w-3" /> Hiring
      </span>
      <div className="flex flex-wrap gap-1.5">
        {roleTitles.map((c) => (
          <span key={c} className="rounded-full bg-[#F1F3EF] px-2 py-0.5 text-[10.5px] font-medium text-[#4B5563]">
            {c}
          </span>
        ))}
        {extraRoles > 0 && <span className="rounded-full bg-[#F1F3EF] px-2 py-0.5 text-[10.5px] font-medium text-[#9CA3AF]">+{extraRoles} more</span>}
      </div>
    </div>
  );
}

function FollowButton({ startup, className }: { startup: Startup; className?: string }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isFollowing = user ? startup.followers.includes(user.id) : false;

  const followMutation = useMutation({
    mutationFn: () => startupApi.toggleFollow(startup._id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["startups"] }),
  });

  if (!user) return null;

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        followMutation.mutate();
      }}
      disabled={followMutation.isPending}
      title={isFollowing ? "Remove from saved" : "Save startup"}
      className={cn("flex items-center justify-center rounded-full bg-[#F1F3EF] text-[#6B7280] transition-colors hover:bg-[#E5E7EB]", className)}
    >
      <Bookmark className={cn("h-3.5 w-3.5", isFollowing && "fill-[#B6FF00] text-[#B6FF00]")} />
    </button>
  );
}

// ============================================================
// Startup card (grid + list layouts)
// ============================================================
function StartupMarketCard({ startup, layout }: { startup: Startup; layout: "grid" | "list" }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const founder = typeof startup.founder === "object" ? startup.founder : null;
  const founderId = founder?._id;
  const isOwnCard = !!user && !!founderId && user.id === founderId;

  const messageMutation = useMutation({
    mutationFn: () => chatApi.getOrCreateConversation(founderId!),
    onSuccess: (c) => navigate(`/dashboard/messages?c=${c._id}`),
  });

  return (
    <Link
      to={`/startups/${startup._id}`}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-[20px] border border-[#E5E7EB] bg-white p-5 transition-all duration-[220ms] hover:-translate-y-[3px] hover:border-[#B6FF00] hover:shadow-[0_20px_40px_-24px_rgba(17,17,17,0.18)]",
        layout === "list" && "sm:flex-row sm:items-start sm:gap-5"
      )}
    >
      {startup.isDemo && <DemoBadge />}
      <div className={cn("flex flex-1 flex-col", layout === "list" && "min-w-0")}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-center gap-3">
            <div className="rounded-[14px] transition-colors duration-[220ms] group-hover:bg-[#F1FFD6]">
              <StartupLogo startup={startup} />
            </div>
            <div className="min-w-0">
              <p className="flex items-center gap-1 truncate text-[15px] font-bold text-[#111111]">
                {startup.name}
                {isVerifiedStartup(startup) && <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-[#2563EB]" />}
              </p>
              <p className="truncate text-[12px] text-[#6B7280]">{startup.tagline || startup.industry}</p>
            </div>
          </div>
          <FollowButton startup={startup} className="h-7 w-7 shrink-0" />
        </div>

        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
          <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold", STAGE_BADGE_STYLE[startup.stage])}>{STAGE_LABELS[startup.stage]}</span>
          {startup.industry && <span className="rounded-full bg-[#F1F3EF] px-2 py-0.5 text-[10px] font-medium text-[#4B5563]">{startup.industry}</span>}
          {startup.location && (
            <span className="flex items-center gap-1 text-[11px] text-[#9CA3AF]">
              <MapPin className="h-3 w-3" /> {startup.location}
            </span>
          )}
        </div>

        {startup.description && <p className="mt-2.5 line-clamp-2 text-[12.5px] leading-relaxed text-[#6B7280]">{startup.description}</p>}

        {startup.fundingNeeded > 0 && (
          <div className="mt-3 rounded-xl bg-[#F7F8F5] p-2.5">
            <span className="mb-1 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-[#9CA3AF]">
              <Wallet className="h-3 w-3" /> Investment
            </span>
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-semibold text-[#111111]">{formatFundingCompact(startup.fundingNeeded)} needed</span>
              <span className="text-[#9CA3AF]">{Math.min(100, Math.round((startup.fundingRaised / startup.fundingNeeded) * 100))}% raised</span>
            </div>
            <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-[#E5E7EB]">
              <div
                className="h-full rounded-full bg-[#B6FF00]"
                style={{ width: `${Math.min(100, Math.round((startup.fundingRaised / startup.fundingNeeded) * 100))}%` }}
              />
            </div>
          </div>
        )}

        <div className="mt-3">
          <HiringChips startup={startup} />
        </div>

        <div className="mt-auto flex items-center justify-between gap-2 pt-3.5">
          <TeamPreview startup={startup} />
          <div className="flex items-center gap-1.5">
            {!isOwnCard && founderId && (
              <button
                type="button"
                disabled={messageMutation.isPending}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  user ? messageMutation.mutate() : navigate("/login");
                }}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-[#E5E7EB] text-[#4B5563] transition-colors hover:border-[#B6FF00] hover:text-[#111111] disabled:opacity-50"
                title="Connect"
              >
                {messageMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
              </button>
            )}
            <span className="flex items-center gap-1 rounded-full bg-[#111111] px-3.5 py-2 text-xs font-semibold text-white transition-colors group-hover:bg-[#B6FF00] group-hover:text-[#111111]">
              View Startup <ArrowRight className="h-3 w-3" />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

// ============================================================
// Featured startup — real isFeatured flag when set, else the most real
// funding raised on page 1. Clearly not a fabricated pick.
// ============================================================
function FeaturedStartupCard({ startup }: { startup: Startup }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const founder = typeof startup.founder === "object" ? startup.founder : null;
  const founderId = founder?._id;
  const isOwnCard = !!user && !!founderId && user.id === founderId;
  const pct = startup.fundingNeeded > 0 ? Math.min(100, Math.round((startup.fundingRaised / startup.fundingNeeded) * 100)) : 0;

  const messageMutation = useMutation({
    mutationFn: () => chatApi.getOrCreateConversation(founderId!),
    onSuccess: (c) => navigate(`/dashboard/messages?c=${c._id}`),
  });

  return (
    <div className="relative mb-5 flex flex-col gap-6 overflow-hidden rounded-[20px] border border-[#E5E7EB] bg-white p-5 shadow-[0_2px_8px_rgba(17,17,17,0.04)] sm:flex-row sm:items-start">
      {startup.isDemo && <DemoBadge />}
      <div className="flex items-center gap-4 sm:w-72 sm:shrink-0">
        <StartupLogo startup={startup} size="lg" />
        <div className="min-w-0">
          <span className="mb-1 inline-flex items-center gap-1 rounded-full bg-[#ECFDF3] px-2.5 py-1 text-[10.5px] font-bold text-[#16A34A]">
            <Sparkles className="h-3 w-3" /> Featured Startup
          </span>
          <p className="flex items-center gap-1 truncate text-base font-bold text-[#111111]">
            {startup.name}
            {isVerifiedStartup(startup) && <BadgeCheck className="h-4 w-4 shrink-0 text-[#2563EB]" />}
          </p>
          <p className="truncate text-[12.5px] text-[#6B7280]">{startup.tagline || startup.industry}</p>
          {startup.location && (
            <span className="flex items-center gap-1 text-[11.5px] text-[#9CA3AF]">
              <MapPin className="h-3 w-3" /> {startup.location}
            </span>
          )}
        </div>
      </div>

      <div className="min-w-0 flex-1">
        {startup.description && <p className="line-clamp-2 text-[13px] leading-relaxed text-[#6B7280]">{startup.description}</p>}

        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
          <span className={cn("rounded-full px-2.5 py-1 text-[10.5px] font-bold", STAGE_BADGE_STYLE[startup.stage])}>{STAGE_LABELS[startup.stage]} Stage</span>
          {startup.industry && <span className="rounded-full bg-[#F1F3EF] px-2.5 py-1 text-[10.5px] font-medium text-[#4B5563]">{startup.industry}</span>}
        </div>

        <div className="mt-3">
          <HiringChips startup={startup} />
        </div>

        {startup.fundingNeeded > 0 && (
          <div className="mt-3">
            <span className="mb-1 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-[#9CA3AF]">
              <Wallet className="h-3 w-3" /> Investment
            </span>
            <div className="flex items-center gap-3 text-[12px] text-[#6B7280]">
              <span className="font-semibold text-[#111111]">{formatFundingCompact(startup.fundingNeeded)} needed</span>
              <span>{pct}% raised</span>
            </div>
          </div>
        )}

        <div className="mt-3">
          <TeamPreview startup={startup} />
        </div>
      </div>

      <div className="flex shrink-0 flex-col items-start gap-3 sm:items-end">
        <FollowButton startup={startup} className="h-9 w-9 border border-[#E5E7EB]" />
        <div className="flex items-center gap-2">
          {!isOwnCard && founderId && (
            <button
              type="button"
              disabled={messageMutation.isPending}
              onClick={() => (user ? messageMutation.mutate() : navigate("/login"))}
              className="flex items-center justify-center gap-1.5 rounded-full border border-[#E5E7EB] bg-white px-4 py-2.5 text-xs font-semibold text-[#111111] transition-colors hover:bg-[#F1F3EF] disabled:opacity-50"
            >
              {messageMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
              Connect
            </button>
          )}
          <Link
            to={`/startups/${startup._id}`}
            className="flex items-center justify-center gap-1 rounded-full bg-[#111111] px-5 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-[#B6FF00] hover:text-[#111111]"
          >
            View Startup <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Empty state
// ============================================================
function EmptyState({ onClear }: { onClear: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-[20px] border border-[#E5E7EB] bg-white py-16 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#F1F3EF] text-[#9CA3AF]">
        <Rocket className="h-5 w-5" />
      </span>
      <p className="text-base font-bold text-[#111111]">No startups found</p>
      <p className="max-w-xs text-sm text-[#6B7280]">Try changing your filters or searching for another industry or startup stage.</p>
      <button
        type="button"
        onClick={onClear}
        className="mt-1 rounded-full border border-[#E5E7EB] bg-white px-5 py-2 text-sm font-semibold text-[#111111] transition-colors hover:bg-[#F1F3EF]"
      >
        Clear Filters
      </button>
    </div>
  );
}

// ============================================================
// Skeleton loading
// ============================================================
function SkeletonGrid({ view }: { view: "grid" | "list" }) {
  return (
    <div className={view === "grid" ? "grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3" : "flex flex-col gap-4"}>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="overflow-hidden rounded-[20px] border border-[#E5E7EB] bg-white p-5">
          <div className="flex items-center gap-3">
            <Skeleton className="h-12 w-12 shrink-0 rounded-[14px] bg-[#EDEFEA]" />
            <div className="min-w-0 flex-1">
              <Skeleton className="h-3.5 w-2/3 bg-[#EDEFEA]" />
              <Skeleton className="mt-1.5 h-3 w-1/3 bg-[#EDEFEA]" />
            </div>
          </div>
          <Skeleton className="mt-4 h-3 w-full bg-[#EDEFEA]" />
          <Skeleton className="mt-1.5 h-3 w-2/3 bg-[#EDEFEA]" />
          <Skeleton className="mt-3 h-12 w-full rounded-xl bg-[#EDEFEA]" />
          <Skeleton className="mt-3 h-4 w-24 bg-[#EDEFEA]" />
          <Skeleton className="mt-4 h-8 w-24 bg-[#EDEFEA]" />
        </div>
      ))}
    </div>
  );
}
