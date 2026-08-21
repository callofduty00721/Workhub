import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Search,
  Star,
  MapPin,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  LayoutGrid,
  List,
  SlidersHorizontal,
  X,
  Sparkles,
  Zap,
  Crown,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DemoBadge } from "@/components/DemoBadge";
import { Slider } from "@/components/ui/slider";
import { Skeleton } from "@/components/ui/skeleton";
import { SaveButton } from "@/components/shared/SaveButton";
import { Pagination } from "@/components/shared/Pagination";
import { serviceApi, type ServiceSort } from "@/api/freelancers";
import { SERVICE_CATEGORIES, SERVICE_CATEGORY_NAMES } from "@/lib/mockData";
import { cn, initialsFromName, formatCurrency } from "@/lib/utils";
import type { Service } from "@/types";

// Real leaf skills already present in the SERVICE_CATEGORIES taxonomy — not
// invented search terms.
const POPULAR_SEARCHES = ["Logo Design", "Full-Stack Development", "Website Design", "Video Editing", "SEO Audits", "Blog Writing"];

const SORT_OPTIONS: { label: string; value: ServiceSort }[] = [
  { label: "Recommended", value: "best_match" },
  { label: "Top Rated", value: "rating" },
  { label: "Newest", value: "newest" },
  { label: "Price: Low to High", value: "price_low" },
  { label: "Price: High to Low", value: "price_high" },
];

const DELIVERY_OPTIONS = [
  { label: "Anytime", value: "any" },
  { label: "24 hours", value: "1" },
  { label: "3 days", value: "3" },
  { label: "7 days", value: "7" },
];

const LEVEL_OPTIONS: { label: string; value: "any" | "top_rated" | "level_1" | "new" }[] = [
  { label: "All sellers", value: "any" },
  { label: "Top Rated", value: "top_rated" },
  { label: "Level 1", value: "level_1" },
  { label: "New Seller", value: "new" },
];

const RATING_OPTIONS = [
  { label: "Any rating", value: "any" },
  { label: "4.5 & up", value: "4.5" },
  { label: "4.0 & up", value: "4" },
  { label: "3.0 & up", value: "3" },
];

const LANGUAGE_OPTIONS = ["English", "Hindi", "Marathi"];

const PRICE_MAX = 50000;

export function GigMarketplace() {
  const [search, setSearch] = useState("");
  const [searchDraft, setSearchDraft] = useState("");
  const [category, setCategory] = useState("all");
  const [subCategory, setSubCategory] = useState("all");
  const [maxDeliveryDays, setMaxDeliveryDays] = useState("any");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, PRICE_MAX]);
  const [level, setLevel] = useState<"any" | "top_rated" | "level_1" | "new">("any");
  const [minRating, setMinRating] = useState("any");
  const [language, setLanguage] = useState("any");
  const [sort, setSort] = useState<ServiceSort>("best_match");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [page, setPage] = useState(1);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const resetPage = () => setPage(1);

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
    setMaxDeliveryDays("any");
    setPriceRange([0, PRICE_MAX]);
    setLevel("any");
    setMinRating("any");
    setLanguage("any");
    setSearch("");
    setSearchDraft("");
    resetPage();
  };

  const activeFilterCount = [
    category !== "all",
    subCategory !== "all",
    maxDeliveryDays !== "any",
    priceRange[0] > 0 || priceRange[1] < PRICE_MAX,
    level !== "any",
    minRating !== "any",
    language !== "any",
  ].filter(Boolean).length;

  const [priceMin, priceMax] = [priceRange[0] > 0 ? priceRange[0] : undefined, priceRange[1] < PRICE_MAX ? priceRange[1] : undefined];

  const { data, isLoading } = useQuery({
    queryKey: ["services", "marketplace", { search, category, subCategory, maxDeliveryDays, priceRange, level, minRating, language, sort, page }],
    queryFn: () =>
      serviceApi.list({
        search: search || undefined,
        category: category === "all" ? undefined : category,
        subCategory: category !== "all" && subCategory !== "all" ? subCategory : undefined,
        priceMin,
        priceMax,
        maxDeliveryDays: maxDeliveryDays === "any" ? undefined : Number(maxDeliveryDays),
        level: level === "any" ? undefined : level,
        minRating: minRating === "any" ? undefined : Number(minRating),
        language: language === "any" ? undefined : language,
        sort,
        page,
        limit: 12,
      }),
  });

  const total = data?.pagination.total ?? 0;
  const results = data?.data ?? [];
  // Real-data-only "Featured" pick — highest-rated result on page 1, only
  // when it actually has a rating. No curated/fabricated placement.
  const featured = page === 1 && !isLoading ? [...results].sort((a, b) => b.rating - a.rating).find((g) => g.rating > 0) : undefined;
  const gridResults = featured ? results.filter((g) => g._id !== featured._id) : results;

  return (
    <div className="bg-[#F7F8F5]">
      {/* Header */}
      <div className="border-b border-[#E5E7EB] bg-[#F7F8F5] py-4 sm:py-6">
        <div className="container">
          <p className="text-xs font-medium text-[#9CA3AF]">
            <Link to="/" className="hover:text-[#111111]">
              Home
            </Link>{" "}
            / <Link to="/freelancers" className="hover:text-[#111111]">Freelancers</Link> /{" "}
            <span className="text-[#6B7280]">Gigs</span>
          </p>
          <h1 className="mt-3 max-w-2xl text-3xl font-extrabold tracking-tight text-[#111111] sm:text-4xl">
            Find the right service for your project.
          </h1>
          <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-[#6B7280]">
            Explore professional services from talented freelancers and find the expertise you need.
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
              placeholder="Search for services, skills or keywords..."
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

          {/* Category navigation — picking one expands a full section-grouped
              subcategory browser right below it, instead of a cramped flat
              list buried in the sidebar. */}
          <ScrollableChipRow className="mt-6">
            <CategoryChip label="All" checked={category === "all"} onChange={() => selectCategory("all")} />
            {SERVICE_CATEGORY_NAMES.map((c) => (
              <CategoryChip key={c} label={c} checked={category === c} onChange={() => selectCategory(c)} />
            ))}
          </ScrollableChipRow>
          {category !== "all" && (
            <SubcategoryPanel category={category} subCategory={subCategory} onSelect={(sub) => selectSubCategory(category, sub)} onViewAll={() => selectCategory(category)} />
          )}
        </div>
      </div>

      {/* Main layout */}
      <div className="container grid grid-cols-1 items-start gap-6 py-6 lg:grid-cols-[280px_1fr]">
        <FilterSidebar
          className="hidden lg:block"
          category={category}
          subCategory={subCategory}
          maxDeliveryDays={maxDeliveryDays}
          setMaxDeliveryDays={(v) => { setMaxDeliveryDays(v); resetPage(); }}
          priceRange={priceRange}
          setPriceRange={setPriceRange}
          level={level}
          setLevel={(v) => { setLevel(v); resetPage(); }}
          minRating={minRating}
          setMinRating={(v) => { setMinRating(v); resetPage(); }}
          language={language}
          setLanguage={(v) => { setLanguage(v); resetPage(); }}
          onApply={resetPage}
          onClear={clearFilters}
        />

        <div className="min-w-0">
          {/* Results header */}
          <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-[#111111]">{total > 0 ? "Explore Services" : "Explore Services"}</h2>
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
              {featured && <FeaturedGigCard gig={featured} />}

              <div className={view === "grid" ? "grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3" : "flex flex-col gap-4"}>
                {gridResults.map((g) => (
                  <GigCard key={g._id} gig={g} layout={view} />
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
              maxDeliveryDays={maxDeliveryDays}
            setMaxDeliveryDays={(v) => { setMaxDeliveryDays(v); resetPage(); }}
            priceRange={priceRange}
            setPriceRange={setPriceRange}
            level={level}
            setLevel={(v) => { setLevel(v); resetPage(); }}
            minRating={minRating}
            setMinRating={(v) => { setMinRating(v); resetPage(); }}
            language={language}
            setLanguage={(v) => { setLanguage(v); resetPage(); }}
            onApply={() => { resetPage(); setMobileFiltersOpen(false); }}
            onClear={clearFilters}
          />
        </MobileFilterDrawer>
      )}
    </div>
  );
}

// ============================================================
// Filter sidebar — category picked from the horizontal nav above; this panel
// only adds the fields the nav doesn't cover, all real (subCategory,
// maxDeliveryDays, price, level, minRating, language all map to real
// serviceApi filters — no "Service Type" section since no such field exists).
// ============================================================
function FilterSidebar({
  className,
  category,
  subCategory,
  maxDeliveryDays,
  setMaxDeliveryDays,
  priceRange,
  setPriceRange,
  level,
  setLevel,
  minRating,
  setMinRating,
  language,
  setLanguage,
  onApply,
  onClear,
}: {
  className?: string;
  category: string;
  subCategory: string;
  maxDeliveryDays: string;
  setMaxDeliveryDays: (v: string) => void;
  priceRange: [number, number];
  setPriceRange: (v: [number, number]) => void;
  level: "any" | "top_rated" | "level_1" | "new";
  setLevel: (v: "any" | "top_rated" | "level_1" | "new") => void;
  minRating: string;
  setMinRating: (v: string) => void;
  language: string;
  setLanguage: (v: string) => void;
  onApply: () => void;
  onClear: () => void;
}) {
  return (
    <aside className={cn("rounded-[20px] border border-[#E5E7EB] bg-white p-5 lg:sticky lg:top-24", className)}>
      <h3 className="text-sm font-bold text-[#111111]">Filter Gigs</h3>

      {category !== "all" && (
        <FilterSection title="Filtering by">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#B6FF00] bg-[#B6FF00]/10 px-3 py-1.5 text-xs font-medium text-[#111111]">
            {subCategory === "all" ? category : subCategory}
          </span>
        </FilterSection>
      )}

      <FilterSection title="Delivery Time">
        <div className="space-y-1">
          {DELIVERY_OPTIONS.map((o) => (
            <RadioRow key={o.value} label={o.label} checked={maxDeliveryDays === o.value} onChange={() => setMaxDeliveryDays(o.value)} />
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Budget">
        <div className="px-1">
          <Slider
            min={0}
            max={PRICE_MAX}
            step={500}
            value={priceRange}
            onValueChange={(v) => setPriceRange([v[0], v[1]] as [number, number])}
            className="[&_[data-radix-slider-range]]:bg-[#B6FF00] [&_[data-radix-slider-thumb]]:border-[#B6FF00]"
          />
          <div className="mt-2 flex items-center justify-between text-xs font-medium text-[#6B7280]">
            <span>{formatCurrency(priceRange[0])}</span>
            <span>
              {formatCurrency(priceRange[1])}
              {priceRange[1] === PRICE_MAX ? "+" : ""}
            </span>
          </div>
        </div>
      </FilterSection>

      <FilterSection title="Seller Level">
        <div className="space-y-1">
          {LEVEL_OPTIONS.map((o) => (
            <RadioRow key={o.value} label={o.label} checked={level === o.value} onChange={() => setLevel(o.value)} />
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

      <FilterSection title="Language" last>
        <div className="flex flex-wrap gap-1.5">
          <CategoryChip label="Any" checked={language === "any"} onChange={() => setLanguage("any")} />
          {LANGUAGE_OPTIONS.map((l) => (
            <CategoryChip key={l} label={l} checked={language === l} onChange={() => setLanguage(l)} />
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
// freelancer/gig category/sub-category fields. Replaces a cramped flat chip
// list that used to be buried in the filter sidebar.
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
    <div className="mt-0.1 rounded-[20px] border border-[#E5E7EB] bg-white p-6">
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
        View all {category} gigs <ArrowRight className="h-3 w-3" />
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
function SortDropdown({ sort, setSort }: { sort: ServiceSort; setSort: (v: ServiceSort) => void }) {
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
// Gig thumbnail — real uploaded image when present, else an abstract
// illustrative placeholder (no fake stock photography).
// ============================================================
function GigThumbnail({ gig, className }: { gig: Service; className?: string }) {
  const image = gig.images?.[0];
  return (
    <div className={cn("relative aspect-[16/10] w-full overflow-hidden rounded-t-[20px] bg-[#F1F3EF]", className)}>
      {image ? (
        <img
          src={image}
          alt={gig.title}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-[220ms] group-hover:scale-[1.02]"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#F1F3EF] to-[#E5E7EB]">
          <span className="text-2xl font-bold text-[#9CA3AF]">{gig.title[0]}</span>
        </div>
      )}
    </div>
  );
}

// ============================================================
// Gig card (grid + list layouts) — redesigned as a compact premium service
// card. Every field is optional-safe: there is no real `verified` flag on a
// gig's embedded seller (unlike the standalone Freelancer/Brand/Agency
// profile types), so no verified badge is shown here — adding one would
// mean fabricating a claim the data doesn't back. Badges are capped at two
// (a seller-tier badge + Fast Delivery), both computed from real fields.
// ============================================================
function GigCard({ gig, layout }: { gig: Service; layout: "grid" | "list" }) {
  const seller = typeof gig.freelancer === "object" ? gig.freelancer : null;
  const isFastDelivery = gig.deliveryDays <= 3;
  const visibleSkills = gig.skills.slice(0, 4);

  return (
    <Link
      to={`/services/${gig._id}`}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-[20px] border border-[#E5E7EB] bg-white transition-all duration-[220ms] hover:-translate-y-[3px] hover:border-[#B6FF00] hover:shadow-[0_20px_40px_-24px_rgba(17,17,17,0.18)]",
        layout === "list" && "sm:flex-row sm:items-stretch"
      )}
    >
      {gig.isDemo && <DemoBadge />}
      {/* 1-2. Gig image + overlay badges */}
      <div className={cn("relative", layout === "list" && "sm:w-64 sm:shrink-0")}>
        <GigThumbnail gig={gig} className={layout === "list" ? "rounded-t-[20px] sm:h-full sm:rounded-l-[20px] sm:rounded-tr-none" : undefined} />
        <div onClick={(e) => e.preventDefault()} className="absolute right-3 top-3">
          <SaveButton type="service" id={gig._id} className="h-8 w-8 bg-white/95 text-[#6B7280] hover:bg-white" />
        </div>
        {seller?.level === "top_rated" && (
          <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-[10.5px] font-bold text-[#111111]">Top Rated</span>
        )}
        {seller?.level === "new" && (
          <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-[10.5px] font-bold text-[#4B5563]">New</span>
        )}
        {isFastDelivery && (
          <span className="absolute bottom-3 left-3 flex items-center gap-1 rounded-full bg-[#F1FFD6] px-2.5 py-1 text-[10.5px] font-bold text-[#4D7A00]">
            <Zap className="h-3 w-3" /> Fast delivery
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        {/* 3. Seller information */}
        {seller && (
          <div className="mb-2 flex items-center gap-2">
            <Avatar className="h-6 w-6 shrink-0">
              <AvatarImage src={seller.avatar} alt={seller.name} />
              <AvatarFallback className="bg-[#F1F3EF] text-[10px] font-semibold text-[#111111]">{initialsFromName(seller.name)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-[#111111]">{seller.name}</p>
              {(seller.headline || seller.location) && (
                <p className="truncate text-[10px] text-[#9CA3AF]">{seller.headline || seller.location}</p>
              )}
            </div>
          </div>
        )}

        {/* 4. Gig title */}
        <h3 className="line-clamp-2 text-sm font-bold leading-snug text-[#111111]">{gig.title}</h3>

        {/* 5. Rating — real data only, "New Seller" instead of a fake rating */}
        <div className="mt-1.5 text-xs">
          {gig.reviewCount > 0 ? (
            <span className="flex items-center gap-1 font-semibold text-[#111111]">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              {gig.rating.toFixed(1)} <span className="font-normal text-[#9CA3AF]">· {gig.reviewCount} reviews</span>
            </span>
          ) : (
            <span className="font-medium text-[#9CA3AF]">New Seller</span>
          )}
        </div>

        {/* 6. Service / skills — max 4 */}
        {visibleSkills.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {visibleSkills.map((skill) => (
              <span key={skill} className="rounded-full bg-[#F3F5F1] px-2 py-0.5 text-[10.5px] font-medium text-[#4B5563]">
                {skill}
              </span>
            ))}
          </div>
        )}

        {/* 7-8. Price + delivery */}
        <div className="mt-auto flex items-end justify-between gap-2 pt-3">
          <div>
            <p className="text-[10.5px] text-[#9CA3AF]">Starting at</p>
            <p className="text-base font-extrabold text-[#111111]">{formatCurrency(gig.price)}</p>
          </div>
          {gig.deliveryDays > 0 && <p className="text-[11px] text-[#6B7280]">{gig.deliveryDays}-day delivery</p>}
        </div>

        {/* 9. Primary CTA */}
        <span className="mt-3 flex h-11 items-center justify-center gap-1.5 rounded-[13px] bg-[#111111] text-xs font-semibold text-white transition-colors group-hover:bg-[#B6FF00] group-hover:text-[#111111]">
          View Gig <ArrowRight className="h-3.5 w-3.5" />
        </span>
      </div>
    </Link>
  );
}

// ============================================================
// Featured gig — real highest-rated result, clearly not a fabricated pick
// ============================================================
function FeaturedGigCard({ gig }: { gig: Service }) {
  const seller = typeof gig.freelancer === "object" ? gig.freelancer : null;

  return (
    <div className="relative mb-5 flex flex-col gap-5 rounded-[20px] border border-[#E5E7EB] bg-white p-5 shadow-[0_2px_8px_rgba(17,17,17,0.04)] sm:flex-row sm:items-center">
      {gig.isDemo && <DemoBadge />}
      <div className="sm:w-72 sm:shrink-0">
        <GigThumbnail gig={gig} className="rounded-[16px]" />
      </div>

      <div className="min-w-0 flex-1">
        <span className="mb-1.5 inline-flex items-center gap-1 rounded-full bg-[#ECFDF3] px-2.5 py-1 text-[10.5px] font-bold text-[#16A34A]">
          <Sparkles className="h-3 w-3" /> Featured
        </span>
        <h3 className="text-lg font-bold leading-snug text-[#111111]">{gig.title}</h3>

        {seller && (
          <div className="mt-2 flex items-center gap-2">
            <Avatar className="h-7 w-7">
              <AvatarImage src={seller.avatar} alt={seller.name} />
              <AvatarFallback className="bg-[#F1F3EF] text-[11px] font-semibold text-[#111111]">{initialsFromName(seller.name)}</AvatarFallback>
            </Avatar>
            <span className="text-sm font-semibold text-[#111111]">{seller.name}</span>
            {seller.level === "top_rated" && (
              <span className="flex items-center gap-1 rounded-full bg-[#FFFBEB] px-2 py-0.5 text-[10.5px] font-bold text-[#B45309]">
                <Crown className="h-3 w-3" /> Top Rated
              </span>
            )}
            {seller.location && (
              <span className="flex items-center gap-1 text-xs text-[#9CA3AF]">
                <MapPin className="h-3 w-3" /> {seller.location}
              </span>
            )}
          </div>
        )}

        <div className="mt-2 flex items-center gap-3 text-xs text-[#6B7280]">
          <span className="flex items-center gap-1 font-semibold text-[#111111]">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> {gig.rating.toFixed(1)}
          </span>
          <span>{gig.reviewCount} reviews</span>
        </div>
      </div>

      <div className="flex shrink-0 flex-col items-start gap-3 sm:items-end">
        <div className="text-left sm:text-right">
          <p className="text-[11px] text-[#9CA3AF]">Starting at</p>
          <p className="text-lg font-extrabold text-[#111111]">{formatCurrency(gig.price)}</p>
          <p className="text-[11px] text-[#6B7280]">{gig.deliveryDays}-day delivery</p>
        </div>
        <Link
          to={`/services/${gig._id}`}
          className="flex items-center justify-center gap-1 rounded-full bg-[#111111] px-5 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-[#B6FF00] hover:text-[#111111]"
        >
          View Gig <ArrowRight className="h-3 w-3" />
        </Link>
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
      <p className="text-base font-bold text-[#111111]">No services found</p>
      <p className="max-w-xs text-sm text-[#6B7280]">Try another keyword or adjust your filters.</p>
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
            <Skeleton className="mt-3 h-3 w-16 bg-[#EDEFEA]" />
            <Skeleton className="mt-4 h-6 w-20 bg-[#EDEFEA]" />
          </div>
        </div>
      ))}
    </div>
  );
}
