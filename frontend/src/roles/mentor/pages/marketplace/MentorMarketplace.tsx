import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
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
  ArrowRight,
  Sparkles,
  Briefcase,
  GraduationCap,
  Globe,
  Linkedin,
  MessageCircle,
  Video,
  MessageSquare,
  Users,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DemoBadge } from "@/components/DemoBadge";
import { Slider } from "@/components/ui/slider";
import { Skeleton } from "@/components/ui/skeleton";
import { SaveButton } from "@/components/shared/SaveButton";
import { Pagination } from "@/components/shared/Pagination";
import { mentorApi, type MentorSort } from "@/api/mentors";
import { useAuth } from "@/context/AuthContext";
import { cn, initialsFromName, formatCurrency } from "@/lib/utils";
import type { MentorSummary, MentorCategory, MentorSessionFormat } from "@/types";

// Real enum values only — matches the backend's mentorCategory/sessionFormat
// enums exactly. No fabricated categories.
const CATEGORY_LABELS: Record<MentorCategory, string> = {
  startup: "Startup",
  business: "Business",
  career: "Career",
  technology: "Technology",
  marketing: "Marketing",
  finance: "Finance",
  leadership: "Leadership",
  design: "Design",
};
const CATEGORIES = Object.keys(CATEGORY_LABELS) as MentorCategory[];

const SESSION_FORMAT_META: Record<MentorSessionFormat, { label: string; icon: typeof Video }> = {
  video: { label: "Video Call", icon: Video },
  chat: { label: "Chat", icon: MessageSquare },
  in_person: { label: "In Person", icon: Users },
};
const SESSION_FORMATS = Object.keys(SESSION_FORMAT_META) as MentorSessionFormat[];

// A curated set of good-faith search shortcuts — not a claim that these are
// "trending" or backed by any real per-expertise count (same pattern as
// FreelancerMarketplace's POPULAR_SEARCHES / InvestorMarketplace's sectors).
const POPULAR_EXPERTISE = [
  "Startup Strategy",
  "Fundraising",
  "Product Management",
  "Marketing",
  "Leadership",
  "Career Growth",
  "UI/UX",
  "Technology",
  "Finance",
  "Sales",
];

const SORT_OPTIONS: { label: string; value: MentorSort }[] = [
  { label: "Top Rated", value: "rating" },
  { label: "Most Experienced", value: "experience" },
  { label: "Recently Active", value: "newest" },
];

const PRICE_MAX = 10000;

export function MentorMarketplace() {
  const [search, setSearch] = useState("");
  const [searchDraft, setSearchDraft] = useState("");
  const [category, setCategory] = useState<MentorCategory | "all">("all");
  const [expertise, setExpertise] = useState("");
  const [sessionFormat, setSessionFormat] = useState<MentorSessionFormat | "any">("any");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, PRICE_MAX]);
  const [location, setLocation] = useState("");
  const [language, setLanguage] = useState("");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [sort, setSort] = useState<MentorSort>("rating");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [page, setPage] = useState(1);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const resetPage = () => setPage(1);

  const clearFilters = () => {
    setCategory("all");
    setExpertise("");
    setSessionFormat("any");
    setPriceRange([0, PRICE_MAX]);
    setLocation("");
    setLanguage("");
    setVerifiedOnly(false);
    setSearch("");
    setSearchDraft("");
    resetPage();
  };

  const activeFilterCount = [
    category !== "all",
    !!expertise,
    sessionFormat !== "any",
    priceRange[0] > 0 || priceRange[1] < PRICE_MAX,
    !!location,
    !!language,
    verifiedOnly,
  ].filter(Boolean).length;

  const { data, isLoading } = useQuery({
    queryKey: ["mentors", "marketplace", { search, category, expertise, sessionFormat, priceRange, location, language, verifiedOnly, sort, page }],
    queryFn: () =>
      mentorApi.list({
        search: search || undefined,
        category: category === "all" ? undefined : category,
        expertise: expertise || undefined,
        sessionFormat: sessionFormat === "any" ? undefined : sessionFormat,
        location: location || undefined,
        language: language || undefined,
        verified: verifiedOnly || undefined,
        minPrice: priceRange[0] > 0 ? priceRange[0] : undefined,
        maxPrice: priceRange[1] < PRICE_MAX ? priceRange[1] : undefined,
        sort,
        page,
        limit: 12,
      }),
  });

  const total = data?.pagination.total ?? 0;
  const results = data?.data ?? [];

  // Real-data-only "Featured" pick — the highest-rated mentor on the current
  // page, and only when they actually have reviews. No fabricated featured
  // flag or curated placement (mentors have no isFeatured field).
  const featured = page === 1 && !isLoading ? [...results].sort((a, b) => b.rating - a.rating).find((m) => m.reviewCount > 0) : undefined;
  const gridResults = featured ? results.filter((m) => m._id !== featured._id) : results;

  return (
    <div className="bg-[#F7F8F5]">
      {/* Header */}
      <div className="border-b border-[#E5E7EB] bg-[#F7F8F5] py-4 sm:py-6">
        <div className="container">
          <p className="text-xs font-medium text-[#9CA3AF]">
            <Link to="/" className="hover:text-[#111111]">
              Home
            </Link>{" "}
            / <span className="text-[#6B7280]">Mentors</span>
          </p>
          <h1 className="mt-3 max-w-3xl text-3xl font-extrabold tracking-tight text-[#111111] sm:text-4xl">
            Find a mentor who can help you grow.
          </h1>
          <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-[#6B7280]">
            Connect with experienced professionals and get practical guidance for your career, business and startup journey.
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
              placeholder="Search mentors, expertise or topics..."
              aria-label="Search mentors"
              className="h-10 flex-1 min-w-0 bg-transparent text-sm text-[#111111] placeholder:text-[#9CA3AF] focus:outline-none"
            />
            <button
              type="submit"
              className="shrink-0 rounded-xl bg-[#111111] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#B6FF00] hover:text-[#111111]"
            >
              Search
            </button>
          </form>

          {/* Category tabs — real mentorCategory enum, single-select (matches
              the backend's single `category` filter param) */}
          <div className="mt-5 -mx-1 flex gap-2 overflow-x-auto px-1 pb-1 scrollbar-hide">
            <button
              type="button"
              onClick={() => {
                setCategory("all");
                resetPage();
              }}
              className={cn(
                "shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-colors",
                category === "all" ? "bg-[#111111] text-white" : "border border-[#E5E7EB] bg-white text-[#4B5563] hover:border-[#B6FF00]/50"
              )}
            >
              All Mentors
            </button>
            {CATEGORIES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => {
                  setCategory(c);
                  resetPage();
                }}
                className={cn(
                  "shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-colors",
                  category === c ? "bg-[#111111] text-white" : "border border-[#E5E7EB] bg-white text-[#4B5563] hover:border-[#B6FF00]/50"
                )}
              >
                {CATEGORY_LABELS[c]}
              </button>
            ))}
          </div>

          {/* Popular expertise — same real `expertise` filter as the
              sidebar's list, just a faster entry point. */}
          <div className="mt-3 -mx-1 flex gap-2 overflow-x-auto px-1 pb-1 scrollbar-hide">
            {POPULAR_EXPERTISE.map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => {
                  setExpertise((prev) => (prev === e ? "" : e));
                  resetPage();
                }}
                className={cn(
                  "shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                  expertise === e ? "bg-[#F1FFD6] text-[#3F6212]" : "border border-[#E5E7EB] bg-white text-[#6B7280] hover:border-[#B6FF00]/50"
                )}
              >
                {e}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main layout */}
      <div className="container grid grid-cols-1 items-start gap-6 py-6 lg:grid-cols-[280px_1fr]">
        <MentorFilterSidebar
          className="hidden lg:block"
          category={category}
          setCategory={(v) => { setCategory(v); resetPage(); }}
          expertise={expertise}
          setExpertise={(v) => { setExpertise(v); resetPage(); }}
          sessionFormat={sessionFormat}
          setSessionFormat={(v) => { setSessionFormat(v); resetPage(); }}
          priceRange={priceRange}
          setPriceRange={setPriceRange}
          location={location}
          setLocation={(v) => { setLocation(v); resetPage(); }}
          language={language}
          setLanguage={(v) => { setLanguage(v); resetPage(); }}
          verifiedOnly={verifiedOnly}
          setVerifiedOnly={(v) => { setVerifiedOnly(v); resetPage(); }}
          onApply={resetPage}
          onClear={clearFilters}
        />

        <div className="min-w-0">
          {/* Results header */}
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-[#111111]">Mentors</h2>
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
              <MentorSortDropdown sort={sort} setSort={(v) => { setSort(v); resetPage(); }} />
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
            <MentorSkeletonGrid view={view} />
          ) : results.length === 0 ? (
            <MentorEmptyState onClear={clearFilters} />
          ) : (
            <>
              {featured && <FeaturedMentorCard mentor={featured} />}

              <div className={view === "grid" ? "grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3" : "flex flex-col gap-4"}>
                {gridResults.map((m) => (
                  <MentorCard key={m._id} mentor={m} layout={view} />
                ))}
              </div>

              <Pagination page={page} pages={data?.pagination.pages ?? 1} onChange={setPage} />
            </>
          )}
        </div>
      </div>

      {mobileFiltersOpen && (
        <MobileFilterDrawer onClose={() => setMobileFiltersOpen(false)}>
          <MentorFilterSidebar
            category={category}
            setCategory={(v) => { setCategory(v); resetPage(); }}
            expertise={expertise}
            setExpertise={(v) => { setExpertise(v); resetPage(); }}
            sessionFormat={sessionFormat}
            setSessionFormat={(v) => { setSessionFormat(v); resetPage(); }}
            priceRange={priceRange}
            setPriceRange={setPriceRange}
            location={location}
            setLocation={(v) => { setLocation(v); resetPage(); }}
            language={language}
            setLanguage={(v) => { setLanguage(v); resetPage(); }}
            verifiedOnly={verifiedOnly}
            setVerifiedOnly={(v) => { setVerifiedOnly(v); resetPage(); }}
            onApply={() => { resetPage(); setMobileFiltersOpen(false); }}
            onClear={clearFilters}
          />
        </MobileFilterDrawer>
      )}
    </div>
  );
}

// ============================================================
// Filter sidebar — every control maps to a real backend query param. No
// separate "Mentoring Topics" section (the schema has one taxonomy field,
// `expertise`, not two) and no "Available today/this week" granularity
// (only a binary availabilityStatus exists).
// ============================================================
function MentorFilterSidebar({
  className,
  category,
  setCategory,
  expertise,
  setExpertise,
  sessionFormat,
  setSessionFormat,
  priceRange,
  setPriceRange,
  location,
  setLocation,
  language,
  setLanguage,
  verifiedOnly,
  setVerifiedOnly,
  onApply,
  onClear,
}: {
  className?: string;
  category: MentorCategory | "all";
  setCategory: (v: MentorCategory | "all") => void;
  expertise: string;
  setExpertise: (v: string) => void;
  sessionFormat: MentorSessionFormat | "any";
  setSessionFormat: (v: MentorSessionFormat | "any") => void;
  priceRange: [number, number];
  setPriceRange: (v: [number, number]) => void;
  location: string;
  setLocation: (v: string) => void;
  language: string;
  setLanguage: (v: string) => void;
  verifiedOnly: boolean;
  setVerifiedOnly: (v: boolean) => void;
  onApply: () => void;
  onClear: () => void;
}) {
  return (
    <aside className={cn("rounded-[20px] border border-[#E5E7EB] bg-white p-5 lg:sticky lg:top-24", className)}>
      <h3 className="text-sm font-bold text-[#111111]">Filters</h3>

      <FilterSection title="Mentor Category">
        <div className="space-y-1">
          <RadioRow label="Any category" checked={category === "all"} onChange={() => setCategory("all")} />
          {CATEGORIES.map((c) => (
            <RadioRow key={c} label={`${CATEGORY_LABELS[c]} Mentor`} checked={category === c} onChange={() => setCategory(c)} />
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Expertise">
        <div className="space-y-1">
          <RadioRow label="Any expertise" checked={!expertise} onChange={() => setExpertise("")} />
          {POPULAR_EXPERTISE.map((e) => (
            <RadioRow key={e} label={e} checked={expertise === e} onChange={() => setExpertise(e)} />
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Session Type">
        <div className="space-y-1">
          <RadioRow label="Any type" checked={sessionFormat === "any"} onChange={() => setSessionFormat("any")} />
          {SESSION_FORMATS.map((f) => (
            <RadioRow key={f} label={SESSION_FORMAT_META[f].label} checked={sessionFormat === f} onChange={() => setSessionFormat(f)} />
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Session Price">
        <div className="px-1">
          <Slider
            min={0}
            max={PRICE_MAX}
            step={100}
            value={priceRange}
            onValueChange={(v) => setPriceRange([v[0], v[1]] as [number, number])}
            className="[&_[data-radix-slider-range]]:bg-[#B6FF00] [&_[data-radix-slider-thumb]]:border-[#B6FF00]"
          />
          <div className="mt-2 flex items-center justify-between text-xs font-medium text-[#6B7280]">
            <span>{priceRange[0] === 0 ? "Free" : formatCurrency(priceRange[0])}</span>
            <span>
              {formatCurrency(priceRange[1])}
              {priceRange[1] === PRICE_MAX ? "+" : ""}
            </span>
          </div>
        </div>
      </FilterSection>

      <FilterSection title="Language">
        <input
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          placeholder="e.g. English, Hindi"
          className="h-9 w-full rounded-lg border border-[#E5E7EB] bg-white px-3 text-sm text-[#111111] placeholder:text-[#9CA3AF] focus:border-[#B6FF00] focus:outline-none"
        />
      </FilterSection>

      <FilterSection title="Location">
        <input
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Search location"
          className="h-9 w-full rounded-lg border border-[#E5E7EB] bg-white px-3 text-sm text-[#111111] placeholder:text-[#9CA3AF] focus:border-[#B6FF00] focus:outline-none"
        />
      </FilterSection>

      <FilterSection title="Verification" last>
        <label className="flex cursor-pointer items-center gap-2.5 rounded-lg px-1.5 py-1 text-sm text-[#4B5563] transition-colors hover:bg-[#F1F3EF]">
          <input
            type="checkbox"
            checked={verifiedOnly}
            onChange={(e) => setVerifiedOnly(e.target.checked)}
            className="h-4 w-4 rounded border-[#D1D5DB] text-[#111111] focus:ring-[#B6FF00]"
          />
          Verified Mentors
        </label>
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

// ============================================================
// Sort dropdown
// ============================================================
function MentorSortDropdown({ sort, setSort }: { sort: MentorSort; setSort: (v: MentorSort) => void }) {
  const [open, setOpen] = useState(false);
  const activeLabel = SORT_OPTIONS.find((o) => o.value === sort)?.label ?? "Top Rated";

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
// Shared helpers used by every card variant
// ============================================================
function sessionPriceLabel(mentor: MentorSummary) {
  return mentor.sessionRate > 0 ? formatCurrency(mentor.sessionRate) : "Free Session";
}


function MentorSocialLinks({ mentor }: { mentor: MentorSummary }) {
  const links = [
    mentor.socialLinks?.website && { key: "website", url: mentor.socialLinks.website, icon: Globe, label: "Website" },
    mentor.linkedIn && { key: "linkedin", url: mentor.linkedIn, icon: Linkedin, label: "LinkedIn" },
  ].filter((l): l is { key: string; url: string; icon: typeof Globe; label: string } => !!l);

  if (links.length === 0) return null;

  return (
    <div className="flex items-center gap-1.5">
      {links.map(({ key, url, icon: Icon, label }) => (
        <a
          key={key}
          href={url}
          target="_blank"
          rel="noreferrer"
          aria-label={label}
          onClick={(e) => e.stopPropagation()}
          className="flex h-7 w-7 items-center justify-center rounded-full border border-[#E5E7EB] text-[#6B7280] transition-colors hover:border-[#B6FF00] hover:text-[#111111]"
        >
          <Icon className="h-3.5 w-3.5" />
        </a>
      ))}
    </div>
  );
}

// ============================================================
// Mentor card (grid + list layouts)
// ============================================================
function MentorCard({ mentor, layout }: { mentor: MentorSummary; layout: "grid" | "list" }) {
  const { user } = useAuth();
  const isOwnCard = user?.id === mentor._id;
  const isAvailable = mentor.availabilityStatus === "available";
  const visibleExpertise = mentor.expertise.slice(0, 4);
  const extraExpertiseCount = mentor.expertise.length - visibleExpertise.length;
  const formatMeta = mentor.sessionFormat ? SESSION_FORMAT_META[mentor.sessionFormat] : undefined;

  if (layout === "list") {
    return (
      <div className="group relative overflow-hidden rounded-[18px] border border-[#E5E7EB] bg-white p-4 shadow-[0_1px_3px_rgba(17,17,17,0.04)] transition-all duration-[220ms] hover:border-[#B6FF00] hover:shadow-[0_20px_40px_-24px_rgba(17,17,17,0.18)]">
        {mentor.isDemo && <DemoBadge />}
        {!isOwnCard && (
          <div onClick={(e) => e.preventDefault()} className="absolute right-4 top-4">
            <SaveButton type="mentor" id={mentor._id} className="h-9 w-9 rounded-lg border border-[#E5E7EB] bg-white text-[#111111] hover:border-[#B6FF00] hover:bg-[#F5FFD9]" />
          </div>
        )}

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <div className="flex flex-1 items-start gap-3.5">
            <div className="relative shrink-0">
              <Avatar className="h-14 w-14 border border-[#E5E7EB]">
                <AvatarImage src={mentor.avatar} alt={mentor.name} />
                <AvatarFallback className="bg-[#F1F3EF] text-base font-semibold text-[#111111]">{initialsFromName(mentor.name)}</AvatarFallback>
              </Avatar>
              {isAvailable && <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-[#16A34A]" title="Available now" />}
            </div>

            <div className="min-w-0 flex-1 pr-9">
              <div className="flex flex-wrap items-center gap-1.5">
                <h3 className="text-[16px] font-extrabold leading-tight text-[#111111]">{mentor.name}</h3>
                {mentor.isVerified && (
                  <span className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full bg-[#111111]">
                    <BadgeCheck className="h-3 w-3 text-white" />
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-[12.5px] font-medium text-[#6B7280]">
                {mentor.mentorCategory ? `${CATEGORY_LABELS[mentor.mentorCategory]} Mentor` : mentor.headline || "Mentor"}
              </p>
              {mentor.location && (
                <p className="mt-0.5 flex items-center gap-1 text-[12px] text-[#9CA3AF]">
                  <MapPin className="h-3 w-3" /> {mentor.location}
                </p>
              )}

              <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12.5px]">
                <span className="flex items-center gap-1 font-semibold text-[#111111]">
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  {mentor.reviewCount > 0 ? `${mentor.rating.toFixed(1)} (${mentor.reviewCount})` : "New Mentor"}
                </span>
                {mentor.yearsOfExperience > 0 && (
                  <>
                    <span className="h-3 w-px bg-[#E5E7EB]" />
                    <span className="flex items-center gap-1 text-[#6B7280]">
                      <Briefcase className="h-3.5 w-3.5" /> {mentor.yearsOfExperience} yrs experience
                    </span>
                  </>
                )}
              </div>

              {mentor.bio && <p className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-[#4B5563]">{mentor.bio}</p>}

              {visibleExpertise.length > 0 && (
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {visibleExpertise.map((e) => (
                    <span key={e} className="rounded-full bg-[#F3F5F1] px-2.5 py-1 text-[11px] font-medium text-[#4B5563]">
                      {e}
                    </span>
                  ))}
                  {extraExpertiseCount > 0 && <span className="rounded-full bg-[#F3F5F1] px-2.5 py-1 text-[11px] font-medium text-[#9CA3AF]">+{extraExpertiseCount} more</span>}
                </div>
              )}
            </div>
          </div>

          <div className="w-full shrink-0 rounded-xl border border-[#E5E7EB] bg-[#FAFBF8] p-3.5 sm:w-44">
            <p className="text-[10.5px] text-[#9CA3AF]">Session Price</p>
            <p className="mt-0.5 text-[16px] font-extrabold leading-tight text-[#111111]">{sessionPriceLabel(mentor)}</p>
            {formatMeta && (
              <p className="mt-1.5 flex items-center gap-1 text-[11.5px] text-[#6B7280]">
                <formatMeta.icon className="h-3 w-3" /> {formatMeta.label}
              </p>
            )}
            {mentor.completedSessionsCount !== undefined && mentor.completedSessionsCount > 0 && (
              <p className="mt-1 flex items-center gap-1 text-[11px] text-[#6B7280]">
                <GraduationCap className="h-3 w-3" /> {mentor.completedSessionsCount} sessions completed
              </p>
            )}
          </div>
        </div>

        <div className="mt-3.5 flex items-center justify-between gap-3">
          <MentorSocialLinks mentor={mentor} />
          <div className="ml-auto flex gap-2">
            <Link
              to={`/mentors/${mentor._id}`}
              className="flex h-10 items-center justify-center gap-1.5 rounded-lg border border-[#111111] bg-white px-4 text-[13px] font-semibold text-[#111111] transition-colors hover:bg-[#F7F8F5]"
            >
              View Profile
            </Link>
            <Link
              to={`/mentors/${mentor._id}`}
              className="flex h-10 items-center justify-center gap-1.5 rounded-lg bg-[#111111] px-4 text-[13px] font-semibold text-white transition-colors hover:bg-[#B6FF00] hover:text-[#111111]"
            >
              Book Session
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="group relative flex h-full flex-col overflow-hidden rounded-[20px] border border-[#E5E7EB] bg-white p-4 shadow-[0_1px_3px_rgba(17,17,17,0.04)] transition-all duration-[220ms] hover:-translate-y-0.5 hover:border-[#B6FF00] hover:shadow-[0_20px_40px_-24px_rgba(17,17,17,0.18)]">
      {mentor.isDemo && <DemoBadge />}
      {!isOwnCard && (
        <div onClick={(e) => e.preventDefault()} className="absolute right-4 top-4 z-10">
          <SaveButton type="mentor" id={mentor._id} className="h-8 w-8 bg-[#F1F3EF] text-[#6B7280] hover:bg-[#E5E7EB]" />
        </div>
      )}

      <div className="flex items-start gap-3 pr-9">
        <div className="relative shrink-0">
          <Avatar className="h-12 w-12 border border-[#E5E7EB] transition-transform duration-[220ms] group-hover:scale-[1.04]">
            <AvatarImage src={mentor.avatar} alt={mentor.name} />
            <AvatarFallback className="bg-[#F1F3EF] text-sm font-semibold text-[#111111]">{initialsFromName(mentor.name)}</AvatarFallback>
          </Avatar>
          {isAvailable && <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-[#16A34A]" title="Available now" />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1">
            <p className="truncate text-[15px] font-bold leading-tight text-[#111111]">{mentor.name}</p>
            {mentor.isVerified && <BadgeCheck className="h-4 w-4 shrink-0 text-[#111111]" />}
          </div>
          <p className="truncate text-[12.5px] font-medium text-[#6B7280]">
            {mentor.mentorCategory ? `${CATEGORY_LABELS[mentor.mentorCategory]} Mentor` : mentor.headline || "Mentor"}
          </p>
          {mentor.location && (
            <p className="mt-0.5 flex items-center gap-1 text-[11.5px] text-[#9CA3AF]">
              <MapPin className="h-3 w-3 shrink-0" /> {mentor.location}
            </p>
          )}
        </div>
      </div>

      <div className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px]">
        <span className="flex items-center gap-1 font-semibold text-[#111111]">
          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
          {mentor.reviewCount > 0 ? mentor.rating.toFixed(1) : "New"}
        </span>
        {mentor.yearsOfExperience > 0 && (
          <>
            <span className="h-3 w-px bg-[#E5E7EB]" />
            <span className="text-[#6B7280]">{mentor.yearsOfExperience} yrs exp.</span>
          </>
        )}
        {isAvailable && (
          <>
            <span className="h-3 w-px bg-[#E5E7EB]" />
            <span className="flex items-center gap-1 font-medium text-[#16A34A]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#16A34A]" /> Available
            </span>
          </>
        )}
      </div>

      {mentor.bio && <p className="mt-2.5 line-clamp-2 border-l-2 border-[#B6FF00] pl-3 text-[12.5px] italic leading-relaxed text-[#4B5563]">{mentor.bio}</p>}

      {visibleExpertise.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {visibleExpertise.map((e) => (
            <span key={e} className="rounded-full bg-[#F3F5F1] px-2.5 py-1 text-[11px] font-medium text-[#4B5563]">
              {e}
            </span>
          ))}
          {extraExpertiseCount > 0 && <span className="rounded-full bg-[#F3F5F1] px-2.5 py-1 text-[11px] font-medium text-[#9CA3AF]">+{extraExpertiseCount} more</span>}
        </div>
      )}

      <div className="mt-3 grid grid-cols-2 gap-2 rounded-xl border border-[#F1F3EF] p-2.5 text-center">
        <div>
          <p className="truncate text-[12.5px] font-bold text-[#111111]">{sessionPriceLabel(mentor)}</p>
          <p className="text-[9.5px] text-[#9CA3AF]">/ session</p>
        </div>
        <div className="border-l border-[#F1F3EF]">
          <p className="truncate text-[12.5px] font-bold text-[#111111]">{formatMeta ? formatMeta.label : "—"}</p>
          <p className="text-[9.5px] text-[#9CA3AF]">Format</p>
        </div>
      </div>

      <div className="mt-auto pt-3">
        <div className="mb-2 flex items-center justify-between">
          <MentorSocialLinks mentor={mentor} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Link
            to={`/mentors/${mentor._id}`}
            className="flex h-10 items-center justify-center rounded-[12px] border border-[#111111] bg-white text-center text-xs font-semibold text-[#111111] transition-colors hover:bg-[#F7F8F5]"
          >
            View Profile
          </Link>
          <Link
            to={`/mentors/${mentor._id}`}
            className="flex h-10 items-center justify-center gap-1.5 rounded-[12px] bg-[#111111] text-xs font-semibold text-white transition-colors group-hover:bg-[#B6FF00] group-hover:text-[#111111]"
          >
            Book Session
          </Link>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Featured mentor — real highest-rated result (with actual reviews), not a
// curated fake pick
// ============================================================
function FeaturedMentorCard({ mentor }: { mentor: MentorSummary }) {
  const expertise = mentor.expertise.slice(0, 5);

  return (
    <div className="relative mb-5 flex flex-col gap-5 overflow-hidden rounded-[20px] border border-[#E5E7EB] bg-white p-6 shadow-[0_2px_8px_rgba(17,17,17,0.04)] sm:flex-row sm:items-center">
      {mentor.isDemo && <DemoBadge />}
      <div className="flex items-start gap-4 sm:flex-1">
        <Avatar className="h-20 w-20 shrink-0 border border-[#E5E7EB]">
          <AvatarImage src={mentor.avatar} alt={mentor.name} />
          <AvatarFallback className="bg-[#F1F3EF] text-xl font-semibold text-[#111111]">{initialsFromName(mentor.name)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <span className="mb-1.5 inline-flex items-center gap-1 rounded-full bg-[#ECFDF3] px-2.5 py-1 text-[10.5px] font-bold text-[#16A34A]">
            <Sparkles className="h-3 w-3" /> Featured Mentor
          </span>
          <div className="flex items-center gap-1.5">
            <p className="text-lg font-bold text-[#111111]">{mentor.name}</p>
            {mentor.isVerified && <BadgeCheck className="h-4 w-4 text-[#16A34A]" />}
          </div>
          <p className="text-sm text-[#6B7280]">{mentor.mentorCategory ? `${CATEGORY_LABELS[mentor.mentorCategory]} Mentor` : mentor.headline || "Mentor"}</p>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#6B7280]">
            {mentor.location && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" /> {mentor.location}
              </span>
            )}
            <span className="flex items-center gap-1 font-semibold text-[#111111]">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> {mentor.rating.toFixed(1)} ({mentor.reviewCount})
            </span>
            {mentor.yearsOfExperience > 0 && <span>{mentor.yearsOfExperience} yrs experience</span>}
          </div>
          {expertise.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {expertise.map((e) => (
                <span key={e} className="rounded-full bg-[#F1F3EF] px-2.5 py-1 text-[11px] font-medium text-[#4B5563]">
                  {e}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex shrink-0 flex-col items-start gap-3 sm:items-end">
        <div className="text-left sm:text-right">
          <p className="text-lg font-extrabold text-[#111111]">{sessionPriceLabel(mentor)}</p>
          <p className="text-[11px] text-[#9CA3AF]">per session</p>
        </div>
        <div className="flex w-full gap-2 sm:w-auto">
          <Link
            to={`/mentors/${mentor._id}`}
            className="flex-1 rounded-full border border-[#E5E7EB] px-4 py-2 text-center text-xs font-semibold text-[#111111] transition-colors hover:border-[#111111] sm:flex-none"
          >
            View Profile
          </Link>
          <Link
            to={`/mentors/${mentor._id}`}
            className="flex flex-1 items-center justify-center gap-1 rounded-full bg-[#111111] px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#B6FF00] hover:text-[#111111] sm:flex-none"
          >
            Book Session <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Loading / empty states
// ============================================================
function MentorSkeletonGrid({ view }: { view: "grid" | "list" }) {
  return (
    <div className={view === "grid" ? "grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3" : "flex flex-col gap-4"}>
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className={cn("w-full rounded-[20px] bg-[#EDEFEA]", view === "grid" ? "h-80" : "h-40")} />
      ))}
    </div>
  );
}

function MentorEmptyState({ onClear }: { onClear: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-[20px] border border-dashed border-[#E5E7EB] bg-white py-16 text-center">
      <MessageCircle className="h-9 w-9 text-[#9CA3AF]" />
      <p className="text-base font-semibold text-[#111111]">No mentors found</p>
      <p className="max-w-sm text-sm text-[#9CA3AF]">Try changing your filters or searching for another expertise.</p>
      <button
        type="button"
        onClick={onClear}
        className="mt-1 rounded-full bg-[#111111] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#B6FF00] hover:text-[#111111]"
      >
        Clear Filters
      </button>
    </div>
  );
}
