import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  Award,
  Bot,
  Briefcase,
  Camera,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Code2,
  LayoutGrid,
  List,
  Megaphone,
  Palette,
  PenTool,
  Search,
  SlidersHorizontal,
  Sparkles,
  Trophy,
  Users2,
  Video,
  X,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DemoBadge } from "@/components/DemoBadge";
import { Skeleton } from "@/components/ui/skeleton";
import { SaveButton } from "@/components/shared/SaveButton";
import { InfoCell } from "@/components/shared/InfoCell";
import { Pagination } from "@/components/shared/Pagination";
import { contestApi } from "@/api/contests";
import { cn, formatCurrency, initialsFromName } from "@/lib/utils";
import type { Contest } from "@/types";

// Generic, honest search prompts — not asserted to be real categories (those
// are fully user-generated on this backend, fetched dynamically below).
const POPULAR_SEARCHES = ["Logo Design", "UI/UX", "Website", "Branding", "Photography", "Video", "Writing", "AI"];

type StatusFilter = "all" | "live" | "ending_soon" | "judging" | "completed";

// "Starting Soon" from the original brief has no real backing — Contest has
// no startDate field, so every open contest is already accepting entries.
// These map onto the real ContestStatus enum ("open" | "judging" | "closed")
// plus a computed "ending soon" window, never a fabricated status.
const STATUS_TABS: { label: string; value: StatusFilter }[] = [
  { label: "All Contests", value: "all" },
  { label: "Live Now", value: "live" },
  { label: "Ending Soon", value: "ending_soon" },
  { label: "Judging", value: "judging" },
  { label: "Completed", value: "completed" },
];

type SortOption = "recommended" | "newest" | "highest_prize" | "ending_soon" | "most_popular";

// contestApi has no server-side sort param, so these re-order only the
// current page's real results client-side — never fabricated relevance.
const SORT_OPTIONS: { label: string; value: SortOption }[] = [
  { label: "Recommended", value: "recommended" },
  { label: "Newest", value: "newest" },
  { label: "Highest Prize", value: "highest_prize" },
  { label: "Ending Soon", value: "ending_soon" },
  { label: "Most Popular", value: "most_popular" },
];

function daysLeft(deadline: string) {
  return Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

function isEndingSoon(contest: Contest) {
  return contest.status === "open" && daysLeft(contest.deadline) <= 3 && daysLeft(contest.deadline) > 0;
}

function matchesStatus(contest: Contest, filter: StatusFilter) {
  if (filter === "all") return true;
  if (filter === "judging") return contest.status === "judging";
  if (filter === "completed") return contest.status === "closed";
  if (filter === "ending_soon") return isEndingSoon(contest);
  return contest.status === "open" && !isEndingSoon(contest);
}

function countdownParts(deadline: string) {
  const diff = new Date(deadline).getTime() - Date.now();
  if (diff <= 0) return null;
  return {
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff % 86400000) / 3600000),
    mins: Math.floor((diff % 3600000) / 60000),
  };
}

// Category names here are fully user-generated on this backend — matched by
// keyword rather than a fixed enum, with a neutral trophy fallback. Purely
// decorative differentiation, never a claim about the contest's content.
function categoryIcon(category: string) {
  const c = category.toLowerCase();
  if (c.includes("design") || c.includes("logo") || c.includes("brand")) return Palette;
  if (c.includes("dev") || c.includes("code") || c.includes("tech")) return Code2;
  if (c.includes("writ") || c.includes("content")) return PenTool;
  if (c.includes("market")) return Megaphone;
  if (c.includes("video")) return Video;
  if (c.includes("photo")) return Camera;
  if (c.includes("ai")) return Bot;
  if (c.includes("business")) return Briefcase;
  return Trophy;
}

// Self-contained Contests browsing tab — mirrors the Freelancer/Gig/Project
// Marketplace pattern (own hero, search, category nav, filters, results).
export function ContestMarketplace() {
  const [search, setSearch] = useState("");
  const [searchDraft, setSearchDraft] = useState("");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [sort, setSort] = useState<SortOption>("recommended");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [page, setPage] = useState(1);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const resetPage = () => setPage(1);

  const { data: categories } = useQuery({ queryKey: ["contests", "categories"], queryFn: contestApi.categories });

  const selectCategory = (v: string) => {
    setCategory(v);
    resetPage();
  };

  const clearFilters = () => {
    setCategory("all");
    setStatus("all");
    setSearch("");
    setSearchDraft("");
    resetPage();
  };

  const activeFilterCount = [category !== "all", status !== "all"].filter(Boolean).length;

  const { data, isLoading } = useQuery({
    queryKey: ["contests", "marketplace", { search, category, page }],
    queryFn: () =>
      contestApi.list({
        search: search || undefined,
        category: category === "all" ? undefined : category,
        page,
        limit: 12,
      }),
  });

  const total = data?.pagination.total ?? 0;
  const pageResults = data?.data ?? [];
  const statusFiltered = pageResults.filter((c) => matchesStatus(c, status));

  const sortedResults = (() => {
    if (sort === "recommended") return statusFiltered;
    const copy = [...statusFiltered];
    if (sort === "newest") return copy.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    if (sort === "highest_prize") return copy.sort((a, b) => b.prizeAmount - a.prizeAmount);
    if (sort === "ending_soon") return copy.sort((a, b) => daysLeft(a.deadline) - daysLeft(b.deadline));
    return copy.sort((a, b) => b.entriesCount - a.entriesCount);
  })();

  // Real-data-only "Featured" pick — highest real prize among live contests
  // on page 1. No curated/fabricated placement.
  const featured =
    page === 1 && !isLoading && status === "all"
      ? [...pageResults].filter((c) => c.status === "open").sort((a, b) => b.prizeAmount - a.prizeAmount).find((c) => c.prizeAmount > 0)
      : undefined;
  const gridResults = featured ? sortedResults.filter((c) => c._id !== featured._id) : sortedResults;

  return (
    <div className="bg-[#F7F8F5]">
      {/* Header */}
      <div className="border-b border-[#E5E7EB] bg-[#F7F8F5] py-10 sm:py-14">
        <div className="container">
          <p className="text-xs font-medium text-[#9CA3AF]">
            <Link to="/" className="hover:text-[#111111]">
              Home
            </Link>{" "}
            / <span className="text-[#6B7280]">Contests</span>
          </p>
          <h1 className="mt-3 max-w-2xl text-3xl font-extrabold tracking-tight text-[#111111] sm:text-4xl">Compete, create and get rewarded.</h1>
          <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-[#6B7280]">
            Discover creative and professional contests, showcase your skills and compete for exciting rewards.
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
              placeholder="Search contests, skills or categories..."
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

          {/* Category navigation — real categories from contestApi.categories(),
              same pill-chip pattern as the other three marketplace tabs. */}
          {!!categories?.length && (
            <ScrollableChipRow className="mt-6">
              <CategoryChip label="All" checked={category === "all"} onChange={() => selectCategory("all")} />
              {categories.map((c) => (
                <CategoryChip key={c} label={c} checked={category === c} onChange={() => selectCategory(c)} />
              ))}
            </ScrollableChipRow>
          )}

          {/* Status tabs — compact second-level filter, real ContestStatus
              values plus a computed "ending soon" window. */}
          <div className="mt-4 flex flex-wrap gap-1 border-b border-[#E5E7EB] pb-0.5">
            {STATUS_TABS.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => {
                  setStatus(t.value);
                  resetPage();
                }}
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
          category={category}
          onApply={resetPage}
          onClear={clearFilters}
        />

        <div className="min-w-0">
          {/* Results header */}
          <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-[#111111]">Explore Contests</h2>
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
          ) : statusFiltered.length === 0 ? (
            <EmptyState onClear={clearFilters} />
          ) : (
            <>
              {featured && <FeaturedContestCard contest={featured} />}

              <div className={view === "grid" ? "grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3" : "flex flex-col gap-4"}>
                {gridResults.map((c) => (
                  <ContestCard key={c._id} contest={c} layout={view} />
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
// Filter sidebar — category is already picked from the top nav; the real
// contestApi has no server-side status/prize-range/deadline/skill/
// participation-type params, so those sections from the original brief are
// intentionally left out rather than built as non-functional controls.
// ============================================================
function FilterSidebar({
  className,
  category,
  onApply,
  onClear,
}: {
  className?: string;
  category: string;
  onApply: () => void;
  onClear: () => void;
}) {
  return (
    <aside className={cn("rounded-[20px] border border-[#E5E7EB] bg-white p-5 lg:sticky lg:top-24", className)}>
      <h3 className="text-sm font-bold text-[#111111]">Filter Contests</h3>

      {category !== "all" && (
        <div className="mt-4 border-t border-[#E5E7EB] pt-4">
          <p className="mb-2 text-xs font-semibold text-[#111111]">Filtering by</p>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#B6FF00] bg-[#B6FF00]/10 px-3 py-1.5 text-xs font-medium text-[#111111]">
            {category}
          </span>
        </div>
      )}

      <p className="mt-4 border-t border-[#E5E7EB] pt-4 text-[12.5px] leading-relaxed text-[#9CA3AF]">
        Use the category and status tabs above to narrow contests further.
      </p>

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
// Status badge
// ============================================================
function ContestStatusBadge({ contest }: { contest: Contest }) {
  if (contest.status === "closed") {
    return <span className="rounded-full bg-[#F1F3EF] px-2.5 py-1 text-[10.5px] font-bold text-[#6B7280]">COMPLETED</span>;
  }
  if (contest.status === "judging") {
    return <span className="rounded-full bg-[#EFF6FF] px-2.5 py-1 text-[10.5px] font-bold text-[#2563EB]">JUDGING</span>;
  }
  if (isEndingSoon(contest)) {
    return <span className="rounded-full bg-[#FFF7ED] px-2.5 py-1 text-[10.5px] font-bold text-[#B45309]">ENDING SOON</span>;
  }
  return <span className="rounded-full bg-[#ECFDF3] px-2.5 py-1 text-[10.5px] font-bold text-[#16A34A]">LIVE</span>;
}

// ============================================================
// Contest thumbnail — no image field on the real Contest model, so this is a
// category-matched icon on a soft tint rather than a fabricated stock photo.
// ============================================================
function ContestThumbnail({ contest, className }: { contest: Contest; className?: string }) {
  const Icon = categoryIcon(contest.category);
  return (
    <div className={cn("relative flex aspect-[16/10] w-full items-center justify-center overflow-hidden rounded-t-[20px] bg-gradient-to-br from-[#F1F3EF] to-[#E5E7EB]", className)}>
      <Icon className="h-9 w-9 text-[#9CA3AF] transition-transform duration-[220ms] group-hover:scale-[1.05]" />
    </div>
  );
}

// ============================================================
// Contest card (grid + list layouts)
// ============================================================
function ContestCard({ contest, layout }: { contest: Contest; layout: "grid" | "list" }) {
  const organizer = typeof contest.client === "object" ? contest.client : null;
  const left = daysLeft(contest.deadline);
  const visibleSkills = contest.skills.slice(0, 4);
  const extraSkillCount = contest.skills.length - visibleSkills.length;

  return (
    <Link
      to={`/contests/${contest._id}`}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-[20px] border border-[#E5E7EB] bg-white transition-all duration-[220ms] hover:-translate-y-[3px] hover:border-[#B6FF00] hover:shadow-[0_20px_40px_-24px_rgba(17,17,17,0.18)]",
        layout === "list" && "sm:flex-row sm:items-stretch"
      )}
    >
      {contest.isDemo && <DemoBadge />}
      <div className={cn("relative", layout === "list" && "sm:w-64 sm:shrink-0")}>
        <ContestThumbnail contest={contest} className={layout === "list" ? "rounded-t-[20px] sm:h-full sm:rounded-l-[20px] sm:rounded-tr-none" : undefined} />
        <div className="absolute left-3 top-3">
          <ContestStatusBadge contest={contest} />
        </div>
        <div onClick={(e) => e.preventDefault()} className="absolute right-3 top-3 opacity-0 transition-opacity group-hover:opacity-100">
          <SaveButton type="contest" id={contest._id} className="h-8 w-8 bg-white/95 text-[#6B7280] hover:bg-white" />
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="line-clamp-2 text-sm font-bold leading-snug text-[#111111]">{contest.title}</h3>
        <p className="mt-2 line-clamp-2 text-[12.5px] leading-relaxed text-[#6B7280]">{contest.description}</p>

        {organizer && (
          <div className="mt-2.5 flex items-center gap-2">
            <Avatar className="h-5 w-5">
              <AvatarImage src={organizer.avatar} alt={organizer.name} />
              <AvatarFallback className="bg-[#F1F3EF] text-[9px] font-semibold text-[#111111]">{initialsFromName(organizer.name)}</AvatarFallback>
            </Avatar>
            <span className="truncate text-[11.5px] text-[#9CA3AF]">By {organizer.name}</span>
          </div>
        )}

        <div className="mt-3 grid grid-cols-3 gap-x-2 gap-y-2 rounded-xl bg-[#F7F8F5] p-2.5 text-[11px]">
          <InfoCell icon={Trophy} label="Prize" value={formatCurrency(contest.prizeAmount, contest.currency as "INR" | "USD")} />
          <InfoCell icon={Clock} label="Deadline" value={contest.status === "closed" ? "Ended" : left > 0 ? `${left}d left` : "Ending"} />
          <InfoCell icon={Users2} label="Entries" value={String(contest.entriesCount)} />
        </div>

        {visibleSkills.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {visibleSkills.map((skill) => (
              <span key={skill} className="rounded-full bg-[#F1F3EF] px-2 py-0.5 text-[10.5px] font-medium text-[#4B5563]">
                {skill}
              </span>
            ))}
            {extraSkillCount > 0 && (
              <span className="rounded-full bg-[#F1F3EF] px-2 py-0.5 text-[10.5px] font-medium text-[#9CA3AF]">+{extraSkillCount} more</span>
            )}
          </div>
        )}

        <div className="mt-auto flex items-center justify-between gap-2 pt-3.5">
          <span className="flex items-center gap-1 text-xs font-semibold text-[#111111] group-hover:underline">
            View Contest <ArrowRight className="h-3 w-3" />
          </span>
        </div>
      </div>
    </Link>
  );
}

// ============================================================
// Countdown boxes — used once, on the Featured Contest, to keep regular
// cards scannable rather than visually busy.
// ============================================================
function CountdownBoxes({ deadline }: { deadline: string }) {
  const parts = countdownParts(deadline);
  if (!parts) return <span className="text-sm font-semibold text-[#6B7280]">Contest ended</span>;
  return (
    <div className="flex items-center gap-2">
      {[
        { value: parts.days, label: "DAYS" },
        { value: parts.hours, label: "HRS" },
        { value: parts.mins, label: "MIN" },
      ].map((p) => (
        <div key={p.label} className="flex w-14 flex-col items-center rounded-xl border border-[#E5E7EB] bg-white py-2">
          <span className="text-lg font-extrabold tabular-nums text-[#111111]">{String(p.value).padStart(2, "0")}</span>
          <span className="text-[9px] font-semibold tracking-wide text-[#9CA3AF]">{p.label}</span>
        </div>
      ))}
    </div>
  );
}

// ============================================================
// Featured contest — real highest-prize live contest, clearly not a
// fabricated pick.
// ============================================================
function FeaturedContestCard({ contest }: { contest: Contest }) {
  const organizer = typeof contest.client === "object" ? contest.client : null;
  const visibleSkills = contest.skills.slice(0, 3);

  return (
    <div className="relative mb-5 flex flex-col gap-6 rounded-[20px] border border-[#E5E7EB] bg-white p-5 shadow-[0_2px_8px_rgba(17,17,17,0.04)] sm:flex-row sm:items-center">
      {contest.isDemo && <DemoBadge />}
      <div className="sm:w-72 sm:shrink-0">
        <ContestThumbnail contest={contest} className="rounded-[16px]" />
      </div>

      <div className="min-w-0 flex-1">
        <span className="mb-1.5 inline-flex items-center gap-1 rounded-full bg-[#ECFDF3] px-2.5 py-1 text-[10.5px] font-bold text-[#16A34A]">
          <Sparkles className="h-3 w-3" /> Featured Contest
        </span>
        <h3 className="text-lg font-bold leading-snug text-[#111111]">{contest.title}</h3>
        <p className="mt-1.5 line-clamp-2 max-w-xl text-[13px] leading-relaxed text-[#6B7280]">{contest.description}</p>

        {organizer && (
          <div className="mt-2.5 flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={organizer.avatar} alt={organizer.name} />
              <AvatarFallback className="bg-[#F1F3EF] text-[10px] font-semibold text-[#111111]">{initialsFromName(organizer.name)}</AvatarFallback>
            </Avatar>
            <span className="text-sm font-semibold text-[#111111]">{organizer.name}</span>
          </div>
        )}

        {visibleSkills.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {visibleSkills.map((skill) => (
              <span key={skill} className="rounded-full bg-[#F1F3EF] px-2 py-0.5 text-[10.5px] font-medium text-[#4B5563]">
                {skill}
              </span>
            ))}
          </div>
        )}

        <div className="mt-3">
          <CountdownBoxes deadline={contest.deadline} />
        </div>
      </div>

      <div className="flex shrink-0 flex-col items-start gap-3 sm:items-end">
        <div className="text-left sm:text-right">
          <p className="text-[11px] text-[#9CA3AF]">Prize</p>
          <p className="text-2xl font-extrabold text-[#111111]">{formatCurrency(contest.prizeAmount, contest.currency as "INR" | "USD")}</p>
          <p className="text-[11px] text-[#6B7280]">{contest.entriesCount} entries</p>
        </div>
        <div className="flex items-center gap-2">
          <div onClick={(e) => e.preventDefault()}>
            <SaveButton type="contest" id={contest._id} className="h-9 w-9 border border-[#E5E7EB] bg-white text-[#6B7280] hover:bg-[#F1F3EF]" />
          </div>
          <Link
            to={`/contests/${contest._id}`}
            className="flex items-center justify-center gap-1 rounded-full bg-[#111111] px-5 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-[#B6FF00] hover:text-[#111111]"
          >
            View Contest <ArrowRight className="h-3 w-3" />
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
        <Award className="h-5 w-5" />
      </span>
      <p className="text-base font-bold text-[#111111]">No contests found</p>
      <p className="max-w-xs text-sm text-[#6B7280]">Try changing your filters or searching for another category.</p>
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
            <Skeleton className="h-4 w-full bg-[#EDEFEA]" />
            <Skeleton className="mt-1.5 h-4 w-2/3 bg-[#EDEFEA]" />
            <Skeleton className="mt-3 h-3 w-24 bg-[#EDEFEA]" />
            <Skeleton className="mt-3 h-12 w-full rounded-xl bg-[#EDEFEA]" />
            <Skeleton className="mt-3 h-3 w-20 bg-[#EDEFEA]" />
          </div>
        </div>
      ))}
    </div>
  );
}
