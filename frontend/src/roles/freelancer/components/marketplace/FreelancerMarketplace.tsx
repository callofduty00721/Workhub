import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Search,
  MapPin,
  Star,
  BadgeCheck,
  X,
  SlidersHorizontal,
  LayoutGrid,
  List,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Loader2,
  Sparkles,
  Briefcase,
  Zap,
  Clock,
  Globe,
  MessageCircle,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DemoBadge } from "@/components/DemoBadge";
import { Slider } from "@/components/ui/slider";
import { Skeleton } from "@/components/ui/skeleton";
import { SaveButton } from "@/components/shared/SaveButton";
import { Pagination } from "@/components/shared/Pagination";
import { freelancerApi, type FreelancerSort } from "@/api/freelancers";
import { chatApi } from "@/api/chat";
import { useAuth } from "@/context/AuthContext";
import { SERVICE_CATEGORIES, SERVICE_CATEGORY_NAMES } from "@/lib/mockData";
import { cn, initialsFromName } from "@/lib/utils";
import { getSkillIcon } from "@/lib/skillIcons";
import type { FreelancerSummary } from "@/types";

const LEVEL_LABEL: Record<string, string> = {
  new: "0.0",
  level_1: "Level 1 ",
  top_rated: "Top Rated",
};

// Display-only trim — the real responseTimeLabel field stores "Under X"
// (e.g. "Under 30 mins"), but the card UI reads cleaner without the prefix.
const shortResponseTime = (label?: string) => label?.replace(/^under\s+/i, "");

const POPULAR_SEARCHES = ["Logo Design", "Full-Stack Development", "Website Design", "Video Editing", "SEO Audits", "Blog Writing"];

const SORT_OPTIONS: { label: string; value: FreelancerSort }[] = [
  { label: "Recommended", value: "best_match" },
  { label: "Top Rated", value: "rating" },
  { label: "Most Experienced", value: "experience" },
  { label: "Newest", value: "newest" },
];

const EXPERIENCE_OPTIONS = [
  { label: "Any experience", value: "any" },
  { label: "1+ years", value: "1" },
  { label: "3+ years", value: "3" },
  { label: "5+ years", value: "5" },
  { label: "10+ years", value: "10" },
];

const RATING_OPTIONS = [
  { label: "Any rating", value: "any" },
  { label: "4.5 & up", value: "4.5" },
  { label: "4.0 & up", value: "4" },
  { label: "3.0 & up", value: "3" },
];

const RATE_MAX = 5000;

export function FreelancerMarketplace() {
  const [search, setSearch] = useState("");
  const [searchDraft, setSearchDraft] = useState("");
  const [category, setCategory] = useState("all");
  const [subCategory, setSubCategory] = useState("all");
  const [experience, setExperience] = useState("any");
  const [availability, setAvailability] = useState<"any" | "available" | "busy">("any");
  const [rateRange, setRateRange] = useState<[number, number]>([0, RATE_MAX]);
  const [location, setLocation] = useState("");
  const [minRating, setMinRating] = useState("any");
  const [sort, setSort] = useState<FreelancerSort>("best_match");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [page, setPage] = useState(1);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const resetPage = () => setPage(1);

  // Switching category invalidates whatever sub-category was picked under the
  // previous one — always reset together so the query never ends up with a
  // subCategory that doesn't belong to the selected category.
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

  const clearFilters = () => {
    setCategory("all");
    setSubCategory("all");
    setExperience("any");
    setAvailability("any");
    setRateRange([0, RATE_MAX]);
    setLocation("");
    setMinRating("any");
    setSearch("");
    setSearchDraft("");
    resetPage();
  };

  const activeFilterCount = [
    category !== "all",
    subCategory !== "all",
    experience !== "any",
    availability !== "any",
    rateRange[0] > 0 || rateRange[1] < RATE_MAX,
    !!location,
    minRating !== "any",
  ].filter(Boolean).length;

  const { data, isLoading } = useQuery({
    queryKey: ["freelancers", "marketplace", { search, category, subCategory, experience, availability, rateRange, location, minRating, sort, page }],
    queryFn: () =>
      freelancerApi.list({
        search: search || undefined,
        category: category === "all" ? undefined : category,
        subCategory: category !== "all" && subCategory !== "all" ? subCategory : undefined,
        location: location || undefined,
        minExperience: experience === "any" ? undefined : Number(experience),
        rateMin: rateRange[0] > 0 ? rateRange[0] : undefined,
        rateMax: rateRange[1] < RATE_MAX ? rateRange[1] : undefined,
        minRating: minRating === "any" ? undefined : Number(minRating),
        availability: availability === "any" ? undefined : availability,
        sort,
        page,
        limit: 12,
      }),
  });

  const total = data?.pagination.total ?? 0;
  const results = data?.data ?? [];
  // Real-data-only "Featured" pick — the single highest-rated result on the
  // current page, and only when it actually has a rating. No fabricated
  // "featured" flag or curated placement.
  const featured = page === 1 && !isLoading ? [...results].sort((a, b) => b.rating - a.rating).find((f) => f.rating > 0) : undefined;
  const gridResults = featured ? results.filter((f) => f._id !== featured._id) : results;

  return (
    <div className="bg-[#F7F8F5]">
      {/* Header */}
      <div className="border-b border-[#E5E7EB] bg-[#F7F8F5] py-4 sm:py-6">
        <div className="container">
          <p className="text-xs font-medium text-[#9CA3AF]">
            <Link to="/" className="hover:text-[#111111]">
              Home
            </Link>{" "}
            / <span className="text-[#6B7280]">Freelancers</span>
          </p>
          <h1 className="mt-3 max-w-3xl text-3xl font-extrabold tracking-tight text-[#111111] sm:text-4xl">
            Find the right talent for your next project.
          </h1>
          <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-[#6B7280]">
            Discover skilled professionals, explore their expertise and connect directly.
          </p>

          {/* Search */}
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
              placeholder="Search freelancers, skills or services..."
              className="h-10 flex-1 min-w-0 bg-transparent text-sm text-[#111111] placeholder:text-[#9CA3AF] focus:outline-none"
            />
            <button
              type="submit"
              className="shrink-0 rounded-xl bg-[#111111] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#B6FF00] hover:text-[#111111]"
            >
              Search
            </button>
          </form>

          {/* Category navigation — same pill-chip pattern as the Gig
              Marketplace. Picking one expands a full section-grouped
              subcategory browser right below it (real 3-level taxonomy:
              Category -> Section -> skill), instead of a cramped flat list
              buried in the sidebar. */}

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
          <div className="mt-6">
            <ScrollableChipRow>
              <CategoryChip label="All" checked={category === "all"} onChange={() => selectCategory("all")} />
              {SERVICE_CATEGORY_NAMES.map((c) => (
                <CategoryChip key={c} label={c} checked={category === c} onChange={() => selectCategory(c)} />
              ))}
            </ScrollableChipRow>
          </div>
          {category !== "all" && subCategory === "all" && (
            <SubcategoryPanel
              category={category}
              subCategory={subCategory}
              onSelect={(sub) => selectSubCategory(category, sub)}
              onViewAll={() => selectCategory(category)}
            />
          )}
        </div>
      </div>

      {/* Main layout */}
      <div className="container grid grid-cols-1 items-start gap-6 py-6 lg:grid-cols-[280px_1fr]">
        <FilterSidebar
          className="hidden lg:block"
          category={category}
          subCategory={subCategory}
          experience={experience}
          setExperience={(v) => { setExperience(v); resetPage(); }}
          availability={availability}
          setAvailability={(v) => { setAvailability(v); resetPage(); }}
          rateRange={rateRange}
          setRateRange={setRateRange}
          location={location}
          setLocation={(v) => { setLocation(v); resetPage(); }}
          minRating={minRating}
          setMinRating={(v) => { setMinRating(v); resetPage(); }}
          onApply={resetPage}
          onClear={clearFilters}
        />

        <div className="min-w-0">
          {/* Results header */}
          <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-[#111111]">{total > 0 ? "Freelancers" : "Explore freelancers"}</h2>
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
              {featured && <FeaturedFreelancerCard freelancer={featured} />}

              <div className={view === "grid" ? "grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-2" : "flex flex-col gap-4"}>
                {gridResults.map((f) => (
                  <FreelancerCard key={f._id} freelancer={f} layout={view} />
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
            category={category}
            subCategory={subCategory}
            experience={experience}
            setExperience={(v) => { setExperience(v); resetPage(); }}
            availability={availability}
            setAvailability={(v) => { setAvailability(v); resetPage(); }}
            rateRange={rateRange}
            setRateRange={setRateRange}
            location={location}
            setLocation={(v) => { setLocation(v); resetPage(); }}
            minRating={minRating}
            setMinRating={(v) => { setMinRating(v); resetPage(); }}
            onApply={() => { resetPage(); setMobileFiltersOpen(false); }}
            onClear={clearFilters}
          />
        </MobileFilterDrawer>
      )}
    </div>
  );
}

// ============================================================
// Filter sidebar — real filters only (category, experience, availability,
// hourly rate, location, rating). No "Skills"/"Languages" sections: the
// freelancer search API has no field to filter by either, and a control that
// doesn't actually filter anything would be a fake affordance.
// ============================================================
function FilterSidebar({
  className,
  category,
  subCategory,
  experience,
  setExperience,
  availability,
  setAvailability,
  rateRange,
  setRateRange,
  location,
  setLocation,
  minRating,
  setMinRating,
  onApply,
  onClear,
}: {
  className?: string;
  category: string;
  subCategory: string;
  experience: string;
  setExperience: (v: string) => void;
  availability: "any" | "available" | "busy";
  setAvailability: (v: "any" | "available" | "busy") => void;
  rateRange: [number, number];
  setRateRange: (v: [number, number]) => void;
  location: string;
  setLocation: (v: string) => void;
  minRating: string;
  setMinRating: (v: string) => void;
  onApply: () => void;
  onClear: () => void;
}) {
  return (
    <aside className={cn("rounded-[20px] border border-[#E5E7EB] bg-white p-5 lg:sticky lg:top-24", className)}>
      <h3 className="text-sm font-bold text-[#111111]">Filters</h3>

      {category !== "all" && (
        <FilterSection title="Filtering by">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#B6FF00] bg-[#B6FF00]/10 px-3 py-1.5 text-xs font-medium text-[#111111]">
            {subCategory === "all" ? category : subCategory}
          </span>
        </FilterSection>
      )}

      <FilterSection title="Experience">
        <div className="space-y-1">
          {EXPERIENCE_OPTIONS.map((o) => (
            <RadioRow key={o.value} label={o.label} checked={experience === o.value} onChange={() => setExperience(o.value)} />
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Availability">
        <div className="space-y-1">
          <RadioRow label="Any availability" checked={availability === "any"} onChange={() => setAvailability("any")} />
          <RadioRow label="Available now" checked={availability === "available"} onChange={() => setAvailability("available")} />
          <RadioRow label="Currently busy" checked={availability === "busy"} onChange={() => setAvailability("busy")} />
        </div>
      </FilterSection>

      <FilterSection title="Hourly Rate">
        <div className="px-1">
          <Slider
            min={0}
            max={RATE_MAX}
            step={100}
            value={rateRange}
            onValueChange={(v) => setRateRange([v[0], v[1]] as [number, number])}
            className="[&_[data-radix-slider-range]]:bg-[#B6FF00] [&_[data-radix-slider-thumb]]:border-[#B6FF00]"
          />
          <div className="mt-2 flex items-center justify-between text-xs font-medium text-[#6B7280]">
            <span>₹{rateRange[0].toLocaleString()}</span>
            <span>₹{rateRange[1].toLocaleString()}{rateRange[1] === RATE_MAX ? "+" : ""}/hr</span>
          </div>
        </div>
      </FilterSection>

      <FilterSection title="Location">
        <input
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="City or country"
          className="h-9 w-full rounded-lg border border-[#E5E7EB] bg-white px-3 text-sm text-[#111111] placeholder:text-[#9CA3AF] focus:border-[#B6FF00] focus:outline-none"
        />
      </FilterSection>

      <FilterSection title="Rating" last>
        <div className="space-y-1">
          {RATING_OPTIONS.map((o) => (
            <RadioRow key={o.value} label={o.label} checked={minRating === o.value} onChange={() => setMinRating(o.value)} />
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

// Horizontal chip variant — used for Category and Sub-category, where a
// wrapping row of pills reads faster and takes less vertical space than a
// long radio list.
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

// Full-width, section-grouped subcategory browser shown below the category
// nav once a category is picked — real 3-level taxonomy (Category -> Section
// -> skill) from SERVICE_CATEGORIES, same data that already backs the
// freelancer's own category/sub-category profile fields. Replaces a cramped
// flat chip list that used to be buried in the filter sidebar.
function SubcategoryPanel({
  category,
  subCategory,
  onSelect,
  onViewAll,
}: {
  category: string;
  subCategory: string;
  onSelect: (sub: string) => void;
  onViewAll: () => void;
}) {
  const sections = Object.entries(SERVICE_CATEGORIES[category] ?? {});
  if (sections.length === 0) return null;

  return (
    <div className="mt-0.1 rounded-[20px] border border-[#E5E7EB] bg-white p-4">
      <div className="grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-3 lg:grid-cols-4">
        {sections.map(([section, skills]) => (
          <div key={section} className="min-w-0">
            <p className="mb-1.5 truncate text-xs font-semibold text-[#111111]">{section}</p>
            <div className="flex flex-col">
              {skills.map((skill) => (
                <button
                  key={skill}
                  type="button"
                  onClick={() => onSelect(skill)}
                  className={cn(
                    "truncate rounded-md px-1.5 py-1 text-left text-sm transition-colors hover:bg-[#F1FFD6] hover:text-[#111111]",
                    subCategory === skill ? "font-semibold text-[#111111]" : "text-[#6B7280]"
                  )}
                >
                  {skill}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={onViewAll}
        className="mt-5 inline-flex items-center gap-1 text-xs font-semibold text-[#111111] hover:underline"
      >
        View all {category} freelancers <ArrowRight className="h-3 w-3" />
      </button>
    </div>
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
function SortDropdown({ sort, setSort }: { sort: FreelancerSort; setSort: (v: FreelancerSort) => void }) {
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
// Freelancer card (grid + list layouts) — redesigned as a compact premium
// marketplace card. Every field is optional-safe: pieces the real
// FreelancerSummary doesn't have for a given freelancer (rating, reviews,
// years of experience, a seller-tier badge, a fixed rate) simply don't
// render, rather than showing a placeholder or invented value. There is no
// real `bio` field on this summary shape, so no bio line is shown — adding
// one would mean fabricating copy no freelancer actually wrote.
// ============================================================
function FreelancerCard({ freelancer, layout }: { freelancer: FreelancerSummary; layout: "grid" | "list" }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isVerified = freelancer.kycStatus === "verified";
  const isOwnCard = user?.id === freelancer._id;
  const isAvailable = freelancer.availabilityStatus === "available";
  const visibleSkills = freelancer.skills.slice(0, 3);
  const extraSkillCount = freelancer.skills.length - visibleSkills.length;

  const messageMutation = useMutation({
    mutationFn: () => chatApi.getOrCreateConversation(freelancer._id),
    onSuccess: (c) => navigate(`/dashboard/messages?c=${c._id}`),
  });

  // List view — a richer, single-column card (real stats: years of
  // experience, jobSuccessPercent, responseTimeLabel, languages, bio — all
  // real FreelancerSummary fields). No local-time: the card API has no
  // timezone field, so nothing is invented to fill that space.
  if (layout === "list") {
    const firstName = freelancer.name.split(" ")[0];
    return (
      <div className="group relative overflow-hidden rounded-[18px] border border-[#E5E7EB] bg-white p-4 shadow-[0_1px_3px_rgba(17,17,17,0.04)] transition-all duration-[220ms] hover:border-[#B6FF00] hover:shadow-[0_20px_40px_-24px_rgba(17,17,17,0.18)]">
        {freelancer.isDemo && <DemoBadge />}
        {!isOwnCard && (
          <div onClick={(e) => e.preventDefault()} className="absolute right-4 top-4">
            <SaveButton type="freelancer" id={freelancer._id} className="h-9 w-9 rounded-lg border border-[#E5E7EB] bg-white text-[#111111] hover:bg-[#F1F3EF]" />
          </div>
        )}

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <div className="flex flex-1 items-start gap-3.5">
            <div className="relative shrink-0">
              <Avatar className="h-16 w-16 border border-[#E5E7EB]">
                <AvatarImage src={freelancer.avatar} alt={freelancer.name} />
                <AvatarFallback className="bg-[#F1F3EF] text-lg font-semibold text-[#111111]">{initialsFromName(freelancer.name)}</AvatarFallback>
              </Avatar>
              {isAvailable && <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-[#16A34A]" title="Available now" />}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5 pr-9">
                <h3 className="text-[17px] font-extrabold leading-tight text-[#111111]">{freelancer.name}</h3>
                {isVerified && (
                  <span className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full bg-[#B6FF00]">
                    <BadgeCheck className="h-3 w-3 text-[#111111]" />
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-[13px] text-[#6B7280]">{freelancer.headline || "Freelancer"}</p>
              {freelancer.location && (
                <p className="mt-1 flex items-center gap-1 text-[12px] text-[#9CA3AF]">
                  <MapPin className="h-3 w-3" /> {freelancer.location}
                </p>
              )}

              <div className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px]">
                <span className="flex items-center gap-1 font-semibold text-[#111111]">
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  {freelancer.rating > 0 ? freelancer.rating.toFixed(1) : LEVEL_LABEL[freelancer.level ?? "new"]}
                </span>
                <span className="h-3 w-px bg-[#E5E7EB]" />
                {/* <span className="flex items-center gap-1 text-[#6B7280]">
                  <Briefcase className="h-3.5 w-3.5" /> {freelancer.jobsCompleted ?? 0} Projects
                </span> */}
                {freelancer.level === "new" && (
                  <span className="rounded-full bg-[#F1FFD6] px-2 py-0.5 text-[10px] font-bold text-[#3F6212]">New</span>
                )}
                {freelancer.level === "top_rated" && (
                  <span className="rounded-full bg-[#FFFBEB] px-2 py-0.5 text-[10px] font-bold text-[#B45309]">Top Rated</span>
                )}
              </div>
            </div>
          </div>

          <div className="w-full shrink-0 rounded-xl border border-[#E5E7EB] bg-[#FAFBF8] p-3.5 sm:w-48">
            <p className="text-[10.5px] text-[#9CA3AF]">Hourly Rate</p>
            <p className="mt-0.5 text-lg font-extrabold text-[#111111]">
              {freelancer.hourlyRate > 0 ? `₹${freelancer.hourlyRate.toLocaleString("en-IN")}/hr` : "Rate on request"}
            </p>
            <div className="my-2 border-t border-[#E5E7EB]" />
            <p className="flex items-center gap-1.5 text-[11.5px] font-medium">
              <span className={cn("h-1.5 w-1.5 rounded-full", isAvailable ? "bg-[#16A34A]" : "bg-[#D1D5DB]")} />
              <span className={isAvailable ? "text-[#16A34A]" : "text-[#9CA3AF]"}>{isAvailable ? "Available now" : "Currently busy"}</span>
            </p>
            {freelancer.responseTimeLabel && (
              <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-[#F1FFD6] px-2 py-0.5 text-[10px] font-semibold text-[#3F6212]">
                <Zap className="h-2.5 w-2.5" /> {freelancer.responseTimeLabel}
              </span>
            )}
          </div>
        </div>

        {freelancer.bio && (
          <blockquote className="-mt-3 max-w-[70%] border-l-2 border-[#B6FF00] pl-3 text-[12.5px] italic leading-relaxed text-[#4B5563]">
            {freelancer.bio}
          </blockquote>
        )}

        {visibleSkills.length > 0 && (
          <div className="mt-3.5">
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-[#9CA3AF]">Top Skills</p>
            <div className="flex flex-wrap gap-1.5">
              {visibleSkills.map((skill) => {
                const { icon: SkillIcon, color, brand } = getSkillIcon(skill);
                return (
                  <span
                    key={skill}
                    className={cn(
                      "flex items-center gap-1 rounded-full bg-[#F3F5F1] py-1 pr-2.5 text-[11.5px] font-medium text-[#374151]",
                      brand ? "pl-1" : "pl-2.5"
                    )}
                  >
                    {brand ? (
                      <SkillIcon className="h-3.5 w-3.5 shrink-0" style={{ color }} />
                    ) : (
                      <span className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full" style={{ background: color }}>
                        <SkillIcon className="h-2 w-2 text-white" />
                      </span>
                    )}
                    {skill}
                  </span>
                );
              })}
              {extraSkillCount > 0 && (
                <span className="rounded-full border border-[#E5E7EB] px-2.5 py-1 text-[11.5px] font-medium text-[#9CA3AF]">+{extraSkillCount} more</span>
              )}
            </div>
          </div>
        )}

        <div className="mt-3.5 grid grid-cols-2 divide-x divide-y divide-[#F1F3EF] rounded-xl border border-[#F1F3EF] sm:grid-cols-4 sm:divide-y-0">
          {[
            { icon: Briefcase, value: freelancer.yearsOfExperience > 0 ? `${freelancer.yearsOfExperience} yrs` : "—", label: "Experience" },
            { icon: Star, value: freelancer.jobSuccessPercent !== undefined ? `${freelancer.jobSuccessPercent}%` : "—", label: "Job Success" },
            { icon: Clock, value: shortResponseTime(freelancer.responseTimeLabel) || "—", label: "Response Time" },
            { icon: Globe, value: freelancer.languages?.[0] || "—", label: "Language" },
          ].map((stat) => (
            <div key={stat.label} className="flex items-center gap-2 px-3 py-2.5">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#F1FFD6] text-[#3F6212]">
                <stat.icon className="h-3 w-3" />
              </span>
              <div className="min-w-0">
                <p className="text-[11.5px] font-bold leading-tight text-[#111111]">{stat.value}</p>
                <p className="truncate text-[9.5px] text-[#9CA3AF]">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-3.5 grid grid-cols-2 gap-2">
          <Link
            to={`/freelancers/${freelancer._id}`}
            className="flex h-9 items-center justify-center gap-1 rounded-lg border border-[#111111] bg-white text-[12.5px] font-semibold text-[#111111] transition-colors hover:bg-[#F7F8F5]"
          >
            View Full Profile <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          <button
            type="button"
            disabled={isOwnCard || messageMutation.isPending}
            onClick={() => (user ? messageMutation.mutate() : navigate("/login"))}
            className="flex h-9 items-center justify-center gap-1 rounded-lg bg-[#111111] text-[12.5px] font-semibold text-white transition-colors hover:bg-[#B6FF00] hover:text-[#111111] disabled:opacity-50"
          >
            {messageMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <MessageCircle className="h-3.5 w-3.5" />}
            Contact {firstName}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="group relative overflow-hidden rounded-[20px] border border-[#E5E7EB] bg-white p-4 shadow-[0_1px_3px_rgba(17,17,17,0.04)] transition-all duration-[220ms] hover:-translate-y-0.5 hover:border-[#B6FF00] hover:shadow-[0_20px_40px_-24px_rgba(17,17,17,0.18)]">
      {freelancer.isDemo && <DemoBadge />}
      {!isOwnCard && (
        <div onClick={(e) => e.preventDefault()} className="absolute right-4 top-4 z-10">
          <SaveButton type="freelancer" id={freelancer._id} className="h-8 w-8 bg-[#F1F3EF] text-[#6B7280] hover:bg-[#E5E7EB]" />
        </div>
      )}
      {/* lg:, not sm: — this card sits in a 2-column grid from sm: up, so at
          sm:/md: viewport widths the card itself is only ~290px wide and the
          fixed-width rate box below would get pushed outside the card if the
          row switched to sm:flex-row. It only has room to sit side-by-side
          with the header once the viewport (and thus the card) is much
          wider, around lg:. */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start">
        {/* 1. Profile header — avatar, online dot, name, verified badge, save */}
        <div className="flex flex-1 items-start gap-3">
          <div className="relative shrink-0">
            <Avatar className="h-12 w-12 border border-[#E5E7EB] transition-transform duration-[220ms] group-hover:scale-[1.04]">
              <AvatarImage src={freelancer.avatar} alt={freelancer.name} />
              <AvatarFallback className="bg-[#F1F3EF] text-sm font-semibold text-[#111111]">{initialsFromName(freelancer.name)}</AvatarFallback>
            </Avatar>
            {isAvailable && (
              <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-[#16A34A]" title="Available now" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1">
              <p className="truncate text-[15px] font-bold leading-tight text-[#111111]">{freelancer.name}</p>
              {isVerified && <BadgeCheck className="h-4 w-4 shrink-0 text-[#16A34A]" />}
            </div>
            {/* 2. Professional info — title, location */}
            <p className="truncate text-[13px] text-[#6B7280]">{freelancer.headline || "Freelancer"}</p>
            {freelancer.location && (
              <p className="mt-0.5 flex items-center gap-1 text-[13px] text-[#9CA3AF]">
                <MapPin className="h-3 w-3 shrink-0" /> {freelancer.location}
              </p>
            )}

            {/* 3. Trust info — rating, reviews, completed projects, tier badge */}
            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
              <span className="flex items-center gap-1 font-semibold text-[#111111]">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                {freelancer.rating > 0 ? freelancer.rating.toFixed(1) : "0.0"}
              </span>

              {freelancer.reviewCount > 0 && (
                <>
                  <span className="h-3.5 w-px bg-[#D1D5DB]" />
                  <span className="text-[#9CA3AF]">
                    {freelancer.reviewCount} reviews
                  </span>
                </>
              )}

              {freelancer.jobsCompleted !== undefined && (
                <>
                  {/* <span className="h-3.5 w-px bg-[#D1D5DB]" /> */}
                  {/* <span className="text-[#9CA3AF]">
        {freelancer.jobsCompleted} Projects
      </span> */}
                </>
              )}

              {freelancer.level === "new" && (
                <>
                  <span className="h-3.5 w-px bg-[#D1D5DB]" />
                  <span className="rounded-full bg-[#EFF6FF] px-2 py-0.5 text-[13px] font-bold text-[#2563EB]">
                    New
                  </span>
                </>
              )}
              {freelancer.level === "top_rated" && (
                <>
                  <span className="h-3.5 w-px bg-[#D1D5DB]" />
                  <span className="rounded-full bg-[#FFFBEB] px-2 py-0.5 text-[13px] font-bold text-[#B45309]">
                    Top Rated
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* 7. Commercial info — rate, availability — sits beside the header
            instead of floating alone at the bottom, so cards with little
            other content (no bio/skills yet) don't show a large empty gap. */}
        <div className="w-full shrink-0 rounded-xl border border-[#E5E7EB] bg-[#FAFBF8] p-3.5 lg:mt-10 lg:w-40">
          <p className="text-[10.5px] text-[#9CA3AF]">Hourly Rate</p>
          <p className="mt-0.5 text-lg font-extrabold text-[#111111]">
            {freelancer.hourlyRate > 0 ? `₹${freelancer.hourlyRate.toLocaleString("en-IN")}/hr` : "Rate on request"}
          </p>
          <div className="my-2 border-t border-[#E5E7EB]" />
          <p className="flex items-center gap-1.5 text-[11.5px] font-medium">
            <span className={cn("h-1.5 w-1.5 rounded-full", isAvailable ? "bg-[#16A34A]" : "bg-[#D1D5DB]")} />
            <span className={isAvailable ? "text-[#16A34A]" : "text-[#9CA3AF]"}>{isAvailable ? "Available now" : "Currently busy"}</span>
          </p>
          {freelancer.responseTimeLabel && (
            <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-[#F1FFD6] px-2 py-0.5 text-[10px] font-semibold text-[#3F6212]">
              <Zap className="h-2.5 w-2.5" /> {freelancer.responseTimeLabel}
            </span>
          )}
        </div>
      </div>

      {/* -mt-14 pulls the bio up alongside the header row, but that only
          looks right once the header is short and side-by-side (lg: and up
          — see the lg:flex-row above). Below that, the header stacks and is
          much taller, so the bio needs its normal top margin and full width
          instead of overlapping into the rate box. */}
      {freelancer.bio && (
        <blockquote className="mt-3 mb-5 line-clamp-3 border-l-2 border-[#B6FF00] pl-3 text-[13px] italic leading-relaxed text-[#4B5563] lg:-mt-14 lg:max-w-[65%]">
          {freelancer.bio}
        </blockquote>
      )}
      {/* 5. Skills — max 4, no fabricated "expand" content beyond real data */}
      {visibleSkills.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {visibleSkills.map((skill) => {
            const { icon: SkillIcon, color, brand } = getSkillIcon(skill);
            return (
              <span
                key={skill}
                className={cn(
                  "flex items-center gap-1 rounded-full bg-[#F3F5F1] py-1 pr-2.5 text-[11.5px] font-medium text-[#374151]",
                  brand ? "pl-1" : "pl-2.5"
                )}
              >
                {brand ? (
                  <SkillIcon className="h-3.5 w-3.5 shrink-0" style={{ color }} />
                ) : (
                  <span className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full" style={{ background: color }}>
                    <SkillIcon className="h-2 w-2 text-white" />
                  </span>
                )}
                {skill}
              </span>
            );
          })}
          {extraSkillCount > 0 && <span className="rounded-full bg-[#F3F5F1] px-2.5 py-1 text-[11px] font-medium text-[#9CA3AF]">+{extraSkillCount} more</span>}
        </div>
      )}

      <div className="mt-3.5 grid grid-cols-2 divide-x divide-y divide-[#F1F3EF] rounded-xl border border-[#F1F3EF] sm:grid-cols-4 sm:divide-y-0">
        {[
          { icon: Briefcase, value: freelancer.yearsOfExperience > 0 ? `${freelancer.yearsOfExperience} yrs` : "—", label: "Experience" },
          { icon: Star, value: freelancer.jobSuccessPercent !== undefined ? `${freelancer.jobSuccessPercent}%` : "—", label: "Job Success" },
          { icon: Clock, value: shortResponseTime(freelancer.responseTimeLabel) || "—", label: "Response Time" },
          { icon: Globe, value: freelancer.languages?.[0] || "—", label: "Language" },
        ].map((stat) => (
          <div key={stat.label} className="flex items-center gap-2 px-3 py-2.5">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#F1FFD6] text-[#3F6212]">
              <stat.icon className="h-3 w-3" />
            </span>
            <div className="min-w-0">
              <p className="text-[11.5px] font-bold leading-tight text-[#111111]">{stat.value}</p>
              <p className="truncate text-[9.5px] text-[#9CA3AF]">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* 8. Actions — equal-width 44px CTAs */}
      <div className="mt-3 grid grid-cols-2 gap-2">
        <Link
          to={`/freelancers/${freelancer._id}`}
          className="flex h-11 items-center justify-center rounded-[13px] border border-[#111111] bg-white text-center text-xs font-semibold text-[#111111] transition-colors hover:bg-[#F7F8F5]"
        >
          View Profile
        </Link>
        <button
          type="button"
          disabled={isOwnCard || messageMutation.isPending}
          onClick={() => (user ? messageMutation.mutate() : navigate("/login"))}
          className="flex h-11 items-center justify-center gap-1.5 rounded-[13px] bg-[#111111] text-xs font-semibold text-white transition-colors group-hover:bg-[#B6FF00] group-hover:text-[#111111] disabled:opacity-50"
        >
          {messageMutation.isPending && <Loader2 className="h-3 w-3 animate-spin" />}
          Contact
        </button>
      </div>
    </div>
  );
}

// ============================================================
// Featured freelancer — real highest-rated result, not a curated fake pick
// ============================================================
function FeaturedFreelancerCard({ freelancer }: { freelancer: FreelancerSummary }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const skills = freelancer.skills.slice(0, 5);

  return (
    <div className="relative mb-5 flex flex-col gap-5 overflow-hidden rounded-[20px] border border-[#E5E7EB] bg-white p-6 shadow-[0_2px_8px_rgba(17,17,17,0.04)] sm:flex-row sm:items-center">
      {freelancer.isDemo && <DemoBadge />}
      <div className="flex items-start gap-4 sm:flex-1">
        <div className="relative shrink-0">
          <Avatar className="h-20 w-20 border border-[#E5E7EB]">
            <AvatarImage src={freelancer.avatar} alt={freelancer.name} />
            <AvatarFallback className="bg-[#F1F3EF] text-xl font-semibold text-[#111111]">{initialsFromName(freelancer.name)}</AvatarFallback>
          </Avatar>
          {freelancer.availabilityStatus === "available" && (
            <span className="absolute bottom-0.5 right-0.5 h-4 w-4 rounded-full border-2 border-white bg-[#16A34A]" />
          )}
        </div>
        <div className="min-w-0">
          <span className="mb-1.5 inline-flex items-center gap-1 rounded-full bg-[#ECFDF3] px-2.5 py-1 text-[10.5px] font-bold text-[#16A34A]">
            <Sparkles className="h-3 w-3" /> Featured
          </span>
          <div className="flex items-center gap-1.5">
            <p className="text-lg font-bold text-[#111111]">{freelancer.name}</p>
            {freelancer.kycStatus === "verified" && <BadgeCheck className="h-4 w-4 text-[#16A34A]" />}
          </div>
          <p className="text-sm text-[#6B7280]">{freelancer.headline || "Freelancer"}</p>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#6B7280]">
            {freelancer.location && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" /> {freelancer.location}
              </span>
            )}
            <span className="flex items-center gap-1 font-semibold text-[#111111]">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> {freelancer.rating.toFixed(1)}
            </span>
            {/* <span>{freelancer.jobsCompleted ?? 0} projects</span> */}
          </div>
          {skills.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {skills.map((skill) => (
                <span key={skill} className="rounded-full bg-[#F1F3EF] px-2.5 py-1 text-[11px] font-medium text-[#4B5563]">
                  {skill}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex shrink-0 flex-col items-start gap-3 sm:items-end">
        <div className="text-left sm:text-right">
          <p className="text-lg font-extrabold text-[#111111]">
            {freelancer.hourlyRate > 0 ? `₹${freelancer.hourlyRate.toLocaleString()}/hr` : "Rate on request"}
          </p>
          <p className="text-[11px] text-[#9CA3AF]">{freelancer.availabilityStatus === "available" ? "Available now" : "Currently busy"}</p>
        </div>
        <div className="flex w-full gap-2 sm:w-auto">
          <Link
            to={`/freelancers/${freelancer._id}`}
            className="flex-1 rounded-full border border-[#E5E7EB] px-4 py-2 text-center text-xs font-semibold text-[#111111] transition-colors hover:border-[#111111] sm:flex-none"
          >
            View Profile
          </Link>
          <Link
            to={`/freelancers/${freelancer._id}`}
            onClick={(e) => {
              if (!user) {
                e.preventDefault();
                navigate("/login");
              }
            }}
            className="flex flex-1 items-center justify-center gap-1 rounded-full bg-[#111111] px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#B6FF00] hover:text-[#111111] sm:flex-none"
          >
            Contact <ArrowRight className="h-3 w-3" />
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
        <Search className="h-5 w-5" />
      </span>
      <p className="text-base font-bold text-[#111111]">No freelancers found</p>
      <p className="max-w-xs text-sm text-[#6B7280]">Try changing your filters or search for another skill.</p>
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
        <div key={i} className="rounded-[20px] border border-[#E5E7EB] bg-white p-5">
          <div className="flex items-center gap-3">
            <Skeleton className="h-14 w-14 shrink-0 rounded-full bg-[#EDEFEA]" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-2/3 bg-[#EDEFEA]" />
              <Skeleton className="h-3 w-1/2 bg-[#EDEFEA]" />
            </div>
          </div>
          <Skeleton className="mt-4 h-3 w-full bg-[#EDEFEA]" />
          <div className="mt-3 flex gap-1.5">
            <Skeleton className="h-6 w-16 rounded-full bg-[#EDEFEA]" />
            <Skeleton className="h-6 w-20 rounded-full bg-[#EDEFEA]" />
          </div>
          <Skeleton className="mt-4 h-9 w-full rounded-full bg-[#EDEFEA]" />
        </div>
      ))}
    </div>
  );
}
