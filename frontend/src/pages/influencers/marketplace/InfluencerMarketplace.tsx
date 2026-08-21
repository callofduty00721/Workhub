import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  BadgeCheck,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Facebook,
  Globe,
  Instagram,
  LayoutGrid,
  List,
  Linkedin,
  Loader2,
  MapPin,
  Music2,
  Search,
  Send,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Star,
  Twitter,
  Users,
  X,
  Youtube,
  type LucideIcon,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { SaveButton } from "@/components/shared/SaveButton";
import { Pagination } from "@/components/shared/Pagination";
import { DirectoryTabs } from "@/pages/profiles/DirectoryTabs";
import { influencerApi, type InfluencerSort } from "@/api/influencers";
import { chatApi } from "@/api/chat";
import { useAuth } from "@/context/AuthContext";
import { INFLUENCER_CATEGORIES, INFLUENCER_CATEGORY_NAMES } from "@/lib/mockData";
import { cn, formatCompactNumber, formatCurrency, getFollowerTier, initialsFromName } from "@/lib/utils";
import type { InfluencerSummary } from "@/types";

// Same free-text platform field the rest of the app matches
// case-insensitively — common canonical spellings, not a fixed enum.
const PLATFORM_TABS = ["Instagram", "YouTube", "LinkedIn", "Twitter", "TikTok", "Facebook"];

const PLATFORM_META: Record<string, { icon: LucideIcon; color: string }> = {
  instagram: { icon: Instagram, color: "#E1306C" },
  youtube: { icon: Youtube, color: "#FF0000" },
  linkedin: { icon: Linkedin, color: "#0A66C2" },
  twitter: { icon: Twitter, color: "#111111" },
  x: { icon: Twitter, color: "#111111" },
  "x (twitter)": { icon: Twitter, color: "#111111" },
  tiktok: { icon: Music2, color: "#111111" },
  facebook: { icon: Facebook, color: "#1877F2" },
};

function platformMeta(name: string) {
  return PLATFORM_META[name.trim().toLowerCase()] ?? { icon: Globe, color: "#6B7280" };
}

const RATING_OPTIONS = [
  { label: "Any Rating", value: "any" },
  { label: "4.0 & up", value: "4" },
  { label: "3.0 & up", value: "3" },
  { label: "2.0 & up", value: "2" },
];

// Standard creator-tier brackets — "Mega" is open-ended, sent to the API as
// minFollowers only (no maxFollowers).
const FOLLOWER_RANGE_OPTIONS = [
  { min: 1_000, max: 10_000, label: "Nano · 1K–10K" },
  { min: 10_000, max: 100_000, label: "Micro · 10K–100K" },
  { min: 100_000, max: 500_000, label: "Mid · 100K–500K" },
  { min: 500_000, max: 1_000_000, label: "Macro · 500K–1M" },
  { min: 1_000_000, max: Infinity, label: "Mega · 1M+" },
];

// A ceiling, not a range — matches maxBudget's real semantics on the backend
// (keep every influencer whose cheapest rate-card entry is at or under this).
const BUDGET_OPTIONS = [
  { label: "Under ₹5,000", value: "5000" },
  { label: "Under ₹20,000", value: "20000" },
  { label: "Under ₹50,000", value: "50000" },
  { label: "Under ₹1,00,000", value: "100000" },
];

const SORT_OPTIONS: { label: string; value: InfluencerSort }[] = [
  { label: "Best Match", value: "match" },
  { label: "Newest", value: "newest" },
  { label: "Top Rated", value: "rating" },
  { label: "Most Reviewed", value: "reviews" },
  { label: "Most Followers", value: "followers" },
  { label: "Most Campaigns", value: "campaigns" },
];

function totalFollowersOf(influencer: InfluencerSummary) {
  const platforms = influencer.influencerProfile?.platforms ?? [];
  return influencer.totalFollowers ?? platforms.reduce((sum, p) => sum + (p.followers ?? 0), 0);
}

function startingPriceOf(influencer: InfluencerSummary) {
  const rates = influencer.influencerProfile?.rateCard ?? [];
  if (rates.length === 0) return undefined;
  return Math.min(...rates.map((r) => r.priceInInr));
}

// Self-contained Influencer browsing page — mirrors the Freelancer/Gig/
// Project/Contest Marketplace pattern (own hero, search, category nav,
// filters, results), real-data-only throughout.
export function InfluencerMarketplace() {
  const [search, setSearch] = useState("");
  const [searchDraft, setSearchDraft] = useState("");
  const [platform, setPlatform] = useState("any");
  const [category, setCategory] = useState("all");
  const [niche, setNiche] = useState("any");
  const [location, setLocation] = useState("");
  const [minRating, setMinRating] = useState("any");
  const [followerRange, setFollowerRange] = useState("any");
  const [maxBudget, setMaxBudget] = useState("any");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [sort, setSort] = useState<InfluencerSort>("match");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [page, setPage] = useState(1);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const resetPage = () => setPage(1);

  const selectCategory = (v: string) => {
    setCategory(v);
    setNiche("any");
    resetPage();
  };

  const clearFilters = () => {
    setPlatform("any");
    setCategory("all");
    setNiche("any");
    setLocation("");
    setMinRating("any");
    setFollowerRange("any");
    setMaxBudget("any");
    setVerifiedOnly(false);
    setSearch("");
    setSearchDraft("");
    resetPage();
  };

  const activeFilterCount = [
    platform !== "any",
    category !== "all",
    niche !== "any",
    !!location,
    minRating !== "any",
    followerRange !== "any",
    maxBudget !== "any",
    verifiedOnly,
  ].filter(Boolean).length;

  const selectedFollowerRange = FOLLOWER_RANGE_OPTIONS.find((r) => r.label === followerRange);

  const { data, isLoading } = useQuery({
    queryKey: ["influencers", "marketplace", { search, platform, category, niche, location, minRating, followerRange, maxBudget, verifiedOnly, sort, page }],
    queryFn: () =>
      influencerApi.list({
        search: search || undefined,
        platform: platform !== "any" ? platform : undefined,
        category: category !== "all" ? category : undefined,
        niche: niche !== "any" ? niche : undefined,
        location: location || undefined,
        minRating: minRating !== "any" ? Number(minRating) : undefined,
        minFollowers: selectedFollowerRange?.min,
        maxFollowers: selectedFollowerRange && Number.isFinite(selectedFollowerRange.max) ? selectedFollowerRange.max : undefined,
        maxBudget: maxBudget !== "any" ? Number(maxBudget) : undefined,
        verifiedOnly: verifiedOnly || undefined,
        sort,
        page,
        limit: 12,
      }),
  });

  const total = data?.pagination.total ?? 0;
  const results = data?.data ?? [];
  // Real-data-only "Featured" pick — largest real audience on page 1, only
  // when it actually has one. No curated/fabricated placement.
  const featured = page === 1 && !isLoading ? [...results].sort((a, b) => totalFollowersOf(b) - totalFollowersOf(a)).find((i) => totalFollowersOf(i) > 0) : undefined;
  const gridResults = featured ? results.filter((i) => i._id !== featured._id) : results;

  const nicheOptions = category !== "all" ? INFLUENCER_CATEGORIES[category] ?? [] : [];

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
              / <span className="text-[#6B7280]">Influencers</span>
            </p>
            <h1 className="mt-3 max-w-2xl text-3xl font-extrabold tracking-tight text-[#111111] sm:text-4xl">Find creators who move audiences.</h1>
            <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-[#6B7280]">
              Discover creators, influencers and content professionals for your next campaign.
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
                placeholder="Search influencers, creators, niches..."
                className="h-10 min-w-0 flex-1 bg-transparent text-sm text-[#111111] placeholder:text-[#9CA3AF] focus:outline-none"
              />
              <button
                type="submit"
                className="shrink-0 rounded-xl bg-[#111111] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#B6FF00] hover:text-[#111111]"
              >
                Search
              </button>
            </form>

            {/* Platform tabs — real, server-side `platform` filter. */}
            <ScrollableChipRow className="mt-5">
              <PillTab label="All" checked={platform === "any"} onChange={() => { setPlatform("any"); resetPage(); }} />
              {PLATFORM_TABS.map((p) => (
                <PillTab key={p} label={p} checked={platform === p} onChange={() => { setPlatform(p); resetPage(); }} />
              ))}
            </ScrollableChipRow>

            {/* Category chips — real INFLUENCER_CATEGORIES taxonomy, same one
                the server-side `category`/`niche` params match against. */}
            <ScrollableChipRow className="mt-2.5">
              <CategoryChip label="All" checked={category === "all"} onChange={() => selectCategory("all")} />
              {INFLUENCER_CATEGORY_NAMES.map((c) => (
                <CategoryChip key={c} label={c} checked={category === c} onChange={() => selectCategory(c)} />
              ))}
            </ScrollableChipRow>

            {nicheOptions.length > 0 && (
              <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                <span className="text-xs font-semibold text-[#9CA3AF]">Niche:</span>
                <CategoryChip label={`All ${category}`} checked={niche === "any"} onChange={() => { setNiche("any"); resetPage(); }} />
                {nicheOptions.map((n) => (
                  <CategoryChip key={n} label={n} checked={niche === n} onChange={() => { setNiche(n); resetPage(); }} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Main layout */}
        <div className="container grid grid-cols-1 items-start gap-6 py-6 lg:grid-cols-[280px_1fr]">
          <FilterSidebar
            className="hidden lg:block"
            location={location}
            setLocation={(v) => { setLocation(v); resetPage(); }}
            minRating={minRating}
            setMinRating={(v) => { setMinRating(v); resetPage(); }}
            followerRange={followerRange}
            setFollowerRange={(v) => { setFollowerRange(v); resetPage(); }}
            maxBudget={maxBudget}
            setMaxBudget={(v) => { setMaxBudget(v); resetPage(); }}
            verifiedOnly={verifiedOnly}
            setVerifiedOnly={(v) => { setVerifiedOnly(v); resetPage(); }}
            onApply={resetPage}
            onClear={clearFilters}
          />

          <div className="min-w-0">
            {/* Results header */}
            <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-[#111111]">Discover Influencers</h2>
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
            ) : results.length === 0 ? (
              <EmptyState onClear={clearFilters} />
            ) : (
              <>
                {featured && <FeaturedCreatorCard influencer={featured} />}

                <div className={view === "grid" ? "grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3" : "flex flex-col gap-4"}>
                  {gridResults.map((i) => (
                    <InfluencerCard key={i._id} influencer={i} layout={view} />
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
              minRating={minRating}
              setMinRating={(v) => { setMinRating(v); resetPage(); }}
              followerRange={followerRange}
              setFollowerRange={(v) => { setFollowerRange(v); resetPage(); }}
              maxBudget={maxBudget}
              setMaxBudget={(v) => { setMaxBudget(v); resetPage(); }}
              verifiedOnly={verifiedOnly}
              setVerifiedOnly={(v) => { setVerifiedOnly(v); resetPage(); }}
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
// Filter sidebar — Platform/Category/Niche are already covered by the top
// nav; Engagement Rate, Audience demographics, Content Type, Language and
// Collaboration Type from the original brief have no real backend support
// (no such fields/params exist), so they're intentionally left out rather
// than built as non-functional controls.
// ============================================================
function FilterSidebar({
  className,
  location,
  setLocation,
  minRating,
  setMinRating,
  followerRange,
  setFollowerRange,
  maxBudget,
  setMaxBudget,
  verifiedOnly,
  setVerifiedOnly,
  onApply,
  onClear,
}: {
  className?: string;
  location: string;
  setLocation: (v: string) => void;
  minRating: string;
  setMinRating: (v: string) => void;
  followerRange: string;
  setFollowerRange: (v: string) => void;
  maxBudget: string;
  setMaxBudget: (v: string) => void;
  verifiedOnly: boolean;
  setVerifiedOnly: (v: boolean) => void;
  onApply: () => void;
  onClear: () => void;
}) {
  return (
    <aside className={cn("rounded-[20px] border border-[#E5E7EB] bg-white p-5 lg:sticky lg:top-24", className)}>
      <h3 className="text-sm font-bold text-[#111111]">Filters</h3>

      <FilterSection title="Location">
        <input
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="City, state..."
          className="h-9 w-full rounded-lg border border-[#E5E7EB] px-3 text-[13px] text-[#111111] placeholder:text-[#9CA3AF] focus:border-[#B6FF00] focus:outline-none"
        />
      </FilterSection>

      <FilterSection title="Followers">
        <div className="space-y-1">
          <RadioRow label="Any Size" checked={followerRange === "any"} onChange={() => setFollowerRange("any")} />
          {FOLLOWER_RANGE_OPTIONS.map((r) => (
            <RadioRow key={r.label} label={r.label} checked={followerRange === r.label} onChange={() => setFollowerRange(r.label)} />
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Rating">
        <div className="space-y-1">
          {RATING_OPTIONS.map((o) => (
            <RadioRow key={o.value} label={o.label} checked={minRating === o.value} onChange={() => setMinRating(o.value)} />
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Budget (starting price)" last>
        <div className="space-y-1">
          <RadioRow label="Any Budget" checked={maxBudget === "any"} onChange={() => setMaxBudget("any")} />
          {BUDGET_OPTIONS.map((o) => (
            <RadioRow key={o.value} label={o.label} checked={maxBudget === o.value} onChange={() => setMaxBudget(o.value)} />
          ))}
        </div>
      </FilterSection>

      <button
        type="button"
        onClick={() => setVerifiedOnly(!verifiedOnly)}
        className={cn(
          "mt-4 flex w-full items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-[13px] font-medium transition-colors",
          verifiedOnly ? "border-[#B6FF00] bg-[#B6FF00]/10 text-[#111111]" : "border-[#E5E7EB] text-[#4B5563] hover:border-[#B6FF00]/50"
        )}
      >
        <ShieldCheck className="h-3.5 w-3.5" />
        Verified Only
      </button>

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
function SortDropdown({ sort, setSort }: { sort: InfluencerSort; setSort: (v: InfluencerSort) => void }) {
  const [open, setOpen] = useState(false);
  const activeLabel = SORT_OPTIONS.find((o) => o.value === sort)?.label ?? "Best Match";

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
        <div className="absolute right-0 top-full z-20 mt-1.5 w-48 overflow-hidden rounded-xl border border-[#E5E7EB] bg-white py-1 shadow-[0_16px_40px_-20px_rgba(17,17,17,0.25)]">
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
// Shared avatar + platform-stats bits
// ============================================================
function CreatorAvatar({ influencer, size = "md" }: { influencer: InfluencerSummary; size?: "md" | "lg" }) {
  const dims = size === "lg" ? "h-16 w-16" : "h-11 w-11";
  return (
    <div className="relative shrink-0">
      <Avatar className={cn(dims, "border border-[#E5E7EB]")}>
        <AvatarImage src={influencer.avatar} alt={influencer.name} />
        <AvatarFallback className="bg-[#111111] font-semibold text-white">{initialsFromName(influencer.name)}</AvatarFallback>
      </Avatar>
      <span
        className={cn(
          "absolute bottom-0 right-0 h-3 w-3 rounded-full ring-2 ring-white",
          influencer.availabilityStatus === "busy" ? "bg-[#9CA3AF]" : "bg-[#16A34A]"
        )}
        title={influencer.availabilityStatus === "busy" ? "Not taking campaigns" : "Available"}
      />
    </div>
  );
}

function SocialStatRow({ platform }: { platform: { platform: string; handle?: string; followers?: number } }) {
  const meta = platformMeta(platform.platform);
  const Icon = meta.icon;
  const unit = platform.platform.trim().toLowerCase() === "youtube" ? "subscribers" : "followers";
  return (
    <div className="flex items-center gap-2">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-white" style={{ backgroundColor: meta.color }}>
        <Icon className="h-3.5 w-3.5" />
      </span>
      <span className="truncate text-[12px] text-[#4B5563]">{platform.platform}</span>
      <span className="ml-auto shrink-0 text-[12px] font-semibold text-[#111111]">
        {platform.followers ? `${formatCompactNumber(platform.followers)} ${unit}` : "—"}
      </span>
    </div>
  );
}

// ============================================================
// Influencer card (grid + list layouts)
// ============================================================
function InfluencerCard({ influencer, layout }: { influencer: InfluencerSummary; layout: "grid" | "list" }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const platforms = influencer.influencerProfile?.platforms ?? [];
  const byFollowers = [...platforms].sort((a, b) => (b.followers ?? 0) - (a.followers ?? 0)).slice(0, 2);
  const total = totalFollowersOf(influencer);
  const tier = getFollowerTier(total);
  const startingPrice = startingPriceOf(influencer);
  const isOwnCard = user?.id === influencer._id;

  const messageMutation = useMutation({
    mutationFn: () => chatApi.getOrCreateConversation(influencer._id),
    onSuccess: (c) => navigate(`/dashboard/messages?c=${c._id}`),
  });

  return (
    <Link
      to={`/influencers/${influencer._id}`}
      className={cn(
        "group flex flex-col rounded-[20px] border border-[#E5E7EB] bg-white p-5 transition-all duration-[220ms] hover:-translate-y-[3px] hover:border-[#B6FF00] hover:shadow-[0_20px_40px_-24px_rgba(17,17,17,0.18)]",
        layout === "list" && "sm:flex-row sm:items-start sm:gap-5"
      )}
    >
      <div className={cn("flex flex-1 flex-col", layout === "list" && "min-w-0")}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-center gap-3">
            <div className="transition-transform duration-[220ms] group-hover:scale-[1.03]">
              <CreatorAvatar influencer={influencer} />
            </div>
            <div className="min-w-0">
              <p className="flex items-center gap-1 truncate text-[14px] font-bold text-[#111111]">
                {influencer.name}
                {influencer.isVerified && <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-[#2563EB]" />}
              </p>
              <p className="truncate text-[12px] text-[#6B7280]">
                {influencer.influencerProfile?.niche || influencer.influencerProfile?.category || influencer.headline || "Creator"}
                {tier && <span className="text-[#9CA3AF]"> · {tier}</span>}
              </p>
              {influencer.location && (
                <span className="flex items-center gap-1 text-[11px] text-[#9CA3AF]">
                  <MapPin className="h-3 w-3" /> {influencer.location}
                </span>
              )}
            </div>
          </div>
          <div onClick={(e) => e.preventDefault()} className="shrink-0">
            <SaveButton type="influencer" id={influencer._id} className="h-7 w-7 bg-[#F1F3EF] text-[#6B7280] hover:bg-[#E5E7EB]" />
          </div>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2 rounded-xl bg-[#F7F8F5] p-2.5 text-center text-[11px]">
          <div>
            <p className="font-bold text-[#111111]">{total > 0 ? formatCompactNumber(total) : "—"}</p>
            <p className="text-[#9CA3AF]">Followers</p>
          </div>
          <div>
            <p className="font-bold text-[#111111]">{influencer.campaignsCompleted ?? 0}</p>
            <p className="text-[#9CA3AF]">Campaigns</p>
          </div>
          <div className="flex flex-col items-center">
            <p className="flex items-center gap-0.5 font-bold text-[#111111]">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              {influencer.reviewCount ? influencer.rating?.toFixed(1) : "—"}
            </p>
            <p className="text-[#9CA3AF]">Rating</p>
          </div>
        </div>

        {byFollowers.length > 0 && (
          <div className="mt-3 space-y-1.5">
            {byFollowers.map((p, i) => (
              <SocialStatRow key={i} platform={p} />
            ))}
          </div>
        )}

        <div className="mt-auto flex items-center justify-between gap-2 pt-3.5">
          <div>
            {startingPrice !== undefined ? (
              <>
                <p className="text-[10px] text-[#9CA3AF]">Starting from</p>
                <p className="text-[13px] font-bold text-[#111111]">{formatCurrency(startingPrice)}</p>
              </>
            ) : (
              <span className="text-[11px] text-[#9CA3AF]">Contact for rates</span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            {!isOwnCard && (
              <button
                type="button"
                disabled={messageMutation.isPending}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  user ? messageMutation.mutate() : navigate("/login");
                }}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-[#E5E7EB] text-[#4B5563] transition-colors hover:border-[#B6FF00] hover:text-[#111111] disabled:opacity-50"
                title="Collaborate"
              >
                {messageMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
              </button>
            )}
            <span className="flex items-center gap-1 rounded-full bg-[#111111] px-3.5 py-2 text-xs font-semibold text-white transition-colors group-hover:bg-[#B6FF00] group-hover:text-[#111111]">
              View Profile <ArrowRight className="h-3 w-3" />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

// ============================================================
// Featured creator — real largest-audience result on page 1, clearly not a
// fabricated pick.
// ============================================================
function FeaturedCreatorCard({ influencer }: { influencer: InfluencerSummary }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const platforms = influencer.influencerProfile?.platforms ?? [];
  const byFollowers = [...platforms].sort((a, b) => (b.followers ?? 0) - (a.followers ?? 0)).slice(0, 3);
  const total = totalFollowersOf(influencer);
  const isOwnCard = user?.id === influencer._id;

  const messageMutation = useMutation({
    mutationFn: () => chatApi.getOrCreateConversation(influencer._id),
    onSuccess: (c) => navigate(`/dashboard/messages?c=${c._id}`),
  });

  return (
    <div className="mb-5 flex flex-col gap-6 rounded-[20px] border border-[#E5E7EB] bg-white p-5 shadow-[0_2px_8px_rgba(17,17,17,0.04)] sm:flex-row sm:items-center">
      <div className="flex items-center gap-4 sm:w-72 sm:shrink-0">
        <CreatorAvatar influencer={influencer} size="lg" />
        <div className="min-w-0">
          <span className="mb-1 inline-flex items-center gap-1 rounded-full bg-[#ECFDF3] px-2.5 py-1 text-[10.5px] font-bold text-[#16A34A]">
            <Sparkles className="h-3 w-3" /> Featured Creator
          </span>
          <p className="flex items-center gap-1 truncate text-base font-bold text-[#111111]">
            {influencer.name}
            {influencer.isVerified && <BadgeCheck className="h-4 w-4 shrink-0 text-[#2563EB]" />}
          </p>
          <p className="truncate text-[12.5px] text-[#6B7280]">
            {influencer.influencerProfile?.niche || influencer.influencerProfile?.category || "Creator"}
          </p>
          {influencer.location && (
            <span className="flex items-center gap-1 text-[11.5px] text-[#9CA3AF]">
              <MapPin className="h-3 w-3" /> {influencer.location}
            </span>
          )}
        </div>
      </div>

      <div className="min-w-0 flex-1 space-y-1.5">
        {byFollowers.map((p, i) => (
          <SocialStatRow key={i} platform={p} />
        ))}
      </div>

      <div className="flex shrink-0 flex-col items-start gap-3 sm:items-end">
        <div className="text-left sm:text-right">
          <p className="text-[11px] text-[#9CA3AF]">Total reach</p>
          <p className="text-xl font-extrabold text-[#111111]">{formatCompactNumber(total)}</p>
        </div>
        <div className="flex items-center gap-2">
          {!isOwnCard && (
            <button
              type="button"
              disabled={messageMutation.isPending}
              onClick={() => (user ? messageMutation.mutate() : navigate("/login"))}
              className="flex items-center justify-center gap-1.5 rounded-full border border-[#E5E7EB] bg-white px-4 py-2.5 text-xs font-semibold text-[#111111] transition-colors hover:bg-[#F1F3EF] disabled:opacity-50"
            >
              {messageMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
              Contact
            </button>
          )}
          <Link
            to={`/influencers/${influencer._id}`}
            className="flex items-center justify-center gap-1 rounded-full bg-[#111111] px-5 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-[#B6FF00] hover:text-[#111111]"
          >
            View Profile <ArrowRight className="h-3 w-3" />
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
        <Users className="h-5 w-5" />
      </span>
      <p className="text-base font-bold text-[#111111]">No creators found</p>
      <p className="max-w-xs text-sm text-[#6B7280]">Try changing your filters or searching for another niche.</p>
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
            <Skeleton className="h-11 w-11 shrink-0 rounded-full bg-[#EDEFEA]" />
            <div className="min-w-0 flex-1">
              <Skeleton className="h-3.5 w-2/3 bg-[#EDEFEA]" />
              <Skeleton className="mt-1.5 h-3 w-1/3 bg-[#EDEFEA]" />
            </div>
          </div>
          <Skeleton className="mt-4 h-12 w-full rounded-xl bg-[#EDEFEA]" />
          <Skeleton className="mt-3 h-3 w-full bg-[#EDEFEA]" />
          <Skeleton className="mt-1.5 h-3 w-2/3 bg-[#EDEFEA]" />
          <Skeleton className="mt-4 h-8 w-24 bg-[#EDEFEA]" />
        </div>
      ))}
    </div>
  );
}
