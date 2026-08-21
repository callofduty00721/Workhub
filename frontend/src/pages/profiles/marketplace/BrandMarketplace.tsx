import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  Facebook,
  Globe,
  Instagram,
  LayoutGrid,
  Linkedin,
  List,
  Loader2,
  MapPin,
  Megaphone,
  Music2,
  Search,
  Send,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Twitter,
  Users,
  X,
  Youtube,
  type LucideIcon,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Pagination } from "@/components/shared/Pagination";
import { DirectoryTabs } from "@/pages/profiles/DirectoryTabs";
import { publicProfileApi } from "@/api/publicProfiles";
import { chatApi } from "@/api/chat";
import { useAuth } from "@/context/AuthContext";
import { usePageMeta } from "@/lib/usePageMeta";
import { BRAND_CATEGORIES } from "@/lib/mockData";
import { cn, formatCompactNumber, initialsFromName } from "@/lib/utils";
import type { BrandListItem, ProfileSocialLink } from "@/types";

const POPULAR_INDUSTRIES = BRAND_CATEGORIES.slice(0, 10);

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

type SortOption = "recommended" | "newest" | "followers" | "reach";

// publicProfileApi has no server-side sort param, so these re-order only the
// current page's real results client-side — never fabricated relevance.
// "Most Relevant" (no real score) and "Growing Brands" (no stage field) from
// the original brief were dropped rather than faked.
const SORT_OPTIONS: { label: string; value: SortOption }[] = [
  { label: "Recommended", value: "recommended" },
  { label: "Newest", value: "newest" },
  { label: "Most Followers", value: "followers" },
  { label: "Most Reach", value: "reach" },
];

function isNewBrand(brand: BrandListItem) {
  return Date.now() - new Date(brand.createdAt).getTime() < 30 * 24 * 60 * 60 * 1000;
}

// Self-contained Brand discovery page — mirrors the Freelancer/Gig/Project/
// Contest/Influencer Marketplace pattern (own hero, search, category nav,
// filters, results), real-data-only throughout.
export function BrandMarketplace() {
  const [search, setSearch] = useState("");
  const [searchDraft, setSearchDraft] = useState("");
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState<SortOption>("recommended");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [page, setPage] = useState(1);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  usePageMeta("Brands — GrowHive", "Discover brands running influencer campaigns and collaborations on GrowHive.");

  const resetPage = () => setPage(1);

  const selectCategory = (v: string) => {
    setCategory(v);
    resetPage();
  };

  const clearFilters = () => {
    setCategory("all");
    setSearch("");
    setSearchDraft("");
    resetPage();
  };

  const activeFilterCount = [category !== "all"].filter(Boolean).length;

  const { data, isLoading } = useQuery({
    queryKey: ["public-profiles", "brand", "marketplace", { search, category, page }],
    queryFn: () => publicProfileApi.listBrands({ search: search || undefined, category: category === "all" ? undefined : category, page, limit: 12 }),
  });

  const total = data?.pagination.total ?? 0;
  const results = data?.data ?? [];

  const sortedResults = (() => {
    if (sort === "recommended") return results;
    const copy = [...results];
    if (sort === "newest") return copy.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    if (sort === "followers") return copy.sort((a, b) => (b.brandProfile?.followerCount ?? 0) - (a.brandProfile?.followerCount ?? 0));
    return copy.sort((a, b) => (b.totalReach ?? 0) - (a.totalReach ?? 0));
  })();

  // Real-data-only "Featured" pick — largest real audience on page 1, only
  // when it actually has one. No curated/fabricated placement.
  const featured =
    page === 1 && !isLoading ? [...results].sort((a, b) => (b.brandProfile?.followerCount ?? 0) - (a.brandProfile?.followerCount ?? 0)).find((b) => (b.brandProfile?.followerCount ?? 0) > 0) : undefined;
  const gridResults = featured ? sortedResults.filter((b) => b._id !== featured._id) : sortedResults;

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
              / <span className="text-[#6B7280]">Brands</span>
            </p>
            <h1 className="mt-3 max-w-2xl text-3xl font-extrabold tracking-tight text-[#111111] sm:text-4xl">Discover brands worth collaborating with.</h1>
            <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-[#6B7280]">
              Explore growing brands, discover their stories and find opportunities to build meaningful partnerships.
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
                placeholder="Search brands, industries or products..."
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
              {POPULAR_INDUSTRIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => selectCategory(c)}
                  className="rounded-full px-2 py-0.5 font-medium text-[#4B5563] transition-colors hover:bg-[#F1FFD6] hover:text-[#111111]"
                >
                  {c}
                </button>
              ))}
            </div>

            {/* Category tabs — real BRAND_CATEGORIES taxonomy, same one the
                server-side `category` param matches against. */}
            <ScrollableChipRow className="mt-5">
              <CategoryChip label="All" checked={category === "all"} onChange={() => selectCategory("all")} />
              {BRAND_CATEGORIES.map((c) => (
                <CategoryChip key={c} label={c} checked={category === c} onChange={() => selectCategory(c)} />
              ))}
            </ScrollableChipRow>
          </div>
        </div>

        {/* Main layout */}
        <div className="container grid grid-cols-1 items-start gap-6 py-6 lg:grid-cols-[260px_1fr]">
          <FilterSidebar className="hidden lg:block" category={category} onApply={resetPage} onClear={clearFilters} />

          <div className="min-w-0">
            {/* Results header */}
            <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-[#111111]">Explore Brands</h2>
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
                {featured && <FeaturedBrandCard brand={featured} />}

                <div className={view === "grid" ? "grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3" : "flex flex-col gap-4"}>
                  {gridResults.map((b) => (
                    <BrandCard key={b._id} brand={b} layout={view} />
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
// Filter sidebar — category is already picked from the top nav; the real
// publicProfileApi has no server-side Brand Type/Location/Business Stage/
// Collaboration Type/Platform Presence params, so those sections from the
// original brief are intentionally left out rather than built as
// non-functional controls.
// ============================================================
function FilterSidebar({ className, category, onApply, onClear }: { className?: string; category: string; onApply: () => void; onClear: () => void }) {
  return (
    <aside className={cn("rounded-[20px] border border-[#E5E7EB] bg-white p-5 lg:sticky lg:top-24", className)}>
      <h3 className="text-sm font-bold text-[#111111]">Filter Brands</h3>

      {category !== "all" && (
        <div className="mt-4 border-t border-[#E5E7EB] pt-4">
          <p className="mb-2 text-xs font-semibold text-[#111111]">Filtering by</p>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#B6FF00] bg-[#B6FF00]/10 px-3 py-1.5 text-xs font-medium text-[#111111]">
            {category}
          </span>
        </div>
      )}

      <p className="mt-4 border-t border-[#E5E7EB] pt-4 text-[12.5px] leading-relaxed text-[#9CA3AF]">
        Use the industry tabs above to narrow brands further.
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
// Shared bits
// ============================================================
function BrandLogo({ brand, size = "md" }: { brand: BrandListItem; size?: "md" | "lg" }) {
  const dims = size === "lg" ? "h-16 w-16 rounded-2xl" : "h-12 w-12 rounded-[14px]";
  return (
    <Avatar className={cn(dims, "shrink-0 border border-[#E5E7EB] bg-white")}>
      <AvatarImage src={brand.avatar} alt={brand.name} className={size === "lg" ? "rounded-2xl object-contain" : "rounded-[14px] object-contain"} />
      <AvatarFallback className={cn(size === "lg" ? "rounded-2xl" : "rounded-[14px]", "bg-[#111111] font-semibold text-white")}>
        {initialsFromName(brand.name)}
      </AvatarFallback>
    </Avatar>
  );
}

function SocialLinkRow({ website, socialLinks }: { website?: string; socialLinks?: ProfileSocialLink[] }) {
  const links = [
    ...(website ? [{ url: website, ...{ icon: Globe, color: "#6B7280" }, label: "Website" }] : []),
    ...(socialLinks ?? []).filter((l) => l.url).map((l) => ({ url: l.url, ...platformMeta(l.platform), label: l.platform || "Link" })),
  ];
  if (links.length === 0) return null;
  return (
    <div className="flex items-center gap-1.5">
      {links.map(({ url, icon: Icon, label, color }) => (
        <button
          key={label}
          type="button"
          title={label}
          aria-label={label}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            window.open(url, "_blank", "noopener,noreferrer");
          }}
          style={{ borderColor: color, color }}
          className="flex h-7 w-7 items-center justify-center rounded-full border transition-transform hover:scale-110"
        >
          <Icon className="h-3.5 w-3.5" />
        </button>
      ))}
    </div>
  );
}

function BrandBadges({ brand }: { brand: BrandListItem }) {
  return (
    <>
      {brand.isVerified && (
        <span className="flex items-center gap-1 rounded-full bg-[#EFF6FF] px-2 py-0.5 text-[10px] font-bold text-[#2563EB]">
          <ShieldCheck className="h-3 w-3" /> Verified
        </span>
      )}
      {(brand.openCampaignsCount ?? 0) > 0 && (
        <span className="rounded-full bg-[#ECFDF3] px-2 py-0.5 text-[10px] font-bold text-[#16A34A]">Open for Collaboration</span>
      )}
      {isNewBrand(brand) && <span className="rounded-full bg-[#F1F3EF] px-2 py-0.5 text-[10px] font-bold text-[#4B5563]">New</span>}
    </>
  );
}

// ============================================================
// Brand card (grid + list layouts)
// ============================================================
function BrandCard({ brand, layout }: { brand: BrandListItem; layout: "grid" | "list" }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isOwnCard = user?.id === brand._id;
  const categories = brand.brandProfile?.categories ?? [];
  const visibleCategories = categories.slice(0, 3);
  const extraCategoryCount = categories.length - visibleCategories.length;

  const messageMutation = useMutation({
    mutationFn: () => chatApi.getOrCreateConversation(brand._id),
    onSuccess: (c) => navigate(`/dashboard/messages?c=${c._id}`),
  });

  return (
    <Link
      to={`/brands/${brand._id}`}
      className={cn(
        "group flex flex-col rounded-[20px] border border-[#E5E7EB] bg-white p-5 transition-all duration-[220ms] hover:-translate-y-[3px] hover:border-[#B6FF00] hover:shadow-[0_20px_40px_-24px_rgba(17,17,17,0.18)]",
        layout === "list" && "sm:flex-row sm:items-start sm:gap-5"
      )}
    >
      <div className={cn("flex flex-1 flex-col", layout === "list" && "min-w-0")}>
        <div className="flex items-start gap-3">
          <div className="rounded-[14px] transition-colors duration-[220ms] group-hover:bg-[#F1FFD6]">
            <BrandLogo brand={brand} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1 truncate text-[15px] font-bold text-[#111111]">
              {brand.name}
              {brand.isVerified && <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-[#2563EB]" />}
            </p>
            <p className="truncate text-[12px] text-[#6B7280]">{brand.brandProfile?.industry || brand.headline || "Brand"}</p>
            {brand.location && (
              <span className="flex items-center gap-1 text-[11px] text-[#9CA3AF]">
                <MapPin className="h-3 w-3" /> {brand.location}
              </span>
            )}
          </div>
        </div>

        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
          <BrandBadges brand={brand} />
        </div>

        {brand.headline && <p className="mt-2.5 line-clamp-2 text-[12.5px] leading-relaxed text-[#6B7280]">{brand.headline}</p>}

        {visibleCategories.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {visibleCategories.map((c) => (
              <span key={c} className="rounded-full bg-[#F1F3EF] px-2 py-0.5 text-[10.5px] font-medium text-[#4B5563]">
                {c}
              </span>
            ))}
            {extraCategoryCount > 0 && (
              <span className="rounded-full bg-[#F1F3EF] px-2 py-0.5 text-[10.5px] font-medium text-[#9CA3AF]">+{extraCategoryCount}</span>
            )}
          </div>
        )}

        {(brand.openCampaignsCount ?? 0) > 0 && (
          <p className="mt-2.5 flex items-center gap-1.5 text-[12px] font-semibold text-[#111111]">
            <Megaphone className="h-3.5 w-3.5 text-[#16A34A]" /> {brand.openCampaignsCount} open opportunit{brand.openCampaignsCount === 1 ? "y" : "ies"}
          </p>
        )}

        <div className="mt-auto flex items-center justify-between gap-2 pt-3.5">
          <SocialLinkRow website={brand.brandProfile?.website} socialLinks={brand.brandProfile?.socialLinks} />
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
                title="Connect"
              >
                {messageMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
              </button>
            )}
            <span className="flex items-center gap-1 rounded-full bg-[#111111] px-3.5 py-2 text-xs font-semibold text-white transition-colors group-hover:bg-[#B6FF00] group-hover:text-[#111111]">
              View Brand <ArrowRight className="h-3 w-3" />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

// ============================================================
// Featured brand — real largest-audience result on page 1, clearly not a
// fabricated pick.
// ============================================================
function FeaturedBrandCard({ brand }: { brand: BrandListItem }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isOwnCard = user?.id === brand._id;
  const categories = brand.brandProfile?.categories?.slice(0, 3) ?? [];

  const messageMutation = useMutation({
    mutationFn: () => chatApi.getOrCreateConversation(brand._id),
    onSuccess: (c) => navigate(`/dashboard/messages?c=${c._id}`),
  });

  return (
    <div className="mb-5 flex flex-col gap-6 rounded-[20px] border border-[#E5E7EB] bg-white p-5 shadow-[0_2px_8px_rgba(17,17,17,0.04)] sm:flex-row sm:items-center">
      <div className="flex items-center gap-4 sm:w-80 sm:shrink-0">
        <BrandLogo brand={brand} size="lg" />
        <div className="min-w-0">
          <span className="mb-1 inline-flex items-center gap-1 rounded-full bg-[#ECFDF3] px-2.5 py-1 text-[10.5px] font-bold text-[#16A34A]">
            <Sparkles className="h-3 w-3" /> Featured Brand
          </span>
          <p className="flex items-center gap-1 truncate text-base font-bold text-[#111111]">
            {brand.name}
            {brand.isVerified && <BadgeCheck className="h-4 w-4 shrink-0 text-[#2563EB]" />}
          </p>
          <p className="truncate text-[12.5px] text-[#6B7280]">{brand.brandProfile?.industry || brand.headline || "Brand"}</p>
          {brand.location && (
            <span className="flex items-center gap-1 text-[11.5px] text-[#9CA3AF]">
              <MapPin className="h-3 w-3" /> {brand.location}
            </span>
          )}
        </div>
      </div>

      <div className="min-w-0 flex-1">
        {brand.headline && <p className="line-clamp-2 text-[13px] leading-relaxed text-[#6B7280]">{brand.headline}</p>}
        {categories.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {categories.map((c) => (
              <span key={c} className="rounded-full bg-[#F1F3EF] px-2 py-0.5 text-[10.5px] font-medium text-[#4B5563]">
                {c}
              </span>
            ))}
          </div>
        )}
        <div className="mt-3 flex flex-wrap items-center gap-4 text-[12px] text-[#6B7280]">
          {!!brand.brandProfile?.followerCount && (
            <span className="flex items-center gap-1 font-semibold text-[#111111]">
              <Users className="h-3.5 w-3.5" /> {formatCompactNumber(brand.brandProfile.followerCount)} followers
            </span>
          )}
          {!!brand.totalReach && (
            <span className="flex items-center gap-1">
              <Eye className="h-3.5 w-3.5" /> {formatCompactNumber(brand.totalReach)} reach
            </span>
          )}
          {(brand.openCampaignsCount ?? 0) > 0 && (
            <span className="flex items-center gap-1 font-semibold text-[#16A34A]">
              <Megaphone className="h-3.5 w-3.5" /> {brand.openCampaignsCount} open opportunit{brand.openCampaignsCount === 1 ? "y" : "ies"}
            </span>
          )}
        </div>
      </div>

      <div className="flex shrink-0 flex-col items-start gap-3 sm:items-end">
        <SocialLinkRow website={brand.brandProfile?.website} socialLinks={brand.brandProfile?.socialLinks} />
        <div className="flex items-center gap-2">
          {!isOwnCard && (
            <button
              type="button"
              disabled={messageMutation.isPending}
              onClick={() => (user ? messageMutation.mutate() : navigate("/login"))}
              className="flex items-center justify-center gap-1.5 rounded-full border border-[#E5E7EB] bg-white px-4 py-2.5 text-xs font-semibold text-[#111111] transition-colors hover:bg-[#F1F3EF] disabled:opacity-50"
            >
              {messageMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
              Explore Opportunities
            </button>
          )}
          <Link
            to={`/brands/${brand._id}`}
            className="flex items-center justify-center gap-1 rounded-full bg-[#111111] px-5 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-[#B6FF00] hover:text-[#111111]"
          >
            View Brand <ArrowRight className="h-3 w-3" />
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
        <Building2 className="h-5 w-5" />
      </span>
      <p className="text-base font-bold text-[#111111]">No brands found</p>
      <p className="max-w-xs text-sm text-[#6B7280]">Try changing your filters or searching for another industry.</p>
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
          <Skeleton className="mt-3 h-5 w-32 bg-[#EDEFEA]" />
          <Skeleton className="mt-4 h-8 w-24 bg-[#EDEFEA]" />
        </div>
      ))}
    </div>
  );
}
