import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  BadgeCheck,
  CalendarClock,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Facebook,
  FileText,
  Globe,
  Instagram,
  LayoutGrid,
  Linkedin,
  List,
  Megaphone,
  Search,
  SlidersHorizontal,
  Sparkles,
  Star,
  Twitter,
  Users,
  Wallet,
  X,
  Youtube,
  type LucideIcon,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DemoBadge } from "@/components/DemoBadge";
import { Skeleton } from "@/components/ui/skeleton";
import { SaveButton } from "@/components/shared/SaveButton";
import { Pagination } from "@/components/shared/Pagination";
import { DirectoryTabs } from "@/pages/profiles/DirectoryTabs";
import { campaignApi } from "@/api/campaigns";
import { CAMPAIGN_PLATFORMS, COLLABORATION_TYPES, type Campaign, type CampaignPlatform, type CollaborationType } from "@/types";
import { cn, formatCurrency, getFollowerTier, initialsFromName } from "@/lib/utils";

const PLATFORM_META: Record<string, { icon: LucideIcon; color: string; label: string }> = {
  instagram: { icon: Instagram, color: "#E1306C", label: "Instagram" },
  youtube: { icon: Youtube, color: "#FF0000", label: "YouTube" },
  linkedin: { icon: Linkedin, color: "#0A66C2", label: "LinkedIn" },
  twitter: { icon: Twitter, color: "#111111", label: "X (Twitter)" },
  facebook: { icon: Facebook, color: "#1877F2", label: "Facebook" },
  other: { icon: Globe, color: "#6B7280", label: "Other" },
};

function platformMeta(p: string) {
  return PLATFORM_META[p] ?? PLATFORM_META.other;
}

const COLLAB_LABELS: Record<CollaborationType, string> = {
  paid: "Paid",
  barter: "Product Exchange",
  affiliate: "Affiliate",
  hybrid: "Hybrid",
};

// campaignApi's `search` is a real full-text query, but there's no real
// "campaign type" taxonomy to filter on server-side — these are search
// shortcuts, not filter chips.
const POPULAR_SEARCHES = ["Instagram Campaign", "YouTube Campaign", "UGC Campaign", "Product Review", "Brand Ambassador", "Affiliate", "Content Creation", "Product Launch"];

// Real, honest budget/follower/engagement thresholds — all filter on real
// Campaign fields (budgetMax, minFollowers, minEngagementRate), never
// fabricated brackets.
const BUDGET_OPTIONS = [
  { label: "₹5,000+", value: 5000 },
  { label: "₹25,000+", value: 25000 },
  { label: "₹50,000+", value: 50000 },
  { label: "₹1,00,000+", value: 100000 },
  { label: "₹5,00,000+", value: 500000 },
];

const FOLLOWER_OPTIONS = [
  { label: "1K+", value: 1000 },
  { label: "10K+", value: 10000 },
  { label: "50K+", value: 50000 },
  { label: "100K+", value: 100000 },
  { label: "500K+", value: 500000 },
  { label: "1M+", value: 1000000 },
];

const ENGAGEMENT_OPTIONS = [
  { label: "1%+", value: 1 },
  { label: "3%+", value: 3 },
  { label: "5%+", value: 5 },
  { label: "8%+", value: 8 },
];

type StatusFilter = "all" | "open" | "starting_soon" | "ending_soon" | "completed";

const STATUS_TABS: { label: string; value: StatusFilter }[] = [
  { label: "All Campaigns", value: "all" },
  { label: "Open", value: "open" },
  { label: "Starting Soon", value: "starting_soon" },
  { label: "Ending Soon", value: "ending_soon" },
  { label: "Completed", value: "completed" },
];

type SortOption = "recommended" | "newest" | "budget" | "ending_soon";

// campaignApi has no server-side sort param, so these re-order only the
// current page's real results client-side — never fabricated relevance.
const SORT_OPTIONS: { label: string; value: SortOption }[] = [
  { label: "Recommended", value: "recommended" },
  { label: "Newest", value: "newest" },
  { label: "Highest Budget", value: "budget" },
  { label: "Ending Soon", value: "ending_soon" },
];

function deadlineOf(c: Campaign) {
  return c.applicationDeadline ?? c.endDate;
}

function daysLeft(dateStr: string) {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

function isStartingSoon(c: Campaign) {
  return c.status === "open" && !!c.startDate && new Date(c.startDate).getTime() > Date.now();
}

function isEndingSoon(c: Campaign) {
  const deadline = deadlineOf(c);
  if (c.status !== "open" || !deadline || isStartingSoon(c)) return false;
  const left = daysLeft(deadline);
  return left <= 3 && left > 0;
}

function matchesStatus(c: Campaign, filter: StatusFilter) {
  if (filter === "all") return true;
  if (filter === "completed") return c.status === "closed";
  if (filter === "starting_soon") return isStartingSoon(c);
  if (filter === "ending_soon") return isEndingSoon(c);
  return c.status === "open" && !isStartingSoon(c) && !isEndingSoon(c);
}

// Self-contained Campaign discovery page — mirrors the Freelancer/Gig/
// Project/Contest/Influencer/Brand/Agency/Partner/Startup Marketplace
// pattern (own hero, search, filters, results), real-data-only throughout.
export function CampaignMarketplace() {
  const [search, setSearch] = useState("");
  const [searchDraft, setSearchDraft] = useState("");
  const [platform, setPlatform] = useState<CampaignPlatform | "any">("any");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [location, setLocation] = useState("");
  const [minBudget, setMinBudget] = useState<number | "any">("any");
  const [minFollowers, setMinFollowers] = useState<number | "any">("any");
  const [minEngagement, setMinEngagement] = useState<number | "any">("any");
  const [collabType, setCollabType] = useState<CollaborationType | "any">("any");
  const [sort, setSort] = useState<SortOption>("recommended");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [page, setPage] = useState(1);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const resetPage = () => setPage(1);

  const clearFilters = () => {
    setPlatform("any");
    setStatus("all");
    setLocation("");
    setMinBudget("any");
    setMinFollowers("any");
    setMinEngagement("any");
    setCollabType("any");
    setSearch("");
    setSearchDraft("");
    resetPage();
  };

  const activeFilterCount = [
    platform !== "any",
    status !== "all",
    !!location,
    minBudget !== "any",
    minFollowers !== "any",
    minEngagement !== "any",
    collabType !== "any",
  ].filter(Boolean).length;

  const { data, isLoading } = useQuery({
    queryKey: ["campaigns", "marketplace", { search, platform, page }],
    queryFn: () => campaignApi.list({ search: search || undefined, platform: platform === "any" ? undefined : platform, page, limit: 12 }),
  });

  const total = data?.pagination.total ?? 0;
  const pageResults = data?.data ?? [];

  // Status, Location, Budget, Follower/Engagement requirement, and
  // Collaboration Type have no server-side param, so these are real
  // fields/computed signals filtered honestly on whatever page is
  // currently loaded.
  const filteredResults = pageResults.filter((c) => {
    if (!matchesStatus(c, status)) return false;
    if (location && !c.location?.toLowerCase().includes(location.toLowerCase())) return false;
    if (minBudget !== "any" && c.budgetMax < minBudget) return false;
    if (minFollowers !== "any" && (c.minFollowers ?? 0) < minFollowers) return false;
    if (minEngagement !== "any" && (c.minEngagementRate ?? 0) < minEngagement) return false;
    if (collabType !== "any" && c.collaborationType !== collabType) return false;
    return true;
  });

  const sortedResults = (() => {
    if (sort === "recommended") return filteredResults;
    const copy = [...filteredResults];
    if (sort === "newest") return copy.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    if (sort === "budget") return copy.sort((a, b) => b.budgetMax - a.budgetMax);
    return copy.sort((a, b) => {
      const da = deadlineOf(a);
      const db = deadlineOf(b);
      if (!da) return 1;
      if (!db) return -1;
      return new Date(da).getTime() - new Date(db).getTime();
    });
  })();

  // Real-data-only "Featured" pick — prefers the platform's own isFeatured
  // flag; falls back to the highest real budget among open campaigns on
  // page 1. Never a fabricated/curated placement.
  const featured =
    page === 1 && !isLoading
      ? filteredResults.find((c) => c.isFeatured) ?? [...filteredResults].filter((c) => c.status === "open").sort((a, b) => b.budgetMax - a.budgetMax).find((c) => c.budgetMax > 0)
      : undefined;
  const gridResults = featured ? sortedResults.filter((c) => c._id !== featured._id) : sortedResults;

  return (
    <div>
      <DirectoryTabs />

      <div className="bg-[#F7F8F5]">
        {/* Header */}
        <div className="border-b border-[#E5E7EB] bg-[#F7F8F5] py-10 sm:py-14">
          <div className="container">
            <p className="text-xs font-medium text-[#9CA3AF]">
              <Link to="/" className="hover:text-[#111111]">
                Home
              </Link>{" "}
              / <span className="text-[#6B7280]">Campaigns</span>
            </p>
            <h1 className="mt-3 max-w-2xl text-3xl font-extrabold tracking-tight text-[#111111] sm:text-4xl">Find campaigns that match your influence.</h1>
            <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-[#6B7280]">
              Explore campaigns from brands looking for creators, agencies and partners to help them grow.
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
                placeholder="Search campaigns, brands, categories..."
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

            {/* Platform navigation — real CampaignPlatform enum, same one the
                server-side `platform` param matches against. */}
            <ScrollableChipRow className="mt-5">
              <PillTab label="All Platforms" checked={platform === "any"} onChange={() => { setPlatform("any"); resetPage(); }} />
              {CAMPAIGN_PLATFORMS.map((p) => (
                <PillTab key={p} label={platformMeta(p).label} checked={platform === p} onChange={() => { setPlatform(p); resetPage(); }} />
              ))}
            </ScrollableChipRow>

            {/* Status tabs — compact second-level filter, real Campaign
                status plus computed starting-soon/ending-soon windows. */}
            <div className="mt-4 flex flex-wrap gap-1 border-b border-[#E5E7EB] pb-0.5">
              {STATUS_TABS.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => { setStatus(t.value); resetPage(); }}
                  className={cn(
                    "relative px-3 py-2 text-[13px] font-medium transition-colors",
                    status === t.value ? "text-[#111111]" : "text-[#6B7280] hover:text-[#111111]"
                  )}
                >
                  {t.label}
                  {status === t.value && <span className="absolute inset-x-2 -bottom-[1px] h-[2px] rounded-full bg-[#B6FF00]" />}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main layout */}
        <div className="container grid grid-cols-1 items-start gap-6 py-6 lg:grid-cols-[260px_1fr]">
          <FilterSidebar
            className="hidden lg:block"
            location={location}
            setLocation={(v) => { setLocation(v); resetPage(); }}
            minBudget={minBudget}
            setMinBudget={(v) => { setMinBudget(v); resetPage(); }}
            minFollowers={minFollowers}
            setMinFollowers={(v) => { setMinFollowers(v); resetPage(); }}
            minEngagement={minEngagement}
            setMinEngagement={(v) => { setMinEngagement(v); resetPage(); }}
            collabType={collabType}
            setCollabType={(v) => { setCollabType(v); resetPage(); }}
            onApply={resetPage}
            onClear={clearFilters}
          />

          <div className="min-w-0">
            {/* Results header */}
            <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-[#111111]">Explore Campaigns</h2>
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
                {featured && <FeaturedCampaignCard campaign={featured} />}

                <div className={view === "grid" ? "grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3" : "flex flex-col gap-4"}>
                  {gridResults.map((c) => (
                    <CampaignMarketCard key={c._id} campaign={c} layout={view} />
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
              location={location}
              setLocation={(v) => { setLocation(v); resetPage(); }}
              minBudget={minBudget}
              setMinBudget={(v) => { setMinBudget(v); resetPage(); }}
              minFollowers={minFollowers}
              setMinFollowers={(v) => { setMinFollowers(v); resetPage(); }}
              minEngagement={minEngagement}
              setMinEngagement={(v) => { setMinEngagement(v); resetPage(); }}
              collabType={collabType}
              setCollabType={(v) => { setCollabType(v); resetPage(); }}
              onApply={() => { resetPage(); setMobileFiltersOpen(false); }}
              onClear={clearFilters}
            />
          </MobileFilterDrawer>
        )}
      </div>
    </div>
  );
}

// ============================================================
// Filter sidebar — Platform and Status are already covered by the top nav
// (real, server-backed / computed). Location, Budget, Follower Requirement,
// Engagement Requirement, and Collaboration Type are real Campaign fields
// with no server param for this endpoint, so they're applied honestly to
// whichever page is currently loaded. Industry, Campaign Duration bucket,
// and Audience from the original brief have no real backing and were left
// out rather than built as non-functional controls.
// ============================================================
function FilterSidebar({
  className,
  location,
  setLocation,
  minBudget,
  setMinBudget,
  minFollowers,
  setMinFollowers,
  minEngagement,
  setMinEngagement,
  collabType,
  setCollabType,
  onApply,
  onClear,
}: {
  className?: string;
  location: string;
  setLocation: (v: string) => void;
  minBudget: number | "any";
  setMinBudget: (v: number | "any") => void;
  minFollowers: number | "any";
  setMinFollowers: (v: number | "any") => void;
  minEngagement: number | "any";
  setMinEngagement: (v: number | "any") => void;
  collabType: CollaborationType | "any";
  setCollabType: (v: CollaborationType | "any") => void;
  onApply: () => void;
  onClear: () => void;
}) {
  return (
    <aside className={cn("rounded-[20px] border border-[#E5E7EB] bg-white p-5 lg:sticky lg:top-24", className)}>
      <h3 className="text-sm font-bold text-[#111111]">Filter Campaigns</h3>

      <FilterSection title="Location">
        <input
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="City, state..."
          className="h-9 w-full rounded-lg border border-[#E5E7EB] px-3 text-[13px] text-[#111111] placeholder:text-[#9CA3AF] focus:border-[#B6FF00] focus:outline-none"
        />
      </FilterSection>

      <FilterSection title="Budget">
        <div className="space-y-1">
          <RadioRow label="Any Budget" checked={minBudget === "any"} onChange={() => setMinBudget("any")} />
          {BUDGET_OPTIONS.map((o) => (
            <RadioRow key={o.value} label={o.label} checked={minBudget === o.value} onChange={() => setMinBudget(o.value)} />
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Follower Requirement">
        <div className="space-y-1">
          <RadioRow label="Any" checked={minFollowers === "any"} onChange={() => setMinFollowers("any")} />
          {FOLLOWER_OPTIONS.map((o) => (
            <RadioRow key={o.value} label={o.label} checked={minFollowers === o.value} onChange={() => setMinFollowers(o.value)} />
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Engagement Requirement">
        <div className="space-y-1">
          <RadioRow label="Any" checked={minEngagement === "any"} onChange={() => setMinEngagement("any")} />
          {ENGAGEMENT_OPTIONS.map((o) => (
            <RadioRow key={o.value} label={o.label} checked={minEngagement === o.value} onChange={() => setMinEngagement(o.value)} />
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Collaboration Type" last>
        <div className="space-y-1">
          <RadioRow label="Any Type" checked={collabType === "any"} onChange={() => setCollabType("any")} />
          {COLLABORATION_TYPES.map((c) => (
            <RadioRow key={c} label={COLLAB_LABELS[c]} checked={collabType === c} onChange={() => setCollabType(c)} />
          ))}
        </div>
      </FilterSection>

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

function FilterSection({ title, children, last = false }: { title: string; children: React.ReactNode; last?: boolean }) {
  return (
    <div className={cn("mt-4 border-t border-[#E5E7EB] pt-4", last && "")}>
      <p className="mb-2 text-xs font-semibold text-[#111111]">{title}</p>
      {children}
    </div>
  );
}

function RadioRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 rounded-lg px-1.5 py-1 text-sm text-[#4B5563] transition-colors hover:bg-[#F1F3EF]">
      <span
        className={cn(
          "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-colors",
          checked ? "border-[#B6FF00] bg-[#B6FF00]" : "border-[#D1D5DB] bg-white"
        )}
      >
        {checked && <span className="h-1.5 w-1.5 rounded-full bg-[#111111]" />}
      </span>
      <input type="radio" checked={checked} onChange={onChange} className="sr-only" />
      <span className={checked ? "font-medium text-[#111111]" : undefined}>{label}</span>
    </label>
  );
}

function PillTab({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      onClick={onChange}
      aria-pressed={checked}
      className={cn(
        "shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors",
        checked ? "bg-[#F1FFD6] text-[#111111]" : "text-[#6B7280] hover:bg-[#F1F3EF] hover:text-[#111111]"
      )}
    >
      {label}
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
// Status badge
// ============================================================
function CampaignStatusBadge({ campaign }: { campaign: Campaign }) {
  if (campaign.status === "closed") {
    return <span className="rounded-full bg-[#F1F3EF] px-2.5 py-1 text-[10.5px] font-bold text-[#6B7280]">COMPLETED</span>;
  }
  if (isStartingSoon(campaign)) {
    return <span className="rounded-full bg-[#EFF6FF] px-2.5 py-1 text-[10.5px] font-bold text-[#2563EB]">STARTING SOON</span>;
  }
  if (isEndingSoon(campaign)) {
    return <span className="rounded-full bg-[#FFF7ED] px-2.5 py-1 text-[10.5px] font-bold text-[#B45309]">ENDING SOON</span>;
  }
  return <span className="rounded-full bg-[#ECFDF3] px-2.5 py-1 text-[10.5px] font-bold text-[#16A34A]">LIVE</span>;
}

// ============================================================
// Campaign thumbnail — the brand's own uploaded image when set, else a flat
// platform-brand-color banner with the lead platform's icon (never a
// fabricated stock photo).
// ============================================================
function CampaignThumbnail({ campaign, className }: { campaign: Campaign; className?: string }) {
  const meta = platformMeta(campaign.platforms[0] ?? "other");
  const Icon = meta.icon;
  return (
    <div className={cn("relative flex aspect-[16/10] w-full items-center justify-center overflow-hidden rounded-t-[20px]", className)} style={{ backgroundColor: campaign.imageUrl ? undefined : `${meta.color}14` }}>
      {campaign.imageUrl ? (
        <img
          src={campaign.imageUrl}
          alt={campaign.title}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-[220ms] group-hover:scale-[1.02]"
        />
      ) : (
        <Icon className="h-9 w-9 transition-transform duration-[220ms] group-hover:scale-[1.05]" style={{ color: meta.color }} />
      )}
    </div>
  );
}

function budgetLabel(c: Campaign) {
  if (c.budgetMin <= 0 && c.budgetMax <= 0) return "Budget on request";
  if (c.budgetMax > c.budgetMin) return `${formatCurrency(c.budgetMin, c.currency as "INR" | "USD")} - ${formatCurrency(c.budgetMax, c.currency as "INR" | "USD")}`;
  return formatCurrency(c.budgetMin, c.currency as "INR" | "USD");
}

function deadlineLabel(c: Campaign) {
  const deadline = deadlineOf(c);
  if (c.status === "closed") return "Completed";
  if (!deadline) return "Open-ended";
  const left = daysLeft(deadline);
  if (left <= 0) return "Closing today";
  return `${left}d left`;
}

// Real requirement chips only — minFollowers/minEngagementRate are the
// brand's stated targeting criteria, not a claim about any influencer.
function RequirementChips({ campaign }: { campaign: Campaign }) {
  const chips: string[] = [];
  if (campaign.minFollowers) chips.push(`${getFollowerTier(campaign.minFollowers) ?? formatCurrency(campaign.minFollowers).replace("₹", "")}+ Followers`);
  if (campaign.minEngagementRate) chips.push(`${campaign.minEngagementRate}%+ Engagement`);
  if (campaign.influencerCategory) chips.push(campaign.influencerCategory);
  if (campaign.niche) chips.push(campaign.niche);
  if (campaign.collaborationType) chips.push(COLLAB_LABELS[campaign.collaborationType]);
  if (chips.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {chips.slice(0, 4).map((c) => (
        <span key={c} className="rounded-full bg-[#F1F3EF] px-2 py-0.5 text-[10.5px] font-medium text-[#4B5563]">
          {c}
        </span>
      ))}
    </div>
  );
}

// ============================================================
// Campaign card (grid + list layouts) — exported so the Campaign Detail
// page's "More Campaigns" section can reuse this exact card instead of
// building a second, different-looking one.
// ============================================================
export function CampaignMarketCard({ campaign, layout }: { campaign: Campaign; layout: "grid" | "list" }) {
  const employer = typeof campaign.employer === "object" ? campaign.employer : undefined;
  const hasSpots = !!campaign.collaboratorsMin || !!campaign.collaboratorsMax;

  return (
    <Link
      to={`/campaigns/${campaign._id}`}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-[20px] border border-[#E5E7EB] bg-white transition-all duration-[220ms] hover:-translate-y-[3px] hover:border-[#B6FF00] hover:shadow-[0_20px_40px_-24px_rgba(17,17,17,0.18)]",
        layout === "list" && "sm:flex-row sm:items-stretch"
      )}
    >
      {campaign.isDemo && <DemoBadge />}
      <div className={cn("relative", layout === "list" && "sm:w-64 sm:shrink-0")}>
        <CampaignThumbnail campaign={campaign} className={layout === "list" ? "rounded-t-[20px] sm:h-full sm:rounded-l-[20px] sm:rounded-tr-none" : undefined} />
        <div className="absolute left-3 top-3">
          <CampaignStatusBadge campaign={campaign} />
        </div>
        <div onClick={(e) => e.preventDefault()} className="absolute right-3 top-3 opacity-0 transition-opacity group-hover:opacity-100">
          <SaveButton type="campaign" id={campaign._id} className="h-8 w-8 bg-white/95 text-[#6B7280] hover:bg-white" />
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-center gap-2">
          <Avatar className="h-6 w-6 shrink-0">
            <AvatarImage src={employer?.avatar} alt={employer?.name ?? campaign.companyName} />
            <AvatarFallback className="bg-[#111111] text-[9px] font-semibold text-white">{initialsFromName(employer?.name ?? campaign.companyName)}</AvatarFallback>
          </Avatar>
          <span className="truncate text-[12px] font-semibold text-[#111111]">{employer?.name ?? campaign.companyName}</span>
          {employer?.isVerified && <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-[#2563EB]" />}
          {!!employer?.reviewCount && (
            <span className="ml-auto flex shrink-0 items-center gap-0.5 text-[11px] text-[#9CA3AF]">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" /> {employer.rating?.toFixed(1)}
            </span>
          )}
        </div>

        <h3 className="mt-2 line-clamp-2 text-sm font-bold leading-snug text-[#111111]">{campaign.title}</h3>
        <p className="mt-1.5 line-clamp-2 text-[12.5px] leading-relaxed text-[#6B7280]">{campaign.description}</p>

        <div className="mt-3 grid grid-cols-2 gap-x-2 gap-y-2 rounded-xl bg-[#F7F8F5] p-2.5 text-[11px]">
          <div className="flex min-w-0 items-center gap-1.5">
            <Wallet className="h-3 w-3 shrink-0 text-[#6B7280]" />
            <div className="min-w-0">
              <p className="truncate font-semibold text-[#111111]">{budgetLabel(campaign)}</p>
              <p className="text-[9px] uppercase tracking-wide text-[#9CA3AF]">Budget</p>
            </div>
          </div>
          <div className="flex min-w-0 items-center gap-1.5">
            <CalendarClock className="h-3 w-3 shrink-0 text-[#6B7280]" />
            <div className="min-w-0">
              <p className="truncate font-semibold text-[#111111]">{deadlineLabel(campaign)}</p>
              <p className="text-[9px] uppercase tracking-wide text-[#9CA3AF]">Deadline</p>
            </div>
          </div>
          {hasSpots && (
            <div className="flex min-w-0 items-center gap-1.5">
              <Users className="h-3 w-3 shrink-0 text-[#6B7280]" />
              <div className="min-w-0">
                <p className="truncate font-semibold text-[#111111]">{campaign.collaboratorsMin || 1}–{campaign.collaboratorsMax || campaign.collaboratorsMin} creators</p>
                <p className="text-[9px] uppercase tracking-wide text-[#9CA3AF]">Spots</p>
              </div>
            </div>
          )}
          {campaign.deliverables && (
            <div className="flex min-w-0 items-center gap-1.5">
              <FileText className="h-3 w-3 shrink-0 text-[#6B7280]" />
              <div className="min-w-0">
                <p className="truncate font-semibold text-[#111111]">{campaign.deliverables}</p>
                <p className="text-[9px] uppercase tracking-wide text-[#9CA3AF]">Deliverable</p>
              </div>
            </div>
          )}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          {campaign.platforms.map((p) => {
            const pMeta = platformMeta(p);
            const PIcon = pMeta.icon;
            return (
              <span key={p} className="flex h-6 w-6 items-center justify-center rounded-full bg-[#F1F3EF]" title={pMeta.label}>
                <PIcon className="h-3 w-3" style={{ color: pMeta.color }} />
              </span>
            );
          })}
        </div>

        <div className="mt-3">
          <RequirementChips campaign={campaign} />
        </div>

        <div className="mt-auto flex items-center justify-between gap-2 pt-3.5">
          <span className="text-[11px] text-[#9CA3AF]">{campaign.applicationsCount > 0 ? `${campaign.applicationsCount} applications` : "New campaign"}</span>
          <span className="flex items-center gap-1 text-xs font-semibold text-[#111111] group-hover:underline">
            Apply Now <ArrowRight className="h-3 w-3" />
          </span>
        </div>
      </div>
    </Link>
  );
}

// ============================================================
// Featured campaign — real isFeatured flag when set, else the highest real
// budget among open campaigns on page 1. Clearly not a fabricated pick.
// ============================================================
function FeaturedCampaignCard({ campaign }: { campaign: Campaign }) {
  const employer = typeof campaign.employer === "object" ? campaign.employer : undefined;

  return (
    <div className="relative mb-5 flex flex-col gap-5 rounded-[20px] border border-[#E5E7EB] bg-white p-5 shadow-[0_2px_8px_rgba(17,17,17,0.04)] sm:flex-row sm:items-center">
      {campaign.isDemo && <DemoBadge />}
      <div className="sm:w-72 sm:shrink-0">
        <CampaignThumbnail campaign={campaign} className="rounded-[16px]" />
      </div>

      <div className="min-w-0 flex-1">
        <span className="mb-1.5 inline-flex items-center gap-1 rounded-full bg-[#ECFDF3] px-2.5 py-1 text-[10.5px] font-bold text-[#16A34A]">
          <Sparkles className="h-3 w-3" /> Featured Campaign
        </span>
        <h3 className="text-lg font-bold leading-snug text-[#111111]">{campaign.title}</h3>

        <div className="mt-2 flex items-center gap-2">
          <Avatar className="h-6 w-6">
            <AvatarImage src={employer?.avatar} alt={employer?.name ?? campaign.companyName} />
            <AvatarFallback className="bg-[#111111] text-[10px] font-semibold text-white">{initialsFromName(employer?.name ?? campaign.companyName)}</AvatarFallback>
          </Avatar>
          <span className="text-sm font-semibold text-[#111111]">{employer?.name ?? campaign.companyName}</span>
          {employer?.isVerified && <BadgeCheck className="h-3.5 w-3.5 text-[#2563EB]" />}
        </div>

        <p className="mt-2 line-clamp-2 max-w-xl text-[13px] leading-relaxed text-[#6B7280]">{campaign.description}</p>

        <div className="mt-3">
          <RequirementChips campaign={campaign} />
        </div>
      </div>

      <div className="flex shrink-0 flex-col items-start gap-3 sm:items-end">
        <div className="text-left sm:text-right">
          <p className="text-[11px] text-[#9CA3AF]">Budget</p>
          <p className="text-lg font-extrabold text-[#111111]">{budgetLabel(campaign)}</p>
          <p className="text-[11px] text-[#6B7280]">{deadlineLabel(campaign)}</p>
        </div>
        <div className="flex items-center gap-2">
          <div onClick={(e) => e.preventDefault()}>
            <SaveButton type="campaign" id={campaign._id} className="h-9 w-9 border border-[#E5E7EB] bg-white text-[#6B7280] hover:bg-[#F1F3EF]" />
          </div>
          <Link
            to={`/campaigns/${campaign._id}`}
            className="flex items-center justify-center gap-1 rounded-full bg-[#111111] px-5 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-[#B6FF00] hover:text-[#111111]"
          >
            Apply Now <ArrowRight className="h-3 w-3" />
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
        <Megaphone className="h-5 w-5" />
      </span>
      <p className="text-base font-bold text-[#111111]">No campaigns found</p>
      <p className="max-w-xs text-sm text-[#6B7280]">Try changing your filters or searching for another campaign category.</p>
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
        <div key={i} className="overflow-hidden rounded-[20px] border border-[#E5E7EB] bg-white">
          <Skeleton className="aspect-[16/10] w-full rounded-none bg-[#EDEFEA]" />
          <div className="p-4">
            <div className="flex items-center gap-2">
              <Skeleton className="h-6 w-6 shrink-0 rounded-full bg-[#EDEFEA]" />
              <Skeleton className="h-3 w-20 bg-[#EDEFEA]" />
            </div>
            <Skeleton className="mt-3 h-4 w-full bg-[#EDEFEA]" />
            <Skeleton className="mt-1.5 h-4 w-2/3 bg-[#EDEFEA]" />
            <Skeleton className="mt-3 h-12 w-full rounded-xl bg-[#EDEFEA]" />
            <Skeleton className="mt-3 h-3 w-24 bg-[#EDEFEA]" />
          </div>
        </div>
      ))}
    </div>
  );
}
