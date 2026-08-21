import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  FolderKanban,
  MapPin,
  Search,
  SlidersHorizontal,
  Sparkles,
  Users2,
  X,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DemoBadge } from "@/components/DemoBadge";
import { Skeleton } from "@/components/ui/skeleton";
import { SaveButton } from "@/components/shared/SaveButton";
import { InfoCell } from "@/components/shared/InfoCell";
import { Pagination } from "@/components/shared/Pagination";
import { projectApi } from "@/api/projects";
import { SERVICE_CATEGORIES, SERVICE_CATEGORY_NAMES } from "@/lib/mockData";
import { cn, formatCurrency, timeAgoShort } from "@/lib/utils";
import type { Project } from "@/types";

// Same leaf skills already validated against SERVICE_CATEGORIES for the
// Freelancer/Gig marketplaces — reused here rather than inventing new terms.
const POPULAR_SEARCHES = ["Logo Design", "Full-Stack Development", "Website Design", "Video Editing", "SEO Audits", "Blog Writing"];

const TYPE_OPTIONS = [
  { label: "Any Type", value: "any" },
  { label: "One-off Project", value: "freelance" },
  { label: "Ongoing Contract", value: "contract" },
];

const TYPE_LABELS: Record<Project["type"], string> = {
  freelance: "One-off Project",
  contract: "Ongoing Contract",
};

type SortOption = "recommended" | "newest" | "budget_high" | "budget_low";

// The real projectApi has no server-side sort param, so these re-order only
// the current page's real results client-side — never fabricated relevance.
const SORT_OPTIONS: { label: string; value: SortOption }[] = [
  { label: "Recommended", value: "recommended" },
  { label: "Newest", value: "newest" },
  { label: "Budget: High to Low", value: "budget_high" },
  { label: "Budget: Low to High", value: "budget_low" },
];

// Self-contained Projects browsing tab — mirrors the Freelancer/Gig
// Marketplace pattern (own hero, search, category nav, filters, results)
// instead of sitting under the shared PremiumHero.
export function ProjectMarketplace() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [searchDraft, setSearchDraft] = useState("");
  const [type, setType] = useState("any");
  // URL-synced (not just local state) so the selection survives a back-nav
  // from a project's details page or a tab switch away and back.
  const initialCategory = searchParams.get("category");
  const [category, setCategoryState] = useState(
    initialCategory && SERVICE_CATEGORY_NAMES.includes(initialCategory) ? initialCategory : "all"
  );
  const [subCategory, setSubCategoryState] = useState(searchParams.get("subCategory") ?? "all");
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [sort, setSort] = useState<SortOption>("recommended");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [page, setPage] = useState(1);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const resetPage = () => setPage(1);

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

  const selectCategory = (v: string) => {
    applyCategory(v, "all");
    resetPage();
  };

  const selectSubCategory = (cat: string, sub: string) => {
    applyCategory(cat, sub);
    resetPage();
  };

  const clearFilters = () => {
    applyCategory("all", "all");
    setType("any");
    setRemoteOnly(false);
    setSearch("");
    setSearchDraft("");
    resetPage();
  };

  const activeFilterCount = [category !== "all", subCategory !== "all", type !== "any", remoteOnly].filter(Boolean).length;

  const { data, isLoading } = useQuery({
    queryKey: ["projects", { search, type, category, subCategory, remoteOnly, page }],
    queryFn: () =>
      projectApi.list({
        search: search || undefined,
        type: type === "any" ? undefined : type,
        category: category === "all" ? undefined : category,
        subCategory: category !== "all" && subCategory !== "all" ? subCategory : undefined,
        isRemote: remoteOnly || undefined,
        page,
        limit: 12,
      }),
  });

  const total = data?.pagination.total ?? 0;
  const results = data?.data ?? [];

  const sortedResults = (() => {
    if (sort === "recommended") return results;
    const copy = [...results];
    if (sort === "newest") return copy.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    if (sort === "budget_high") return copy.sort((a, b) => b.budgetMax - a.budgetMax);
    return copy.sort((a, b) => a.budgetMin - b.budgetMin);
  })();

  // Real-data-only "Featured" pick — highest real budget on page 1, only
  // when it actually has one. No curated/fabricated placement.
  const featured = page === 1 && !isLoading ? [...results].sort((a, b) => b.budgetMax - a.budgetMax).find((p) => p.budgetMax > 0) : undefined;
  const gridResults = featured ? sortedResults.filter((p) => p._id !== featured._id) : sortedResults;

  return (
    <div className="bg-[#F7F8F5]">
      {/* Header */}
      <div className="border-b border-[#E5E7EB] bg-[#F7F8F5] py-4 sm:py-6">
        <div className="container">
          <p className="text-xs font-medium text-[#9CA3AF]">
            <Link to="/" className="hover:text-[#111111]">
              Home
            </Link>{" "}
            /{" "}
            <Link to="/freelancers" className="hover:text-[#111111]">
              Freelancers
            </Link>{" "}
            / <span className="text-[#6B7280]">Projects</span>
          </p>
          <h1 className="mt-3 max-w-2xl text-3xl font-extrabold tracking-tight text-[#111111] sm:text-4xl">
            Find projects worth bidding on.
          </h1>
          <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-[#6B7280]">
            Browse real projects posted by clients and businesses, then submit a proposal to win the work.
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
              placeholder="Search for projects, skills or keywords..."
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
              subcategory browser right below it, same pattern as the
              Freelancer/Gig marketplaces. */}
          <ScrollableChipRow className="mt-6">
            <CategoryChip label="All" checked={category === "all"} onChange={() => selectCategory("all")} />
            {SERVICE_CATEGORY_NAMES.map((c) => (
              <CategoryChip key={c} label={c} checked={category === c} onChange={() => selectCategory(c)} />
            ))}
          </ScrollableChipRow>
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
          type={type}
          setType={(v) => {
            setType(v);
            resetPage();
          }}
          remoteOnly={remoteOnly}
          setRemoteOnly={(v) => {
            setRemoteOnly(v);
            resetPage();
          }}
          onApply={resetPage}
          onClear={clearFilters}
        />

        <div className="min-w-0">
          {/* Results header */}
          <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-[#111111]">Browse Projects</h2>
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
              <SortDropdown sort={sort} setSort={setSort} />
              <div className="flex items-center gap-0.5 rounded-full border border-[#E5E7EB] bg-white p-0.5">
                <button
                  type="button"
                  onClick={() => setView("grid")}
                  aria-label="Grid view"
                  className={cn("flex h-8 w-8 items-center justify-center rounded-full transition-colors", view === "grid" ? "bg-[#111111] text-white" : "text-[#9CA3AF] hover:text-[#111111]")}
                >
                  <FolderKanban className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setView("list")}
                  aria-label="List view"
                  className={cn("flex h-8 w-8 items-center justify-center rounded-full transition-colors", view === "list" ? "bg-[#111111] text-white" : "text-[#9CA3AF] hover:text-[#111111]")}
                >
                  <Users2 className="h-3.5 w-3.5" />
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
              {featured && <FeaturedProjectCard project={featured} />}

              {/* Capped at 2 columns — project cards carry more information
                  than gig/freelancer cards, so a dense 3-column grid would
                  cramp budget/skills/client details. */}
              <div className={view === "grid" ? "grid grid-cols-1 gap-5 md:grid-cols-2" : "flex flex-col gap-4"}>
                {gridResults.map((p) => (
                  <ProjectCard key={p._id} project={p} layout={view} />
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
            type={type}
            setType={(v) => {
              setType(v);
              resetPage();
            }}
            remoteOnly={remoteOnly}
            setRemoteOnly={(v) => {
              setRemoteOnly(v);
              resetPage();
            }}
            onApply={() => {
              resetPage();
              setMobileFiltersOpen(false);
            }}
            onClear={clearFilters}
          />
        </MobileFilterDrawer>
      )}
    </div>
  );
}

// ============================================================
// Filter sidebar — category picked from the horizontal nav above; only real
// projectApi filter params get a control here (type, isRemote). No
// Budget/Experience/Duration/Location-text/Client-Type sections since the
// API doesn't support filtering on them server-side, and client-side
// filtering a single page would silently break the stated total count.
// ============================================================
function FilterSidebar({
  className,
  category,
  subCategory,
  type,
  setType,
  remoteOnly,
  setRemoteOnly,
  onApply,
  onClear,
}: {
  className?: string;
  category: string;
  subCategory: string;
  type: string;
  setType: (v: string) => void;
  remoteOnly: boolean;
  setRemoteOnly: (v: boolean) => void;
  onApply: () => void;
  onClear: () => void;
}) {
  return (
    <aside className={cn("rounded-[20px] border border-[#E5E7EB] bg-white p-5 lg:sticky lg:top-24", className)}>
      <h3 className="text-sm font-bold text-[#111111]">Filter Projects</h3>

      {category !== "all" && (
        <FilterSection title="Filtering by">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#B6FF00] bg-[#B6FF00]/10 px-3 py-1.5 text-xs font-medium text-[#111111]">
            {subCategory === "all" ? category : subCategory}
          </span>
        </FilterSection>
      )}

      <FilterSection title="Project Type">
        <div className="space-y-1">
          {TYPE_OPTIONS.map((o) => (
            <RadioRow key={o.value} label={o.label} checked={type === o.value} onChange={() => setType(o.value)} />
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Location" last>
        <button
          type="button"
          onClick={() => setRemoteOnly(!remoteOnly)}
          className={cn(
            "flex w-full items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-[13px] font-medium transition-colors",
            remoteOnly ? "border-[#B6FF00] bg-[#B6FF00]/10 text-[#111111]" : "border-[#E5E7EB] text-[#4B5563] hover:border-[#B6FF00]/50"
          )}
        >
          Remote Only
        </button>
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
// freelancer/gig category fields.
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

      <button type="button" onClick={onViewAll} className="mt-5 inline-flex items-center gap-1 text-xs font-semibold text-[#111111] hover:underline">
        View all {category} projects <ArrowRight className="h-3 w-3" />
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
        <div className="absolute right-0 top-full z-20 mt-1.5 w-52 overflow-hidden rounded-xl border border-[#E5E7EB] bg-white py-1 shadow-[0_16px_40px_-20px_rgba(17,17,17,0.25)]">
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

function budgetLabel(project: Project) {
  if (project.budgetMin <= 0 && project.budgetMax <= 0) return "Open budget";
  if (project.budgetMax > project.budgetMin) {
    return `${formatCurrency(project.budgetMin, project.currency as "INR" | "USD")} - ${formatCurrency(project.budgetMax, project.currency as "INR" | "USD")}`;
  }
  return formatCurrency(project.budgetMin, project.currency as "INR" | "USD");
}

function isNewProject(project: Project) {
  return Date.now() - new Date(project.createdAt).getTime() < 3 * 24 * 60 * 60 * 1000;
}

// ============================================================
// Project card (grid + list layouts) — a dedicated marketplace card, kept
// separate from the shared pages/projects/ProjectCard.tsx (also used by the
// dashboard's Saved Items page) so this redesign doesn't affect that surface.
// Clicking through goes to the project's own details page, where the real
// bid/proposal flow already lives — not a direct "Apply" action on the card.
//
// Real-data notes: the employer sub-object on Project has no `verified`
// field (unlike the standalone Freelancer/Brand/Agency profile types), so no
// verified-client badge is shown. There's also no payment-model field
// (fixed/hourly/milestone) or application-deadline field on Project — only a
// budget range and expectedDeliveryDays — so the card never claims a
// payment type it can't back, and shows real "Duration" instead of a
// fabricated deadline countdown.
// ============================================================
function ProjectCard({ project, layout }: { project: Project; layout: "grid" | "list" }) {
  const employer = typeof project.employer === "object" ? project.employer : null;

  return (
    <Link
      to={`/projects/${project._id}`}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-[20px] border border-[#E5E7EB] bg-white p-4 transition-all duration-[220ms] hover:-translate-y-0.5 hover:border-[#B6FF00] hover:shadow-[0_20px_40px_-24px_rgba(17,17,17,0.18)]",
        layout === "list" && "sm:flex-row sm:items-start sm:gap-5"
      )}
    >
      {project.isDemo && <DemoBadge />}
      {/* Left segment — project, client, meta, description, skills. In list
          mode this is the flexible-width scan column; in grid mode it's the
          whole card top. */}
      <div className="min-w-0 flex-1">
        {/* 1. Project header — client avatar, title, company, save */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2.5">
            <Avatar className="h-9 w-9 shrink-0 rounded-xl">
              <AvatarImage src={employer?.avatar} alt={project.companyName} className="rounded-xl object-cover" />
              <AvatarFallback className="rounded-xl bg-[#111111] text-xs font-semibold text-white">{project.companyName[0]}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <h3 className="line-clamp-2 text-[13.5px] font-bold leading-snug text-[#111111]">{project.title}</h3>
              <p className="truncate text-[11.5px] text-[#9CA3AF]">{project.companyName}</p>
            </div>
          </div>
          {layout === "grid" && (
            <div onClick={(e) => e.preventDefault()} className="shrink-0">
              <SaveButton type="project" id={project._id} className="h-7 w-7 bg-[#F1F3EF] text-[#6B7280] hover:bg-[#E5E7EB]" />
            </div>
          )}
        </div>

        {/* 2. Project meta — type, category, remote/location */}
        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
          <span className="rounded-full bg-[#F1FFD6] px-2 py-0.5 text-[10px] font-semibold text-[#4D7A00]">{TYPE_LABELS[project.type]}</span>
          {isNewProject(project) && <span className="rounded-full bg-[#EFF6FF] px-2 py-0.5 text-[10px] font-bold text-[#2563EB]">New</span>}
          {project.category && (
            <span className="rounded-full bg-[#F1F3EF] px-2 py-0.5 text-[10px] font-medium text-[#4B5563]">{project.subCategory || project.category}</span>
          )}
          {project.location && (
            <span className="flex items-center gap-1 text-[11px] text-[#9CA3AF]">
              <MapPin className="h-3 w-3" /> {project.isRemote ? "Remote" : project.location}
            </span>
          )}
        </div>

        {/* 3. Description */}
        <p className="mt-2 line-clamp-2 min-h-[2.2em] text-[12.5px] leading-relaxed text-[#6B7280]">{project.description}</p>

        {/* 5. Skills — max 5 */}
        {project.skills.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {project.skills.slice(0, 5).map((skill) => (
              <span key={skill} className="rounded-full bg-[#F3F5F1] px-2 py-0.5 text-[10.5px] font-medium text-[#4B5563]">
                {skill}
              </span>
            ))}
            {project.skills.length > 5 && (
              <span className="rounded-full bg-[#F3F5F1] px-2 py-0.5 text-[10.5px] font-medium text-[#9CA3AF]">+{project.skills.length - 5} more</span>
            )}
          </div>
        )}

        {layout === "grid" && (
          <>
            {/* 4. Budget — the strongest visual element on the card */}
            <div className="mt-3 flex items-baseline justify-between rounded-xl bg-[#F7F8F5] px-3 py-2.5">
              <div>
                <p className="text-[15px] font-extrabold leading-tight text-[#111111]">{budgetLabel(project)}</p>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-[#9CA3AF]">Project Budget</p>
              </div>
            </div>

            {/* Duration + proposals — compact, real fields only */}
            <div className="mt-2 grid grid-cols-2 gap-x-2 gap-y-2 text-[11px]">
              <InfoCell icon={Clock} label="Duration" value={project.expectedDeliveryDays ? `${project.expectedDeliveryDays}d` : "Flexible"} />
              <InfoCell icon={Users2} label="Proposals" value={String(project.applicationsCount)} />
            </div>

            {/* 6. Footer — posted date, view project */}
            <div className="mt-auto flex items-center justify-between gap-2 pt-3.5">
              <span className="text-[11px] text-[#9CA3AF]">Posted {timeAgoShort(project.createdAt)}</span>
              <span className="flex items-center gap-1 text-xs font-semibold text-[#111111] group-hover:underline">
                View Project <ArrowRight className="h-3 w-3" />
              </span>
            </div>
          </>
        )}
      </div>

      {/* Right segment — list mode only: budget, duration, proposals, save,
          posted date and the CTA, all in one scannable column. */}
      {layout === "list" && (
        <div className="mt-3 flex shrink-0 flex-col gap-2 border-t border-[#F1F3EF] pt-3 sm:mt-0 sm:w-44 sm:border-t-0 sm:pt-0">
          <div className="flex items-start justify-between gap-2 sm:flex-col sm:items-end sm:text-right">
            <div>
              <p className="text-[15px] font-extrabold leading-tight text-[#111111]">{budgetLabel(project)}</p>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-[#9CA3AF]">Project Budget</p>
            </div>
            <div onClick={(e) => e.preventDefault()} className="shrink-0">
              <SaveButton type="project" id={project._id} className="h-7 w-7 bg-[#F1F3EF] text-[#6B7280] hover:bg-[#E5E7EB]" />
            </div>
          </div>

          <div className="flex items-center gap-3 text-[11px] text-[#6B7280] sm:justify-end">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" /> {project.expectedDeliveryDays ? `${project.expectedDeliveryDays}d` : "Flexible"}
            </span>
            <span className="flex items-center gap-1">
              <Users2 className="h-3 w-3" /> {project.applicationsCount} proposals
            </span>
          </div>

          <div className="mt-auto flex items-center justify-between gap-2 pt-2 sm:flex-col sm:items-end sm:gap-1">
            <span className="text-[11px] text-[#9CA3AF]">Posted {timeAgoShort(project.createdAt)}</span>
            <span className="flex items-center gap-1 text-xs font-semibold text-[#111111] group-hover:underline">
              View Project <ArrowRight className="h-3 w-3" />
            </span>
          </div>
        </div>
      )}
    </Link>
  );
}

// ============================================================
// Featured project — real highest-budget result on page 1, clearly not a
// fabricated pick.
// ============================================================
function FeaturedProjectCard({ project }: { project: Project }) {
  const employer = typeof project.employer === "object" ? project.employer : null;

  return (
    <div className="relative mb-5 flex flex-col gap-5 rounded-[20px] border border-[#E5E7EB] bg-white p-5 shadow-[0_2px_8px_rgba(17,17,17,0.04)] sm:flex-row sm:items-start">
      {project.isDemo && <DemoBadge />}
      <div className="min-w-0 flex-1">
        <span className="mb-2 inline-flex items-center gap-1 rounded-full bg-[#ECFDF3] px-2.5 py-1 text-[10.5px] font-bold text-[#16A34A]">
          <Sparkles className="h-3 w-3" /> Featured
        </span>

        <div className="flex items-center gap-2.5">
          <Avatar className="h-9 w-9 shrink-0 rounded-xl">
            <AvatarImage src={employer?.avatar} alt={project.companyName} className="rounded-xl object-cover" />
            <AvatarFallback className="rounded-xl bg-[#111111] text-xs font-semibold text-white">{project.companyName[0]}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <h3 className="text-lg font-bold leading-snug text-[#111111]">{project.title}</h3>
            <p className="truncate text-[12px] text-[#9CA3AF]">{project.companyName}</p>
          </div>
        </div>

        <p className="mt-2.5 line-clamp-2 max-w-2xl text-[13px] leading-relaxed text-[#6B7280]">{project.description}</p>

        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-[#6B7280]">
          <span className="rounded-full bg-[#F1FFD6] px-2.5 py-1 text-[10.5px] font-semibold text-[#4D7A00]">{TYPE_LABELS[project.type]}</span>
          <span className="flex items-center gap-1">
            <Users2 className="h-3.5 w-3.5" /> {project.applicationsCount} proposals
          </span>
          {project.location && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" /> {project.isRemote ? "Remote" : project.location}
            </span>
          )}
        </div>
      </div>

      <div className="flex shrink-0 flex-col items-start gap-3 sm:items-end">
        <div className="text-left sm:text-right">
          <p className="text-[11px] text-[#9CA3AF]">Budget</p>
          <p className="text-lg font-extrabold text-[#111111]">{budgetLabel(project)}</p>
          <p className="text-[11px] text-[#6B7280]">{project.expectedDeliveryDays ? `${project.expectedDeliveryDays}-day delivery` : "Flexible timeline"}</p>
        </div>
        <Link
          to={`/projects/${project._id}`}
          className="flex items-center justify-center gap-1 rounded-full bg-[#111111] px-5 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-[#B6FF00] hover:text-[#111111]"
        >
          View Project <ArrowRight className="h-3 w-3" />
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
        <FolderKanban className="h-5 w-5" />
      </span>
      <p className="text-base font-bold text-[#111111]">No projects found</p>
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
    <div className={view === "grid" ? "grid grid-cols-1 gap-5 md:grid-cols-2" : "flex flex-col gap-4"}>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="overflow-hidden rounded-[20px] border border-[#E5E7EB] bg-white p-5">
          <div className="flex items-center gap-2.5">
            <Skeleton className="h-9 w-9 shrink-0 rounded-xl bg-[#EDEFEA]" />
            <div className="min-w-0 flex-1">
              <Skeleton className="h-3.5 w-3/4 bg-[#EDEFEA]" />
              <Skeleton className="mt-1.5 h-3 w-1/3 bg-[#EDEFEA]" />
            </div>
          </div>
          <Skeleton className="mt-4 h-3 w-full bg-[#EDEFEA]" />
          <Skeleton className="mt-1.5 h-3 w-2/3 bg-[#EDEFEA]" />
          <Skeleton className="mt-4 h-12 w-full rounded-xl bg-[#EDEFEA]" />
          <Skeleton className="mt-3 h-3 w-24 bg-[#EDEFEA]" />
        </div>
      ))}
    </div>
  );
}
