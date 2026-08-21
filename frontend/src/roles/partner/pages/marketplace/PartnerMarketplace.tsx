import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Search,
  MapPin,
  BadgeCheck,
  X,
  SlidersHorizontal,
  LayoutGrid,
  List,
  ChevronDown,
  ArrowRight,
  Loader2,
  Sparkles,
  Briefcase,
  Users,
  Globe,
  Linkedin,
  MessageCircle,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DemoBadge } from "@/components/DemoBadge";
import { Skeleton } from "@/components/ui/skeleton";
import { SaveButton } from "@/components/shared/SaveButton";
import { Pagination } from "@/components/shared/Pagination";
import { partnerApi, type PartnerSort } from "@/api/partners";
import { chatApi } from "@/api/chat";
import { useAuth } from "@/context/AuthContext";
import { cn, initialsFromName } from "@/lib/utils";
import type { PartnerSummary, PartnerType, PartnershipType } from "@/types";

// Real enum values only — matches the backend's partnerType/partnershipTypes
// enums exactly. No fabricated categories.
const PARTNER_TYPE_LABELS: Record<PartnerType, string> = {
  agency: "Agency",
  company: "Company",
  consultant: "Consultant",
  service_provider: "Service Provider",
  technology_partner: "Technology Partner",
  strategic_partner: "Strategic Partner",
};
const PARTNER_TYPES = Object.keys(PARTNER_TYPE_LABELS) as PartnerType[];

const PARTNERSHIP_TYPE_LABELS: Record<PartnershipType, string> = {
  service: "Service Partnership",
  referral: "Referral Partnership",
  technology: "Technology Partnership",
  strategic: "Strategic Partnership",
  distribution: "Distribution Partnership",
};
const PARTNERSHIP_TYPES = Object.keys(PARTNERSHIP_TYPE_LABELS) as PartnershipType[];

const COMPANY_SIZES = ["1-10", "11-50", "51-200", "201-500", "500+"];

// A curated set of good-faith search shortcuts — not a claim that these are
// "trending" or backed by any real per-service count (same pattern as every
// other marketplace's popular-terms row).
const POPULAR_SERVICES = [
  "Web Development",
  "Digital Marketing",
  "Branding",
  "Recruitment",
  "Accounting",
  "Legal Services",
  "Business Consulting",
  "UI/UX Design",
  "SEO",
  "Cloud Services",
];

const SORT_OPTIONS: { label: string; value: PartnerSort }[] = [
  { label: "Recently Active", value: "newest" },
  { label: "Most Clients Served", value: "clients" },
  { label: "Most Projects Completed", value: "projects" },
];

export function PartnerMarketplace() {
  const [search, setSearch] = useState("");
  const [searchDraft, setSearchDraft] = useState("");
  const [type, setType] = useState<PartnerType | "all">("all");
  const [service, setService] = useState("");
  const [industry, setIndustry] = useState("");
  const [location, setLocation] = useState("");
  const [companySize, setCompanySize] = useState("");
  const [partnershipType, setPartnershipType] = useState<PartnershipType | "any">("any");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [sort, setSort] = useState<PartnerSort>("newest");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [page, setPage] = useState(1);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const resetPage = () => setPage(1);

  const clearFilters = () => {
    setType("all");
    setService("");
    setIndustry("");
    setLocation("");
    setCompanySize("");
    setPartnershipType("any");
    setVerifiedOnly(false);
    setSearch("");
    setSearchDraft("");
    resetPage();
  };

  const activeFilterCount = [
    type !== "all",
    !!service,
    !!industry,
    !!location,
    !!companySize,
    partnershipType !== "any",
    verifiedOnly,
  ].filter(Boolean).length;

  const { data, isLoading } = useQuery({
    queryKey: ["partners", "marketplace", { search, type, service, industry, location, companySize, partnershipType, verifiedOnly, sort, page }],
    queryFn: () =>
      partnerApi.list({
        search: search || undefined,
        type: type === "all" ? undefined : type,
        service: service || undefined,
        industry: industry || undefined,
        location: location || undefined,
        companySize: companySize || undefined,
        partnershipType: partnershipType === "any" ? undefined : partnershipType,
        verified: verifiedOnly || undefined,
        sort,
        page,
        limit: 12,
      }),
  });

  const total = data?.pagination.total ?? 0;
  const results = data?.data ?? [];

  // Real-data-only "Featured" pick — the highest clients-served result on
  // the current page, and only when it's actually non-zero. No fabricated
  // featured flag or curated placement (partners have no isFeatured field).
  const featured = page === 1 && !isLoading ? [...results].sort((a, b) => (b.clientsServed ?? 0) - (a.clientsServed ?? 0)).find((p) => (p.clientsServed ?? 0) > 0) : undefined;
  const gridResults = featured ? results.filter((p) => p._id !== featured._id) : results;

  return (
    <div className="bg-[#F7F8F5]">
      {/* Header */}
      <div className="border-b border-[#E5E7EB] bg-[#F7F8F5] py-4 sm:py-6">
        <div className="container">
          <p className="text-xs font-medium text-[#9CA3AF]">
            <Link to="/" className="hover:text-[#111111]">
              Home
            </Link>{" "}
            / <span className="text-[#6B7280]">Partners</span>
          </p>
          <h1 className="mt-3 max-w-3xl text-3xl font-extrabold tracking-tight text-[#111111] sm:text-4xl">
            Find the right partner to grow your business.
          </h1>
          <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-[#6B7280]">
            Discover trusted businesses, agencies and professionals for collaboration, services and strategic partnerships.
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
              placeholder="Search partners, services or industries..."
              aria-label="Search partners"
              className="h-10 flex-1 min-w-0 bg-transparent text-sm text-[#111111] placeholder:text-[#9CA3AF] focus:outline-none"
            />
            <button
              type="submit"
              className="shrink-0 rounded-xl bg-[#111111] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#B6FF00] hover:text-[#111111]"
            >
              Search
            </button>
          </form>

          {/* Category tabs — real partnerType enum, single-select (matches
              the backend's single `type` filter param) */}
          <div className="mt-5 -mx-1 flex gap-2 overflow-x-auto px-1 pb-1 scrollbar-hide">
            <button
              type="button"
              onClick={() => {
                setType("all");
                resetPage();
              }}
              className={cn(
                "shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-colors",
                type === "all" ? "bg-[#111111] text-white" : "border border-[#E5E7EB] bg-white text-[#4B5563] hover:border-[#B6FF00]/50"
              )}
            >
              All Partners
            </button>
            {PARTNER_TYPES.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => {
                  setType(t);
                  resetPage();
                }}
                className={cn(
                  "shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-colors",
                  type === t ? "bg-[#111111] text-white" : "border border-[#E5E7EB] bg-white text-[#4B5563] hover:border-[#B6FF00]/50"
                )}
              >
                {PARTNER_TYPE_LABELS[t]}
              </button>
            ))}
          </div>

          {/* Popular services — same real `service` filter as the sidebar's
              list, just a faster entry point. */}
          <div className="mt-3 -mx-1 flex gap-2 overflow-x-auto px-1 pb-1 scrollbar-hide">
            {POPULAR_SERVICES.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => {
                  setService((prev) => (prev === s ? "" : s));
                  resetPage();
                }}
                className={cn(
                  "shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                  service === s ? "bg-[#F1FFD6] text-[#3F6212]" : "border border-[#E5E7EB] bg-white text-[#6B7280] hover:border-[#B6FF00]/50"
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main layout */}
      <div className="container grid grid-cols-1 items-start gap-6 py-6 lg:grid-cols-[280px_1fr]">
        <PartnerFilterSidebar
          className="hidden lg:block"
          type={type}
          setType={(v) => { setType(v); resetPage(); }}
          service={service}
          setService={(v) => { setService(v); resetPage(); }}
          industry={industry}
          setIndustry={(v) => { setIndustry(v); resetPage(); }}
          location={location}
          setLocation={(v) => { setLocation(v); resetPage(); }}
          companySize={companySize}
          setCompanySize={(v) => { setCompanySize(v); resetPage(); }}
          partnershipType={partnershipType}
          setPartnershipType={(v) => { setPartnershipType(v); resetPage(); }}
          verifiedOnly={verifiedOnly}
          setVerifiedOnly={(v) => { setVerifiedOnly(v); resetPage(); }}
          onApply={resetPage}
          onClear={clearFilters}
        />

        <div className="min-w-0">
          {/* Results header */}
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-[#111111]">Partners</h2>
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
              <PartnerSortDropdown sort={sort} setSort={(v) => { setSort(v); resetPage(); }} />
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
            <PartnerSkeletonGrid view={view} />
          ) : results.length === 0 ? (
            <PartnerEmptyState onClear={clearFilters} />
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
          <PartnerFilterSidebar
            type={type}
            setType={(v) => { setType(v); resetPage(); }}
            service={service}
            setService={(v) => { setService(v); resetPage(); }}
            industry={industry}
            setIndustry={(v) => { setIndustry(v); resetPage(); }}
            location={location}
            setLocation={(v) => { setLocation(v); resetPage(); }}
            companySize={companySize}
            setCompanySize={(v) => { setCompanySize(v); resetPage(); }}
            partnershipType={partnershipType}
            setPartnershipType={(v) => { setPartnershipType(v); resetPage(); }}
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
// Filter sidebar — every control maps to a real backend query param.
// ============================================================
function PartnerFilterSidebar({
  className,
  type,
  setType,
  service,
  setService,
  industry,
  setIndustry,
  location,
  setLocation,
  companySize,
  setCompanySize,
  partnershipType,
  setPartnershipType,
  verifiedOnly,
  setVerifiedOnly,
  onApply,
  onClear,
}: {
  className?: string;
  type: PartnerType | "all";
  setType: (v: PartnerType | "all") => void;
  service: string;
  setService: (v: string) => void;
  industry: string;
  setIndustry: (v: string) => void;
  location: string;
  setLocation: (v: string) => void;
  companySize: string;
  setCompanySize: (v: string) => void;
  partnershipType: PartnershipType | "any";
  setPartnershipType: (v: PartnershipType | "any") => void;
  verifiedOnly: boolean;
  setVerifiedOnly: (v: boolean) => void;
  onApply: () => void;
  onClear: () => void;
}) {
  return (
    <aside className={cn("rounded-[20px] border border-[#E5E7EB] bg-white p-5 lg:sticky lg:top-24", className)}>
      <h3 className="text-sm font-bold text-[#111111]">Filters</h3>

      <FilterSection title="Partner Type">
        <div className="space-y-1">
          <RadioRow label="Any type" checked={type === "all"} onChange={() => setType("all")} />
          {PARTNER_TYPES.map((t) => (
            <RadioRow key={t} label={PARTNER_TYPE_LABELS[t]} checked={type === t} onChange={() => setType(t)} />
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Services">
        <div className="space-y-1">
          <RadioRow label="Any service" checked={!service} onChange={() => setService("")} />
          {POPULAR_SERVICES.map((s) => (
            <RadioRow key={s} label={s} checked={service === s} onChange={() => setService(s)} />
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Industries">
        <input
          value={industry}
          onChange={(e) => setIndustry(e.target.value)}
          placeholder="e.g. SaaS, FinTech"
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

      <FilterSection title="Partnership Type">
        <div className="space-y-1">
          <RadioRow label="Any type" checked={partnershipType === "any"} onChange={() => setPartnershipType("any")} />
          {PARTNERSHIP_TYPES.map((t) => (
            <RadioRow key={t} label={PARTNERSHIP_TYPE_LABELS[t]} checked={partnershipType === t} onChange={() => setPartnershipType(t)} />
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Company Size">
        <div className="space-y-1">
          <RadioRow label="Any size" checked={!companySize} onChange={() => setCompanySize("")} />
          {COMPANY_SIZES.map((s) => (
            <RadioRow key={s} label={`${s} employees`} checked={companySize === s} onChange={() => setCompanySize(s)} />
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Verification" last>
        <label className="flex cursor-pointer items-center gap-2.5 rounded-lg px-1.5 py-1 text-sm text-[#4B5563] transition-colors hover:bg-[#F1F3EF]">
          <input
            type="checkbox"
            checked={verifiedOnly}
            onChange={(e) => setVerifiedOnly(e.target.checked)}
            className="h-4 w-4 rounded border-[#D1D5DB] text-[#111111] focus:ring-[#B6FF00]"
          />
          Verified Partners
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
function PartnerSortDropdown({ sort, setSort }: { sort: PartnerSort; setSort: (v: PartnerSort) => void }) {
  const [open, setOpen] = useState(false);
  const activeLabel = SORT_OPTIONS.find((o) => o.value === sort)?.label ?? "Recently Active";

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

// ============================================================
// Shared helpers used by every card variant
// ============================================================
function useConnect(partnerId: string) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const mutation = useMutation({
    mutationFn: () => chatApi.getOrCreateConversation(partnerId),
    onSuccess: (c) => navigate(`/dashboard/messages?c=${c._id}`),
  });
  return { user, navigate, mutation };
}

function PartnerSocialLinks({ partner }: { partner: PartnerSummary }) {
  const links = [
    partner.socialLinks?.website && { key: "website", url: partner.socialLinks.website, icon: Globe, label: "Website" },
    partner.linkedIn && { key: "linkedin", url: partner.linkedIn, icon: Linkedin, label: "LinkedIn" },
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
// Partner card (grid + list layouts)
// ============================================================
function PartnerCard({ partner, layout }: { partner: PartnerSummary; layout: "grid" | "list" }) {
  const { user, navigate, mutation } = useConnect(partner._id);
  const isOwnCard = user?.id === partner._id;
  const displayName = partner.organizationName || partner.name;
  const visibleServices = partner.services.slice(0, 4);
  const extraServiceCount = partner.services.length - visibleServices.length;
  const visiblePartnershipTypes = (partner.partnershipTypes ?? []).slice(0, 3);
  const extraPartnershipCount = (partner.partnershipTypes ?? []).length - visiblePartnershipTypes.length;

  if (layout === "list") {
    return (
      <div className="group relative overflow-hidden rounded-[18px] border border-[#E5E7EB] bg-white p-4 shadow-[0_1px_3px_rgba(17,17,17,0.04)] transition-all duration-[220ms] hover:border-[#B6FF00] hover:shadow-[0_20px_40px_-24px_rgba(17,17,17,0.18)]">
        {partner.isDemo && <DemoBadge />}
        {!isOwnCard && (
          <div onClick={(e) => e.preventDefault()} className="absolute right-4 top-4">
            <SaveButton type="partner" id={partner._id} className="h-9 w-9 rounded-lg border border-[#E5E7EB] bg-white text-[#111111] hover:border-[#B6FF00] hover:bg-[#F5FFD9]" />
          </div>
        )}

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <div className="flex flex-1 items-start gap-3.5">
            <Avatar className="h-14 w-14 shrink-0 rounded-xl border border-[#E5E7EB]">
              <AvatarImage src={partner.avatar} alt={displayName} />
              <AvatarFallback className="rounded-xl bg-[#F1F3EF] text-base font-semibold text-[#111111]">{initialsFromName(displayName)}</AvatarFallback>
            </Avatar>

            <div className="min-w-0 flex-1 pr-9">
              <div className="flex flex-wrap items-center gap-1.5">
                <h3 className="text-[16px] font-extrabold leading-tight text-[#111111]">{displayName}</h3>
                {partner.isVerified && (
                  <span className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full bg-[#111111]">
                    <BadgeCheck className="h-3 w-3 text-white" />
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-[12.5px] font-medium text-[#6B7280]">{PARTNER_TYPE_LABELS[partner.partnerType]}</p>
              {partner.location && (
                <p className="mt-0.5 flex items-center gap-1 text-[12px] text-[#9CA3AF]">
                  <MapPin className="h-3 w-3" /> {partner.location}
                </p>
              )}

              {partner.bio && <p className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-[#4B5563]">{partner.bio}</p>}

              {visibleServices.length > 0 && (
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {visibleServices.map((s) => (
                    <span key={s} className="rounded-full bg-[#F3F5F1] px-2.5 py-1 text-[11px] font-medium text-[#4B5563]">
                      {s}
                    </span>
                  ))}
                  {extraServiceCount > 0 && <span className="rounded-full bg-[#F3F5F1] px-2.5 py-1 text-[11px] font-medium text-[#9CA3AF]">+{extraServiceCount} more</span>}
                </div>
              )}
            </div>
          </div>

          <div className="w-full shrink-0 rounded-xl border border-[#E5E7EB] bg-[#FAFBF8] p-3.5 sm:w-48">
            {!!partner.industries?.length && (
              <>
                <p className="text-[10.5px] text-[#9CA3AF]">Industries</p>
                <p className="mt-0.5 truncate text-[13px] font-semibold text-[#111111]">{partner.industries.slice(0, 2).join(", ")}</p>
              </>
            )}
            {visiblePartnershipTypes.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {visiblePartnershipTypes.map((t) => (
                  <span key={t} className="rounded-full bg-[#F1FFD6] px-2 py-0.5 text-[10px] font-semibold text-[#3F6212]">
                    {PARTNERSHIP_TYPE_LABELS[t]}
                  </span>
                ))}
                {extraPartnershipCount > 0 && <span className="rounded-full bg-[#F1FFD6] px-2 py-0.5 text-[10px] font-semibold text-[#3F6212]">+{extraPartnershipCount}</span>}
              </div>
            )}
            {!!partner.clientsServed && (
              <p className="mt-2 flex items-center gap-1 text-[11px] text-[#6B7280]">
                <Users className="h-3 w-3" /> {partner.clientsServed} clients served
              </p>
            )}
            {!!partner.projectsCompleted && (
              <p className="mt-1 flex items-center gap-1 text-[11px] text-[#6B7280]">
                <Briefcase className="h-3 w-3" /> {partner.projectsCompleted} projects
              </p>
            )}
          </div>
        </div>

        <div className="mt-3.5 flex items-center justify-between gap-3">
          <PartnerSocialLinks partner={partner} />
          <div className="ml-auto flex gap-2">
            <Link
              to={`/partners/${partner._id}`}
              className="flex h-10 items-center justify-center gap-1.5 rounded-lg border border-[#111111] bg-white px-4 text-[13px] font-semibold text-[#111111] transition-colors hover:bg-[#F7F8F5]"
            >
              View Profile
            </Link>
            <button
              type="button"
              disabled={isOwnCard || mutation.isPending}
              onClick={() => (user ? mutation.mutate() : navigate("/login"))}
              className="flex h-10 items-center justify-center gap-1.5 rounded-lg bg-[#111111] px-4 text-[13px] font-semibold text-white transition-colors hover:bg-[#B6FF00] hover:text-[#111111] disabled:opacity-50"
            >
              {mutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <MessageCircle className="h-3.5 w-3.5" />}
              Connect
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="group relative flex h-full flex-col overflow-hidden rounded-[20px] border border-[#E5E7EB] bg-white p-4 shadow-[0_1px_3px_rgba(17,17,17,0.04)] transition-all duration-[220ms] hover:-translate-y-0.5 hover:border-[#B6FF00] hover:shadow-[0_20px_40px_-24px_rgba(17,17,17,0.18)]">
      {partner.isDemo && <DemoBadge />}
      {!isOwnCard && (
        <div onClick={(e) => e.preventDefault()} className="absolute right-4 top-4 z-10">
          <SaveButton type="partner" id={partner._id} className="h-8 w-8 bg-[#F1F3EF] text-[#6B7280] hover:bg-[#E5E7EB]" />
        </div>
      )}

      <div className="flex items-start gap-3 pr-9">
        <Avatar className="h-12 w-12 shrink-0 rounded-xl border border-[#E5E7EB] transition-transform duration-[220ms] group-hover:scale-[1.04]">
          <AvatarImage src={partner.avatar} alt={displayName} />
          <AvatarFallback className="rounded-xl bg-[#F1F3EF] text-sm font-semibold text-[#111111]">{initialsFromName(displayName)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1">
            <p className="truncate text-[15px] font-bold leading-tight text-[#111111]">{displayName}</p>
            {partner.isVerified && <BadgeCheck className="h-4 w-4 shrink-0 text-[#111111]" />}
          </div>
          <p className="truncate text-[12.5px] font-medium text-[#6B7280]">{PARTNER_TYPE_LABELS[partner.partnerType]}</p>
          {partner.location && (
            <p className="mt-0.5 flex items-center gap-1 text-[11.5px] text-[#9CA3AF]">
              <MapPin className="h-3 w-3 shrink-0" /> {partner.location}
            </p>
          )}
        </div>
      </div>

      {partner.bio && <p className="mt-2.5 line-clamp-2 border-l-2 border-[#B6FF00] pl-3 text-[12.5px] italic leading-relaxed text-[#4B5563]">{partner.bio}</p>}

      {visibleServices.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {visibleServices.map((s) => (
            <span key={s} className="rounded-full bg-[#F3F5F1] px-2.5 py-1 text-[11px] font-medium text-[#4B5563]">
              {s}
            </span>
          ))}
          {extraServiceCount > 0 && <span className="rounded-full bg-[#F3F5F1] px-2.5 py-1 text-[11px] font-medium text-[#9CA3AF]">+{extraServiceCount} more</span>}
        </div>
      )}

      <div className="mt-3 grid grid-cols-2 gap-2 rounded-xl border border-[#F1F3EF] p-2.5 text-center">
        <div>
          <p className="truncate text-[12.5px] font-bold text-[#111111]">{PARTNER_TYPE_LABELS[partner.partnerType]}</p>
          <p className="text-[9.5px] text-[#9CA3AF]">Partner Type</p>
        </div>
        <div className="border-l border-[#F1F3EF]">
          <p className="truncate text-[12.5px] font-bold text-[#111111]">{partner.industries?.[0] || partner.location || "—"}</p>
          <p className="text-[9.5px] text-[#9CA3AF]">{partner.industries?.[0] ? "Industry Focus" : "Market"}</p>
        </div>
      </div>

      {(!!partner.clientsServed || !!partner.projectsCompleted) && (
        <p className="mt-2 flex items-center gap-3 text-[11px] text-[#6B7280]">
          {!!partner.clientsServed && (
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" /> {partner.clientsServed} clients
            </span>
          )}
          {!!partner.projectsCompleted && (
            <span className="flex items-center gap-1">
              <Briefcase className="h-3 w-3" /> {partner.projectsCompleted} projects
            </span>
          )}
        </p>
      )}

      <div className="mt-auto pt-3">
        <div className="mb-2 flex items-center justify-between">
          <PartnerSocialLinks partner={partner} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Link
            to={`/partners/${partner._id}`}
            className="flex h-10 items-center justify-center rounded-[12px] border border-[#111111] bg-white text-center text-xs font-semibold text-[#111111] transition-colors hover:bg-[#F7F8F5]"
          >
            View Profile
          </Link>
          <button
            type="button"
            disabled={isOwnCard || mutation.isPending}
            onClick={() => (user ? mutation.mutate() : navigate("/login"))}
            className="flex h-10 items-center justify-center gap-1.5 rounded-[12px] bg-[#111111] text-xs font-semibold text-white transition-colors group-hover:bg-[#B6FF00] group-hover:text-[#111111] disabled:opacity-50"
          >
            {mutation.isPending && <Loader2 className="h-3 w-3 animate-spin" />}
            Connect
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Featured partner — real highest-clients-served result, not a curated fake
// pick
// ============================================================
function FeaturedPartnerCard({ partner }: { partner: PartnerSummary }) {
  const { user, navigate, mutation } = useConnect(partner._id);
  const displayName = partner.organizationName || partner.name;
  const services = partner.services.slice(0, 5);

  return (
    <div className="relative mb-5 flex flex-col gap-5 overflow-hidden rounded-[20px] border border-[#E5E7EB] bg-white p-6 shadow-[0_2px_8px_rgba(17,17,17,0.04)] sm:flex-row sm:items-center">
      {partner.isDemo && <DemoBadge />}
      <div className="flex items-start gap-4 sm:flex-1">
        <Avatar className="h-20 w-20 shrink-0 rounded-2xl border border-[#E5E7EB]">
          <AvatarImage src={partner.avatar} alt={displayName} />
          <AvatarFallback className="rounded-2xl bg-[#F1F3EF] text-xl font-semibold text-[#111111]">{initialsFromName(displayName)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <span className="mb-1.5 inline-flex items-center gap-1 rounded-full bg-[#ECFDF3] px-2.5 py-1 text-[10.5px] font-bold text-[#16A34A]">
            <Sparkles className="h-3 w-3" /> Featured Partner
          </span>
          <div className="flex items-center gap-1.5">
            <p className="text-lg font-bold text-[#111111]">{displayName}</p>
            {partner.isVerified && <BadgeCheck className="h-4 w-4 text-[#16A34A]" />}
          </div>
          <p className="text-sm text-[#6B7280]">{PARTNER_TYPE_LABELS[partner.partnerType]}</p>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#6B7280]">
            {partner.location && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" /> {partner.location}
              </span>
            )}
            {!!partner.clientsServed && (
              <span className="flex items-center gap-1 font-semibold text-[#111111]">
                <Users className="h-3.5 w-3.5" /> {partner.clientsServed} clients served
              </span>
            )}
          </div>
          {services.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {services.map((s) => (
                <span key={s} className="rounded-full bg-[#F1F3EF] px-2.5 py-1 text-[11px] font-medium text-[#4B5563]">
                  {s}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex shrink-0 flex-col items-start gap-3 sm:items-end">
        <div className="text-left sm:text-right">
          <p className="text-lg font-extrabold text-[#111111]">{partner.projectsCompleted ? `${partner.projectsCompleted} Projects` : PARTNER_TYPE_LABELS[partner.partnerType]}</p>
          <p className="text-[11px] text-[#9CA3AF]">{partner.projectsCompleted ? "Completed" : "Partner Type"}</p>
        </div>
        <div className="flex w-full gap-2 sm:w-auto">
          <Link
            to={`/partners/${partner._id}`}
            className="flex-1 rounded-full border border-[#E5E7EB] px-4 py-2 text-center text-xs font-semibold text-[#111111] transition-colors hover:border-[#111111] sm:flex-none"
          >
            View Profile
          </Link>
          <button
            type="button"
            onClick={() => (user ? mutation.mutate() : navigate("/login"))}
            disabled={mutation.isPending}
            className="flex flex-1 items-center justify-center gap-1 rounded-full bg-[#111111] px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#B6FF00] hover:text-[#111111] disabled:opacity-50 sm:flex-none"
          >
            Connect <ArrowRight className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Loading / empty states
// ============================================================
function PartnerSkeletonGrid({ view }: { view: "grid" | "list" }) {
  return (
    <div className={view === "grid" ? "grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3" : "flex flex-col gap-4"}>
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className={cn("w-full rounded-[20px] bg-[#EDEFEA]", view === "grid" ? "h-72" : "h-36")} />
      ))}
    </div>
  );
}

function PartnerEmptyState({ onClear }: { onClear: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-[20px] border border-dashed border-[#E5E7EB] bg-white py-16 text-center">
      <Briefcase className="h-9 w-9 text-[#9CA3AF]" />
      <p className="text-base font-semibold text-[#111111]">No partners found</p>
      <p className="max-w-sm text-sm text-[#9CA3AF]">Try changing your filters or search for another service or industry.</p>
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
