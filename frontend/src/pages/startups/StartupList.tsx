import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Search,
  Plus,
  SlidersHorizontal,
  Trash2,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  List,
  Heart,
  Users2,
  Clock,
  Lightbulb,
  Rocket,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { startupApi, type StartupFilters } from "@/api/startups";
import { INDUSTRIES, INDUSTRY_SUBCATEGORIES } from "@/lib/mockData";
import { useAuth } from "@/context/AuthContext";
import { cn, formatFundingCompact, initialsFromName } from "@/lib/utils";
import type { Startup, StartupStage } from "@/types";

const STAGES: { value: StartupStage; label: string }[] = [
  { value: "idea", label: "Idea Stage" },
  { value: "pre_seed", label: "Pre-Seed" },
  { value: "seed", label: "Seed Stage" },
  { value: "series_a", label: "Series A" },
  { value: "series_b", label: "Series B" },
  { value: "growth", label: "Growth" },
];

const STAGE_COLORS: Record<StartupStage, { bg: string; fg: string }> = {
  idea: { bg: "#e8effe", fg: "#2563eb" },
  pre_seed: { bg: "#f1f5f9", fg: "#475569" },
  seed: { bg: "#f1ebfc", fg: "#7c3aed" },
  series_a: { bg: "#fdece1", fg: "#ea580c" },
  series_b: { bg: "#fce8f3", fg: "#db2777" },
  growth: { bg: "#e7f7ec", fg: "#16a34a" },
};

const TOP_TABS = [
  { value: "all", label: "All Startups" },
  { value: "team", label: "Looking for Team" },
  { value: "investment", label: "Seeking Investment" },
  { value: "popular", label: "Popular" },
  { value: "new", label: "New Launches" },
] as const;

export default function StartupList() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const [tab, setTab] = useState<(typeof TOP_TABS)[number]["value"]>("all");
  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const [industry, setIndustry] = useState<string | undefined>(undefined);
  const [subIndustry, setSubIndustry] = useState<string | undefined>(undefined);
  const [stage, setStage] = useState<StartupStage | undefined>(undefined);
  const [sort, setSort] = useState<NonNullable<StartupFilters["sort"]>>("newest");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [page, setPage] = useState(1);

  const resetFilters = () => {
    setSearch("");
    setIndustry(undefined);
    setSubIndustry(undefined);
    setStage(undefined);
    setSort("newest");
    setTab("all");
    setPage(1);
  };

  const effectiveSort = tab === "popular" ? "rating" : tab === "new" ? "newest" : sort;

  const { data, isLoading, isError } = useQuery({
    queryKey: ["startups", { search, industry, subIndustry, stage, effectiveSort, page }],
    queryFn: () =>
      startupApi.list({
        search: search || undefined,
        industry,
        subIndustry,
        stage,
        sort: effectiveSort,
        page,
        limit: 12,
      }),
  });

  const followMutation = useMutation({
    mutationFn: (id: string) => startupApi.toggleFollow(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["startups"] }),
  });

  const pageNumbers = useMemo(() => (data ? buildPageList(data.pagination.page, data.pagination.pages) : []), [data]);

  const total = data?.pagination.total ?? 0;
  const rangeStart = total === 0 ? 0 : (page - 1) * 12 + 1;
  const rangeEnd = Math.min(page * 12, total);

  return (
    <div className="bg-[#f8fafc]">
      <div className="container py-8">
        {/* Header */}
        <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-[28px] font-extrabold tracking-tight text-[#0f172a]">Startups</h1>
            <p className="mt-1 text-[13.5px] text-[#64748b]">Discover innovative ideas and connect with founders building the future.</p>
          </div>
          <div className="flex items-center gap-2.5">
            {user?.role === "founder" ? (
              <Link
                to="/dashboard/founder/startup"
                className="flex items-center gap-1.5 rounded-lg border border-[#e2e8f0] bg-white px-4 py-2 text-[13px] font-bold text-[#0f172a] hover:bg-[#f8fafc]"
              >
                <Plus className="h-4 w-4" /> Post Your Startup
              </Link>
            ) : (
              <Link
                to="/register"
                className="flex items-center gap-1.5 rounded-lg border border-[#e2e8f0] bg-white px-4 py-2 text-[13px] font-bold text-[#0f172a] hover:bg-[#f8fafc]"
              >
                <Plus className="h-4 w-4" /> Post Your Startup
              </Link>
            )}
            <button className="flex items-center gap-1.5 rounded-lg bg-[#2563eb] px-4 py-2 text-[13px] font-bold text-white hover:opacity-90">
              <SlidersHorizontal className="h-4 w-4" /> Advanced Search
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex flex-wrap gap-6 border-b border-[#e2e8f0]">
          {TOP_TABS.map((t) => (
            <button
              key={t.value}
              onClick={() => {
                setTab(t.value);
                setPage(1);
              }}
              className={cn(
                "border-b-2 pb-2.5 text-[13.5px] font-semibold",
                tab === t.value ? "border-[#2563eb] text-[#2563eb]" : "border-transparent text-[#64748b] hover:text-[#0f172a]"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-[210px_1fr]">
          {/* Filters sidebar */}
          <aside className="space-y-4">
            <div className="rounded-xl border border-[#e2e8f0] bg-white p-4">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-[13.5px] font-bold text-[#0f172a]">Filters</h3>
                <button onClick={resetFilters} className="text-[12px] font-semibold text-[#2563eb] hover:underline">
                  Reset
                </button>
              </div>

              <FilterField label="Search">
                <div className="relative">
                  <Input
                    value={search}
                    onChange={(e) => {
                      setPage(1);
                      setSearch(e.target.value);
                    }}
                    placeholder="Search startups..."
                    className="h-9 pr-8 text-[12.5px]"
                  />
                  <Search className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#94a3b8]" />
                </div>
              </FilterField>

              <FilterField label="Industry">
                <Select
                  value={industry ?? "all"}
                  onValueChange={(v) => {
                    setPage(1);
                    setIndustry(v === "all" ? undefined : v);
                    setSubIndustry(undefined);
                  }}
                >
                  <SelectTrigger className="h-9 text-[12.5px]">
                    <SelectValue placeholder="All Industries" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Industries</SelectItem>
                    {INDUSTRIES.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FilterField>

              {industry && (INDUSTRY_SUBCATEGORIES[industry]?.length ?? 0) > 0 && (
                <FilterField label="Sub-Category">
                  <Select
                    value={subIndustry ?? "all"}
                    onValueChange={(v) => {
                      setPage(1);
                      setSubIndustry(v === "all" ? undefined : v);
                    }}
                  >
                    <SelectTrigger className="h-9 text-[12.5px]">
                      <SelectValue placeholder="All Sub-Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Sub-Categories</SelectItem>
                      {INDUSTRY_SUBCATEGORIES[industry].map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FilterField>
              )}

              <FilterField label="Stage">
                <Select
                  value={stage ?? "all"}
                  onValueChange={(v) => {
                    setPage(1);
                    setStage(v === "all" ? undefined : (v as StartupStage));
                  }}
                >
                  <SelectTrigger className="h-9 text-[12.5px]">
                    <SelectValue placeholder="All Stages" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Stages</SelectItem>
                    {STAGES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FilterField>

              <FilterField label="Funding Status">
                <Select defaultValue="all">
                  <SelectTrigger className="h-9 text-[12.5px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="open">Actively Raising</SelectItem>
                    <SelectItem value="funded">Fully Funded</SelectItem>
                  </SelectContent>
                </Select>
              </FilterField>

              <FilterField label="Looking For">
                <div className="space-y-2">
                  {["Team Members", "Investors / Partners", "Mentors / Advisors", "Customers / Users"].map((label) => (
                    <label key={label} className="flex items-center gap-2 text-[12.5px] text-[#334155]">
                      <input type="checkbox" className="h-3.5 w-3.5 rounded border-[#cbd5e1] accent-[#2563eb]" />
                      {label}
                    </label>
                  ))}
                </div>
              </FilterField>

              <FilterField label="Location" noBorder>
                <Select defaultValue="all">
                  <SelectTrigger className="h-9 text-[12.5px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Locations</SelectItem>
                    <SelectItem value="maharashtra">Maharashtra</SelectItem>
                    <SelectItem value="karnataka">Karnataka</SelectItem>
                    <SelectItem value="delhi-ncr">Delhi NCR</SelectItem>
                  </SelectContent>
                </Select>
              </FilterField>
            </div>

            <button
              onClick={resetFilters}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-[#e2e8f0] bg-white py-2.5 text-[12.5px] font-bold text-[#0f172a] hover:bg-[#f8fafc]"
            >
              <Trash2 className="h-3.5 w-3.5" /> Clear Filters
            </button>
          </aside>

          {/* Results */}
          <div className="min-w-0">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <p className="text-[12.5px] text-[#64748b]">
                {isLoading ? "Loading..." : `Showing ${rangeStart} – ${rangeEnd} of ${total} startups`}
              </p>
              <div className="flex items-center gap-2">
                <span className="text-[12px] font-semibold text-[#64748b]">Sort by:</span>
                <Select value={sort} onValueChange={(v) => setSort(v as NonNullable<StartupFilters["sort"]>)}>
                  <SelectTrigger className="h-9 w-36 text-[12.5px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest First</SelectItem>
                    <SelectItem value="funding">Most Funded</SelectItem>
                    <SelectItem value="rating">Top Rated</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex overflow-hidden rounded-lg border border-[#e2e8f0]">
                  <button
                    onClick={() => setView("grid")}
                    className={cn("flex h-9 w-9 items-center justify-center", view === "grid" ? "bg-[#2563eb] text-white" : "bg-white text-[#64748b]")}
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setView("list")}
                    className={cn("flex h-9 w-9 items-center justify-center border-l border-[#e2e8f0]", view === "list" ? "bg-[#2563eb] text-white" : "bg-white text-[#64748b]")}
                  >
                    <List className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {isLoading && (
              <div className={cn("grid gap-4", view === "grid" ? "sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4" : "grid-cols-1")}>
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-72 w-full rounded-xl" />
                ))}
              </div>
            )}

            {isError && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-5 py-8 text-center text-sm text-red-600">
                Couldn&apos;t load startups right now. Make sure the API server is running.
              </div>
            )}

            {!isLoading && !isError && (data?.data.length ?? 0) === 0 && (
              <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-[#e2e8f0] bg-white py-16 text-center">
                <Rocket className="h-9 w-9 text-[#94a3b8]" />
                <p className="font-medium text-[#0f172a]">No startups found</p>
                <p className="max-w-sm text-sm text-[#64748b]">Try a different search term or adjust your filters.</p>
              </div>
            )}

            {!isLoading && !isError && (data?.data.length ?? 0) > 0 && (
              <>
                <div className={cn("grid gap-4", view === "grid" ? "sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4" : "grid-cols-1")}>
                  {data!.data.map((startup) => (
                    <StartupListCard
                      key={startup._id}
                      startup={startup}
                      view={view}
                      isFollowing={user ? startup.followers.includes(user.id) : false}
                      onToggleFollow={() => (user ? followMutation.mutate(startup._id) : navigate("/login"))}
                    />
                  ))}
                </div>

                {data!.pagination.pages > 1 && (
                  <div className="mt-8 flex items-center justify-center gap-1.5">
                    <button
                      disabled={page <= 1}
                      onClick={() => setPage((p) => p - 1)}
                      className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#e2e8f0] bg-white text-[#64748b] disabled:opacity-40"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    {pageNumbers.map((p, i) =>
                      p === "..." ? (
                        <span key={`ellipsis-${i}`} className="px-1 text-sm text-[#94a3b8]">
                          …
                        </span>
                      ) : (
                        <button
                          key={p}
                          onClick={() => setPage(p)}
                          className={cn(
                            "flex h-9 w-9 items-center justify-center rounded-lg text-[12.5px] font-bold",
                            p === page ? "bg-[#2563eb] text-white" : "border border-[#e2e8f0] bg-white text-[#0f172a] hover:bg-[#f8fafc]"
                          )}
                        >
                          {p}
                        </button>
                      )
                    )}
                    <button
                      disabled={page >= data!.pagination.pages}
                      onClick={() => setPage((p) => p + 1)}
                      className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#e2e8f0] bg-white text-[#64748b] disabled:opacity-40"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </>
            )}

            {/* Bottom CTA banner */}
            <div className="mt-8 flex flex-col items-center justify-between gap-4 rounded-xl border border-[#e2e8f0] bg-white p-5 sm:flex-row">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#e8effe] text-[#2563eb]">
                  <Lightbulb className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-[14px] font-bold text-[#0f172a]">Do you have an idea?</p>
                  <p className="text-[12.5px] text-[#64748b]">Share your startup idea and get the right support from our community.</p>
                </div>
              </div>
              <Link
                to={user?.role === "founder" ? "/dashboard/founder/startup" : "/register"}
                className="flex shrink-0 items-center gap-1.5 rounded-lg bg-[#2563eb] px-4 py-2.5 text-[13px] font-bold text-white hover:opacity-90"
              >
                <Plus className="h-4 w-4" /> Post Your Startup
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FilterField({ label, children, noBorder }: { label: string; children: React.ReactNode; noBorder?: boolean }) {
  return (
    <div className={cn("space-y-1.5 pb-4", !noBorder && "mb-4 border-b border-[#f1f5f9]")}>
      <p className="text-[12px] font-semibold text-[#334155]">{label}</p>
      {children}
    </div>
  );
}

function StartupListCard({
  startup,
  view,
  isFollowing,
  onToggleFollow,
}: {
  startup: Startup;
  view: "grid" | "list";
  isFollowing: boolean;
  onToggleFollow: () => void;
}) {
  const founder = typeof startup.founder === "object" ? startup.founder : null;
  const pct = Math.min(100, Math.round((startup.fundingRaised / (startup.fundingNeeded || 1)) * 100));
  const seekingTeam = (startup.openRoles?.length ?? 0) > 0;
  const seekingInvestment = startup.fundingRaised < startup.fundingNeeded;
  const stageColor = STAGE_COLORS[startup.stage];

  return (
    <div className={cn("overflow-hidden rounded-xl border border-[#e2e8f0] bg-white", view === "list" && "flex")}>
      <div className={cn("relative bg-gradient-to-br from-[#16324a] via-[#2a6b56] to-[#7fae7a]", view === "grid" ? "h-32 w-full" : "h-auto w-52 shrink-0")}>
        {startup.coverImage && <img src={startup.coverImage} alt="" className="absolute inset-0 h-full w-full object-cover" />}
        {startup.isFeatured && (
          <span className="absolute left-2.5 top-2.5 rounded bg-[#16a34a] px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-wide text-white">
            Featured
          </span>
        )}
        <button
          onClick={(e) => {
            e.preventDefault();
            onToggleFollow();
          }}
          className="absolute right-2.5 top-2.5 flex h-7 w-7 items-center justify-center rounded-full bg-white/95 text-[#64748b] hover:text-red-500"
        >
          <Heart className={cn("h-3.5 w-3.5", isFollowing && "fill-red-500 text-red-500")} />
        </button>
      </div>

      <Link to={`/startups/${startup._id}`} className="flex flex-1 flex-col p-4">
        <div className="mb-1.5 flex items-center gap-2">
          <p className="truncate text-[13.5px] font-bold text-[#0f172a]">{startup.name}</p>
          <span className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ background: stageColor.bg, color: stageColor.fg }}>
            {STAGES.find((s) => s.value === startup.stage)?.label}
          </span>
        </div>
        <p className="mb-3 line-clamp-2 min-h-[2.2em] text-[12px] leading-[1.35] text-[#64748b]">{startup.tagline}</p>

        <div className="mb-3 flex items-center gap-2">
          <Avatar className="h-6 w-6">
            <AvatarImage src={founder?.avatar} alt={founder?.name} />
            <AvatarFallback className="bg-gradient-to-br from-[#7c3aed] to-[#4c1d95] text-[9px] font-bold text-white">
              {founder ? initialsFromName(founder.name) : "?"}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-[11.5px] font-semibold text-[#0f172a]">{founder?.name}</p>
            <p className="text-[10.5px] text-[#94a3b8]">{startup.location}</p>
          </div>
        </div>

        <p className="mb-2 text-[11.5px] font-semibold text-[#2563eb]">{startup.industry}</p>

        <div className="mb-2 flex items-center justify-between text-[11.5px]">
          <span className="font-semibold text-[#0f172a]">
            {formatFundingCompact(startup.fundingRaised)} / {formatFundingCompact(startup.fundingNeeded)}
          </span>
          <span className="font-bold text-[#2563eb]">{pct}%</span>
        </div>
        <div className="mb-3 h-1.5 w-full overflow-hidden rounded-full bg-[#e2e8f0]">
          <div className="h-full rounded-full bg-[#2563eb]" style={{ width: `${pct}%` }} />
        </div>

        <div className="mt-auto flex flex-wrap items-center gap-3 border-t border-[#f1f5f9] pt-3 text-[11px] text-[#64748b]">
          <span className="flex items-center gap-1">
            <Users2 className="h-3 w-3" /> {startup.followers.length} Followers
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" /> {startup.interested.length} Interested
          </span>
          <span className="ml-auto flex flex-wrap justify-end gap-1.5">
            {seekingTeam && (
              <span className="rounded-full bg-[#f1ebfc] px-2 py-0.5 text-[10px] font-bold text-[#7c3aed]">Seeking Team</span>
            )}
            {seekingInvestment && (
              <span className="rounded-full bg-[#e8effe] px-2 py-0.5 text-[10px] font-bold text-[#2563eb]">Seeking Investment</span>
            )}
          </span>
        </div>
      </Link>
    </div>
  );
}

function buildPageList(current: number, total: number): (number | "...")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages = new Set<number>([1, 2, total - 1, total, current - 1, current, current + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);

  const result: (number | "...")[] = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - (sorted[i - 1] as number) > 1) result.push("...");
    result.push(p);
  });
  return result;
}
