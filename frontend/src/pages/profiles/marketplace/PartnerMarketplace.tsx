import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  BadgeCheck,
  ChevronDown,
  Eye,
  Facebook,
  Globe,
  Handshake,
  Instagram,
  LayoutGrid,
  Linkedin,
  List,
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
import { DemoBadge } from "@/components/DemoBadge";
import { Skeleton } from "@/components/ui/skeleton";
import { Pagination } from "@/components/shared/Pagination";
import { DirectoryTabs } from "@/pages/profiles/DirectoryTabs";
import { publicProfileApi } from "@/api/publicProfiles";
import { chatApi } from "@/api/chat";
import { useAuth } from "@/context/AuthContext";
import { usePageMeta } from "@/lib/usePageMeta";
import { cn, formatCompactNumber, initialsFromName } from "@/lib/utils";
import type { ProfileSocialLink, TalentPartnerListItem } from "@/types";

// The real publicProfileApi only supports `search` for talent partners —
// `category` is documented as a brand-only match (harmless-but-ignored for
// this role), so there's no real category/partnership-type taxonomy to
// build filter tabs against. These are search shortcuts (a real, working
// text query), not filter chips.
const POPULAR_SEARCHES = ["Technology", "Marketing", "Distribution", "Technology Partners", "Manufacturing", "Education", "Finance", "Business Services"];

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

type SortOption = "recommended" | "newest" | "rating" | "experience";

// No server-side sort param either, so these re-order only the current
// page's real results client-side. "Most Relevant"/"Best Match" (no real
// score) were dropped rather than faked.
const SORT_OPTIONS: { label: string; value: SortOption }[] = [
  { label: "Recommended", value: "recommended" },
  { label: "Newest", value: "newest" },
  { label: "Top Rated", value: "rating" },
  { label: "Most Experienced", value: "experience" },
];

function isNewPartner(partner: TalentPartnerListItem) {
  return Date.now() - new Date(partner.createdAt).getTime() < 30 * 24 * 60 * 60 * 1000;
}

// Self-contained Partner discovery page — mirrors the Freelancer/Gig/
// Project/Contest/Influencer/Brand/Agency Marketplace pattern (own hero,
// search, filters, results), real-data-only throughout.
export function PartnerMarketplace() {
  const [search, setSearch] = useState("");
  const [searchDraft, setSearchDraft] = useState("");
  const [location, setLocation] = useState("");
  const [sort, setSort] = useState<SortOption>("recommended");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [page, setPage] = useState(1);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  usePageMeta("Partners — GrowHive", "Discover talent partners and business partners for collaborations on GrowHive.");

  const resetPage = () => setPage(1);

  const clearFilters = () => {
    setLocation("");
    setSearch("");
    setSearchDraft("");
    resetPage();
  };

  const activeFilterCount = [!!location].filter(Boolean).length;

  const { data, isLoading } = useQuery({
    queryKey: ["public-profiles", "talent_partner", "marketplace", { search, page }],
    queryFn: () => publicProfileApi.listTalentPartners({ search: search || undefined, page, limit: 12 }),
  });

  const total = data?.pagination.total ?? 0;

  // Location has no server-side param for this role — a real field,
  // filtered honestly on whatever page is currently loaded.
  const filteredResults = (data?.data ?? []).filter((p) => !location || p.location?.toLowerCase().includes(location.toLowerCase()));

  const sortedResults = (() => {
    if (sort === "recommended") return filteredResults;
    const copy = [...filteredResults];
    if (sort === "newest") return copy.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    if (sort === "rating") return copy.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    return copy.sort((a, b) => (b.totalCampaignsCount ?? 0) - (a.totalCampaignsCount ?? 0));
  })();

  // Real-data-only "Featured" pick — most real campaign experience on page
  // 1, only when it actually has some. No curated/fabricated placement.
  const featured =
    page === 1 && !isLoading ? [...filteredResults].sort((a, b) => (b.totalCampaignsCount ?? 0) - (a.totalCampaignsCount ?? 0)).find((p) => (p.totalCampaignsCount ?? 0) > 0) : undefined;
  const gridResults = featured ? sortedResults.filter((p) => p._id !== featured._id) : sortedResults;

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
              / <span className="text-[#6B7280]">Partners</span>
            </p>
            <h1 className="mt-3 max-w-2xl text-3xl font-extrabold tracking-tight text-[#111111] sm:text-4xl">Find the right partners to grow together.</h1>
            <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-[#6B7280]">
              Discover businesses, agencies, technology providers and ecosystem partners for meaningful collaborations.
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
                placeholder="Search partners, services, industries..."
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
          </div>
        </div>

        {/* Main layout */}
        <div className="container grid grid-cols-1 items-start gap-6 py-6 lg:grid-cols-[260px_1fr]">
          <FilterSidebar
            className="hidden lg:block"
            location={location}
            setLocation={(v) => { setLocation(v); resetPage(); }}
            onApply={resetPage}
            onClear={clearFilters}
          />

          <div className="min-w-0">
            {/* Results header */}
            <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-[#111111]">Explore Partners</h2>
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
                {featured && <FeaturedPartnerCard partner={featured} />}

                <div className={view === "grid" ? "grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3" : "flex flex-col gap-4"}>
                  {gridResults.map((p) => (
                    <PartnerCard key={p._id} partner={p} layout={view} />
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
// Filter sidebar — the real publicProfileApi has no server-side Partner
// Type/Industry/Services/Company Size/Business Stage/Partnership Type/
// Availability params for this role (none of those fields even exist on
// TalentPartnerProfile), so those sections from the original brief are
// intentionally left out. Location IS a real field, applied honestly to
// whichever page is currently loaded (no server param to page through it).
// ============================================================
function FilterSidebar({
  className,
  location,
  setLocation,
  onApply,
  onClear,
}: {
  className?: string;
  location: string;
  setLocation: (v: string) => void;
  onApply: () => void;
  onClear: () => void;
}) {
  return (
    <aside className={cn("rounded-[20px] border border-[#E5E7EB] bg-white p-5 lg:sticky lg:top-24", className)}>
      <h3 className="text-sm font-bold text-[#111111]">Filter Partners</h3>

      <FilterSection title="Location" last>
        <input
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="City, state..."
          className="h-9 w-full rounded-lg border border-[#E5E7EB] px-3 text-[13px] text-[#111111] placeholder:text-[#9CA3AF] focus:border-[#B6FF00] focus:outline-none"
        />
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
function PartnerLogo({ partner, size = "md" }: { partner: TalentPartnerListItem; size?: "md" | "lg" }) {
  const dims = size === "lg" ? "h-16 w-16 rounded-2xl" : "h-12 w-12 rounded-[14px]";
  return (
    <Avatar className={cn(dims, "shrink-0 border border-[#E5E7EB] bg-white")}>
      <AvatarImage src={partner.avatar} alt={partner.name} className={size === "lg" ? "rounded-2xl object-contain" : "rounded-[14px] object-contain"} />
      <AvatarFallback className={cn(size === "lg" ? "rounded-2xl" : "rounded-[14px]", "bg-[#111111] font-semibold text-white")}>
        {initialsFromName(partner.name)}
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

function PartnerBadges({ partner }: { partner: TalentPartnerListItem }) {
  return (
    <>
      {partner.isVerified && (
        <span className="flex items-center gap-1 rounded-full bg-[#EFF6FF] px-2 py-0.5 text-[10px] font-bold text-[#2563EB]">
          <ShieldCheck className="h-3 w-3" /> Verified
        </span>
      )}
      {(partner.openCampaignsCount ?? 0) > 0 && (
        <span className="rounded-full bg-[#ECFDF3] px-2 py-0.5 text-[10px] font-bold text-[#16A34A]">Open for Partnerships</span>
      )}
      {isNewPartner(partner) && <span className="rounded-full bg-[#F1F3EF] px-2 py-0.5 text-[10px] font-bold text-[#4B5563]">New</span>}
    </>
  );
}

// ============================================================
// Partner card (grid + list layouts)
// ============================================================
function PartnerCard({ partner, layout }: { partner: TalentPartnerListItem; layout: "grid" | "list" }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isOwnCard = user?.id === partner._id;

  const messageMutation = useMutation({
    mutationFn: () => chatApi.getOrCreateConversation(partner._id),
    onSuccess: (c) => navigate(`/dashboard/messages?c=${c._id}`),
  });

  return (
    <Link
      to={`/talent-partners/${partner._id}`}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-[20px] border border-[#E5E7EB] bg-white p-5 transition-all duration-[220ms] hover:-translate-y-[3px] hover:border-[#B6FF00] hover:shadow-[0_20px_40px_-24px_rgba(17,17,17,0.18)]",
        layout === "list" && "sm:flex-row sm:items-start sm:gap-5"
      )}
    >
      {partner.isDemo && <DemoBadge />}
      <div className={cn("flex flex-1 flex-col", layout === "list" && "min-w-0")}>
        <div className="flex items-start gap-3">
          <div className="rounded-[14px] transition-colors duration-[220ms] group-hover:bg-[#F1FFD6]">
            <PartnerLogo partner={partner} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1 truncate text-[15px] font-bold text-[#111111]">
              {partner.name}
              {partner.isVerified && <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-[#2563EB]" />}
            </p>
            <p className="truncate text-[12px] text-[#6B7280]">{partner.talentPartnerProfile?.partnerType || partner.headline || "Partner"}</p>
            {partner.location && (
              <span className="flex items-center gap-1 text-[11px] text-[#9CA3AF]">
                <MapPin className="h-3 w-3" /> {partner.location}
              </span>
            )}
          </div>
        </div>

        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
          <PartnerBadges partner={partner} />
        </div>

        {partner.headline && <p className="mt-2.5 line-clamp-2 text-[12.5px] leading-relaxed text-[#6B7280]">{partner.headline}</p>}

        <div className="mt-3 grid grid-cols-3 gap-2 rounded-xl bg-[#F7F8F5] p-2.5 text-center text-[11px]">
          <div>
            <p className="font-bold text-[#111111]">{partner.hiredInfluencersCount ?? 0}</p>
            <p className="text-[#9CA3AF]">Roster</p>
          </div>
          <div>
            <p className="font-bold text-[#111111]">{partner.totalCampaignsCount ?? 0}</p>
            <p className="text-[#9CA3AF]">Campaigns</p>
          </div>
          <div className="flex flex-col items-center">
            <p className="flex items-center gap-0.5 font-bold text-[#111111]">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              {partner.reviewCount ? partner.rating?.toFixed(1) : "—"}
            </p>
            <p className="text-[#9CA3AF]">Rating</p>
          </div>
        </div>

        <div className="mt-auto flex items-center justify-between gap-2 pt-3.5">
          <SocialLinkRow website={partner.talentPartnerProfile?.website} socialLinks={partner.talentPartnerProfile?.socialLinks} />
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
              View Partner <ArrowRight className="h-3 w-3" />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

// ============================================================
// Featured partner — real most-experienced result on page 1. Fetches the
// single full profile (one extra request, only for this one card) so real
// Services and Brand Partnerships can be shown — fields the trimmed list
// endpoint doesn't return, so no other card can honestly show them.
// ============================================================
function FeaturedPartnerCard({ partner }: { partner: TalentPartnerListItem }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isOwnCard = user?.id === partner._id;

  const { data: fullProfile } = useQuery({
    queryKey: ["public-profiles", "talent_partner", partner._id],
    queryFn: () => publicProfileApi.getTalentPartner(partner._id),
  });
  const services = fullProfile?.talentPartnerProfile?.services ?? [];
  const brandPartnerships = fullProfile?.talentPartnerProfile?.brandPartnerships?.slice(0, 4) ?? [];

  const messageMutation = useMutation({
    mutationFn: () => chatApi.getOrCreateConversation(partner._id),
    onSuccess: (c) => navigate(`/dashboard/messages?c=${c._id}`),
  });

  return (
    <div className="relative mb-5 flex flex-col gap-6 overflow-hidden rounded-[20px] border border-[#E5E7EB] bg-white p-5 shadow-[0_2px_8px_rgba(17,17,17,0.04)] sm:flex-row sm:items-start">
      {partner.isDemo && <DemoBadge />}
      <div className="flex items-center gap-4 sm:w-72 sm:shrink-0">
        <PartnerLogo partner={partner} size="lg" />
        <div className="min-w-0">
          <span className="mb-1 inline-flex items-center gap-1 rounded-full bg-[#ECFDF3] px-2.5 py-1 text-[10.5px] font-bold text-[#16A34A]">
            <Sparkles className="h-3 w-3" /> Featured Partner
          </span>
          <p className="flex items-center gap-1 truncate text-base font-bold text-[#111111]">
            {partner.name}
            {partner.isVerified && <BadgeCheck className="h-4 w-4 shrink-0 text-[#2563EB]" />}
          </p>
          <p className="truncate text-[12.5px] text-[#6B7280]">{partner.talentPartnerProfile?.partnerType || partner.headline || "Partner"}</p>
          {partner.location && (
            <span className="flex items-center gap-1 text-[11.5px] text-[#9CA3AF]">
              <MapPin className="h-3 w-3" /> {partner.location}
            </span>
          )}
        </div>
      </div>

      <div className="min-w-0 flex-1">
        {partner.headline && <p className="line-clamp-2 text-[13px] leading-relaxed text-[#6B7280]">{partner.headline}</p>}

        {services.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {services.map((s) => (
              <span key={s} className="rounded-full bg-[#F1F3EF] px-2 py-0.5 text-[10.5px] font-medium text-[#4B5563]">
                {s}
              </span>
            ))}
          </div>
        )}

        {brandPartnerships.length > 0 && (
          <div className="mt-3">
            <p className="mb-1.5 text-[11px] font-semibold text-[#9CA3AF]">Brand Partnerships</p>
            <div className="flex items-center gap-2">
              {brandPartnerships.map((c, i) => (
                <Avatar key={i} className="h-8 w-8 rounded-lg border border-[#E5E7EB] bg-white" title={c.clientName}>
                  <AvatarImage src={c.logoUrl} alt={c.clientName} className="rounded-lg object-contain" />
                  <AvatarFallback className="rounded-lg bg-[#F1F3EF] text-[10px] font-semibold text-[#4B5563]">{initialsFromName(c.clientName)}</AvatarFallback>
                </Avatar>
              ))}
            </div>
          </div>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-4 text-[12px] text-[#6B7280]">
          {!!partner.hiredInfluencersCount && (
            <span className="flex items-center gap-1 font-semibold text-[#111111]">
              <Users className="h-3.5 w-3.5" /> {partner.hiredInfluencersCount} on roster
            </span>
          )}
          {!!partner.totalReach && (
            <span className="flex items-center gap-1">
              <Eye className="h-3.5 w-3.5" /> {formatCompactNumber(partner.totalReach)} reach
            </span>
          )}
          {(partner.totalCampaignsCount ?? 0) > 0 && (
            <span className="flex items-center gap-1">
              <Handshake className="h-3.5 w-3.5" /> {partner.totalCampaignsCount} campaigns run
            </span>
          )}
        </div>
      </div>

      <div className="flex shrink-0 flex-col items-start gap-3 sm:items-end">
        <SocialLinkRow website={partner.talentPartnerProfile?.website} socialLinks={partner.talentPartnerProfile?.socialLinks} />
        <div className="flex items-center gap-2">
          {!isOwnCard && (
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
            to={`/talent-partners/${partner._id}`}
            className="flex items-center justify-center gap-1 rounded-full bg-[#111111] px-5 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-[#B6FF00] hover:text-[#111111]"
          >
            View Partner <ArrowRight className="h-3 w-3" />
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
        <Handshake className="h-5 w-5" />
      </span>
      <p className="text-base font-bold text-[#111111]">No partners found</p>
      <p className="max-w-xs text-sm text-[#6B7280]">Try changing your filters or searching for another industry or partnership type.</p>
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
          <Skeleton className="mt-4 h-8 w-24 bg-[#EDEFEA]" />
        </div>
      ))}
    </div>
  );
}
