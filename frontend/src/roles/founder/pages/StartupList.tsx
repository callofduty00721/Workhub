import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Search,
  Plus,
  Bookmark,
  MapPin,
  ArrowUpDown,
  Rocket,
  Lightbulb,
  BadgeCheck,
  ArrowRight,
  Users2,
  UserPlus,
  Handshake,
  ShieldCheck,
  ShieldAlert,
  Sprout,
  TrendingUp,
  BarChart3,
  Flame,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pagination } from "@/components/shared/Pagination";
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

// Same six stages, spoken to as a journey — icon + one-line description for
// the visual stage strip and the hero's mini timeline. This is the real
// progression every startup on the platform moves through, so it doubles
// as a genuine filter, not decoration.
const STAGE_JOURNEY: { value: StartupStage; label: string; desc: string; icon: LucideIcon }[] = [
  { value: "idea", label: "Idea", desc: "Just the concept", icon: Lightbulb },
  { value: "pre_seed", label: "Pre-Seed", desc: "Building the foundation", icon: Sprout },
  { value: "seed", label: "Seed", desc: "First traction", icon: Rocket },
  { value: "series_a", label: "Series A", desc: "Scaling up", icon: TrendingUp },
  { value: "series_b", label: "Series B", desc: "Expanding fast", icon: BarChart3 },
  { value: "growth", label: "Growth", desc: "Full speed ahead", icon: Flame },
];

const STAGE_SUBLABEL: Record<StartupStage, string> = {
  idea: "Early Concept",
  pre_seed: "Building the Foundation",
  seed: "Seed Round",
  series_a: "Scaling Up",
  series_b: "Expanding Fast",
  growth: "Growth Stage",
};

// Real platform capabilities — no fabricated numbers, just what founders,
// investors, and hires actually get here.
const TRUST_POINTS = [
  { icon: ShieldCheck, label: "Verified founders" },
  { icon: Handshake, label: "Direct investor access" },
  { icon: TrendingUp, label: "Real funding tracking" },
];

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" as const } },
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};

export default function StartupList() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const [industry, setIndustry] = useState<string>("all");
  const [subIndustry, setSubIndustry] = useState<string>("all");
  const [stage, setStage] = useState<string>("all");
  const [sort, setSort] = useState<NonNullable<StartupFilters["sort"]>>("newest");
  const [page, setPage] = useState(1);

  const resetPage = () => setPage(1);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["startups", { search, industry, subIndustry, stage, sort, page }],
    queryFn: () =>
      startupApi.list({
        search: search || undefined,
        industry: industry === "all" ? undefined : industry,
        subIndustry: subIndustry === "all" ? undefined : subIndustry,
        stage: stage === "all" ? undefined : (stage as StartupStage),
        sort,
        page,
        limit: 12,
      }),
  });

  const followMutation = useMutation({
    mutationFn: (id: string) => startupApi.toggleFollow(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["startups"] }),
  });

  const subIndustryOptions = industry !== "all" ? INDUSTRY_SUBCATEGORIES[industry] ?? [] : [];
  const total = data?.pagination.total ?? 0;

  return (
    <div>
      {/* ================= Hero ================= */}
      <section className="relative overflow-hidden bg-[#FCFCFD]">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-32 -top-24 h-[520px] w-[520px] rounded-full bg-primary/10 blur-[150px]" />
          <div className="absolute right-0 top-0 h-[450px] w-[450px] rounded-full bg-secondary/10 blur-[160px]" />
        </div>

        <div className="container relative py-16 lg:py-24">
          <div className="mx-auto max-w-7xl">
            <div className="grid items-center gap-16 lg:grid-cols-2">
              {/* Left */}
              <motion.div initial="hidden" animate="show" variants={stagger}>
                <motion.span
                  variants={fadeUp}
                  className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-5 py-2 text-xs font-bold uppercase tracking-[0.25em] text-primary"
                >
                  <Rocket className="h-3.5 w-3.5" /> Startup Ecosystem
                </motion.span>

                <motion.h1
                  variants={fadeUp}
                  className="mt-8 text-5xl font-black leading-[1.05] tracking-tight text-neutral-900 lg:text-6xl"
                >
                  Discover. Build.{" "}
                  <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Fund.</span>
                </motion.h1>

                <motion.p variants={fadeUp} className="mt-6 max-w-xl text-lg leading-8 text-neutral-500">
                  Find real startups, connect with founders directly, discover investors, and hire people who are already building.
                </motion.p>

                <motion.div variants={fadeUp} className="mt-10 flex flex-wrap gap-4">
                  <a
                    href="#listings"
                    className="rounded-2xl bg-primary px-8 py-4 font-semibold text-white shadow-xl shadow-primary/20 transition hover:scale-[1.03]"
                  >
                    Explore Startups
                  </a>
                  <Link
                    to={user?.role === "founder" ? "/dashboard/founder/startup" : "/register"}
                    className="rounded-2xl border border-neutral-300 bg-white px-8 py-4 font-semibold text-neutral-800 transition hover:border-primary hover:text-primary"
                  >
                    Post Startup
                  </Link>
                </motion.div>

                {/* Real platform capabilities — no fabricated numbers */}
                <motion.div variants={fadeUp} className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-3">
                  {TRUST_POINTS.map((t) => (
                    <div key={t.label} className="flex items-center gap-2.5 text-neutral-700">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <t.icon className="h-4 w-4" />
                      </span>
                      <span className="text-[13px] font-semibold">{t.label}</span>
                    </div>
                  ))}
                </motion.div>
              </motion.div>

              {/* Right — a live, honest mini-view of the real stage journey below */}
              <motion.div
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="relative hidden lg:block"
              >
                <div className="relative h-[520px] overflow-hidden rounded-[40px] bg-gradient-to-br from-primary/10 via-white to-secondary/10 shadow-[0_60px_120px_-30px_rgba(0,0,0,0.18)]">
                  <div className="absolute left-10 top-10 h-72 w-72 rounded-full bg-primary/20 blur-[120px]" />
                  <div className="absolute bottom-10 right-10 h-72 w-72 rounded-full bg-secondary/20 blur-[120px]" />

                  <div className="absolute left-8 right-8 top-8 rounded-[28px] bg-white/90 p-7 shadow-2xl backdrop-blur-xl">
                    <p className="text-xl font-bold text-neutral-900">Every startup's journey</p>
                    <p className="mt-1 text-[13px] text-neutral-500">From idea to growth — tracked openly, stage by stage.</p>
                    <div className="mt-6 flex items-center justify-between">
                      {STAGE_JOURNEY.map((s, i) => (
                        <div key={s.value} className="flex flex-col items-center gap-1.5">
                          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                            <s.icon className="h-4 w-4" />
                          </span>
                          {i < STAGE_JOURNEY.length - 1 && <span className="sr-only">→</span>}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="absolute bottom-10 left-8 right-8 rounded-[28px] bg-white p-6 shadow-xl">
                    <p className="font-semibold text-neutral-900">Real founders, real progress</p>
                    <p className="mt-1 text-sm text-neutral-500">Every startup here is verified and actively building — not just an idea on paper.</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= Search / filters ================= */}
      <div className="container -mt-8 relative z-10">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            resetPage();
          }}
          className="rounded-[32px] border border-white/60 bg-white/90 p-3 shadow-[0_35px_80px_-30px_rgba(15,23,42,0.18)] backdrop-blur-2xl"
        >
          <div className="grid gap-3 lg:grid-cols-[2fr,1fr,1fr,auto]">
            <div className="relative">
              <Search className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search startups, founders..."
                className="h-14 rounded-2xl border-0 bg-neutral-50 pl-14 text-[15px] shadow-none focus-visible:ring-2 focus-visible:ring-primary/30"
              />
            </div>

            <Select value={industry} onValueChange={(v) => { setIndustry(v); setSubIndustry("all"); resetPage(); }}>
              <SelectTrigger className="h-14 rounded-2xl border-0 bg-neutral-50 px-5">
                <SelectValue placeholder="Industry" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Industries</SelectItem>
                {INDUSTRIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={stage} onValueChange={(v) => { setStage(v); resetPage(); }}>
              <SelectTrigger className="h-14 rounded-2xl border-0 bg-neutral-50 px-5">
                <SelectValue placeholder="Startup Stage" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stages</SelectItem>
                {STAGES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Link
              to={user?.role === "founder" ? "/dashboard/founder/startup" : "/register"}
              className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-primary to-secondary px-8 font-semibold text-white shadow-lg transition-all duration-300 hover:scale-[1.03] hover:shadow-xl"
            >
              <Plus className="h-4 w-4" /> Post Startup
            </Link>
          </div>
        </form>
      </div>

      {/* ================= Stage journey — real filter across the six real stages ================= */}
      <section className="border-y border-neutral-100 bg-gradient-to-b from-white to-primary/[0.03] py-12">
        <div className="container">
          <div className="mb-10 text-center">
            <span className="rounded-full bg-primary/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.25em] text-primary">
              Startup Journey
            </span>
            <h2 className="mt-5 text-3xl font-black tracking-tight text-neutral-900 sm:text-4xl">Every Startup Begins Somewhere</h2>
            <p className="mt-3 text-neutral-500">Click any stage to filter startups.</p>
          </div>

          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-40px" }}
            variants={stagger}
            className="relative"
          >
            <div className="absolute left-0 right-0 top-8 hidden h-[2px] rounded-full bg-gradient-to-r from-primary/10 via-primary/30 to-secondary/10 sm:block" />

            <div className="relative grid grid-cols-2 gap-y-10 md:grid-cols-3 xl:grid-cols-6">
              {STAGE_JOURNEY.map((s) => {
                const isActive = stage === s.value;
                return (
                  <motion.button
                    key={s.value}
                    type="button"
                    variants={fadeUp}
                    whileHover={{ y: -6 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setStage(isActive ? "all" : s.value);
                      resetPage();
                    }}
                    className="group flex flex-col items-center"
                  >
                    <div
                      className={cn(
                        "relative z-10 flex h-16 w-16 items-center justify-center rounded-full border-2 bg-white transition-all duration-300",
                        isActive
                          ? "border-primary bg-gradient-to-br from-primary to-secondary text-white shadow-[0_16px_36px_-14px_rgba(250,131,46,0.6)]"
                          : "border-neutral-200 text-neutral-400 group-hover:border-primary/40 group-hover:text-primary"
                      )}
                    >
                      <s.icon className="h-6 w-6" />
                      {isActive && <span className="absolute -inset-2 animate-ping rounded-full border border-primary/40" />}
                    </div>
                    <h3 className={cn("mt-4 text-sm font-bold", isActive ? "text-primary" : "text-neutral-800")}>{s.label}</h3>
                    <p className="mt-1 max-w-[120px] text-center text-xs text-neutral-500">{s.desc}</p>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Sticky filter toolbar */}
      <div id="listings" className="sticky top-16 z-20 scroll-mt-16 border-b border-neutral-200 bg-white/90 backdrop-blur-sm">
        <div className="container flex items-center gap-2 overflow-x-auto py-2.5 scrollbar-hide">
          <span className="mr-1 shrink-0 text-[12.5px] font-medium text-neutral-500">
            {total.toLocaleString()} startup{total === 1 ? "" : "s"}
          </span>

          {subIndustryOptions.length > 0 && (
            <ToolbarSelect value={subIndustry} onChange={(v) => { setSubIndustry(v); resetPage(); }} placeholder="Sub-Category">
              <SelectItem value="all">All {industry}</SelectItem>
              {subIndustryOptions.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </ToolbarSelect>
          )}

          <div className="ml-auto flex shrink-0 items-center gap-1.5">
            <ArrowUpDown className="h-3.5 w-3.5 text-neutral-400" />
            <ToolbarSelect value={sort} onChange={(v) => setSort(v as NonNullable<StartupFilters["sort"]>)} placeholder="Sort">
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="funding">Most Funded</SelectItem>
              <SelectItem value="rating">Top Rated</SelectItem>
            </ToolbarSelect>
          </div>
        </div>
      </div>

      <div className="container py-6">
        {isLoading && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-[300px] w-full rounded-[22px]" />
            ))}
          </div>
        )}

        {isError && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-8 text-center text-sm text-red-600">
            Couldn&apos;t load startups right now. Make sure the API server is running.
          </div>
        )}

        {!isLoading && !isError && (data?.data.length ?? 0) === 0 && (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-neutral-200 bg-white py-16 text-center">
            <Rocket className="h-9 w-9 text-neutral-300" />
            <p className="font-medium text-neutral-900">No startups found</p>
            <p className="max-w-sm text-sm text-neutral-500">Try a different search term or adjust your filters.</p>
          </div>
        )}

        {!isLoading && !isError && (data?.data.length ?? 0) > 0 && (
          <>
            <motion.div initial="hidden" animate="show" variants={stagger} className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {data!.data.map((startup) => (
                <StartupListCard
                  key={startup._id}
                  startup={startup}
                  isFollowing={user ? startup.followers.includes(user.id) : false}
                  onToggleFollow={() => (user ? followMutation.mutate(startup._id) : navigate("/login"))}
                />
              ))}
            </motion.div>
            <Pagination page={page} pages={data!.pagination.pages} onChange={setPage} />
          </>
        )}

        {/* Bottom CTA banner */}
        <div className="mt-8 flex flex-col items-center justify-between gap-4 rounded-2xl border border-neutral-200 bg-white p-5 sm:flex-row">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Lightbulb className="h-5 w-5" />
            </span>
            <div>
              <p className="text-[14px] font-bold text-neutral-900">Do you have an idea?</p>
              <p className="text-[12.5px] text-neutral-500">Share your startup idea and get the right support from our community.</p>
            </div>
          </div>
          <Link
            to={user?.role === "founder" ? "/dashboard/founder/startup" : "/register"}
            className="flex shrink-0 items-center gap-1.5 rounded-xl bg-neutral-900 px-4 py-2.5 text-[13px] font-medium text-white transition-colors hover:bg-primary"
          >
            <Plus className="h-4 w-4" /> Post Your Startup
          </Link>
        </div>
      </div>
    </div>
  );
}

function ToolbarSelect({
  value,
  onChange,
  placeholder,
  children,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  children: React.ReactNode;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-8 w-auto shrink-0 gap-1.5 rounded-full border-neutral-200 px-3 text-[12.5px] text-neutral-600">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>{children}</SelectContent>
    </Select>
  );
}

// Big icon + value + label block used across the four-up stat grid on the card.
function StatBlock({ icon: Icon, value, label }: { icon: LucideIcon; value: string; label: string }) {
  return (
    <div className="group/stat rounded-xl bg-neutral-50 p-2.5 transition-colors duration-200 group-hover/stat:bg-primary/5">
      <Icon className="mb-1.5 h-3.5 w-3.5 text-primary transition-transform duration-200 group-hover/stat:scale-110" />
      <p className="truncate text-[13px] font-black text-neutral-900">{value}</p>
      <p className="mt-0.5 truncate text-[9.5px] text-neutral-500">{label}</p>
    </div>
  );
}

function StartupListCard({
  startup,
  isFollowing,
  onToggleFollow,
}: {
  startup: Startup;
  isFollowing: boolean;
  onToggleFollow: () => void;
}) {
  const founder = typeof startup.founder === "object" ? startup.founder : null;
  const pct = Math.min(100, Math.round((startup.fundingRaised / (startup.fundingNeeded || 1)) * 100));
  const openRoleCount = startup.openRoles?.length ?? 0;
  const isHiring = openRoleCount > 0;
  const isSeekingInvestment = startup.fundingRaised < startup.fundingNeeded && startup.fundingNeeded > 0;
  const isVerified = startup.isVerified || startup.founderVerified;
  const teamSize = (startup.team?.length ?? 0) + 1;
  const stageMeta = STAGES.find((s) => s.value === startup.stage);

  const tags = [startup.industry, startup.subIndustry, ...startup.fundingType].filter(Boolean) as string[];

  // Founder + team avatars, capped so the row stays a row. Rendered once,
  // reused wherever the card needs to show "who's behind this."
  const people = [
    ...(founder ? [{ name: founder.name, avatar: founder.avatar }] : []),
    ...(startup.team ?? []).map((m) => ({ name: m.name, avatar: m.avatar })),
  ];
  const visiblePeople = people.slice(0, 3);

  return (
    <motion.div
      variants={fadeUp}
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
      className="group relative overflow-hidden rounded-[22px] border border-neutral-200 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-[box-shadow,border-color] duration-300 hover:border-primary/20 hover:shadow-[0_20px_40px_-24px_rgba(250,131,46,0.3)]"
    >
      {/* Accent bar */}
      <span className="absolute inset-x-0 top-0 h-[3px] scale-x-0 bg-gradient-to-r from-primary to-secondary transition-transform duration-300 group-hover:scale-x-100" />

      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <motion.div
            whileHover={{ rotate: -4, scale: 1.05 }}
            className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl border border-white/60 bg-gradient-to-br from-primary/15 via-white to-secondary/10 shadow-[0_14px_28px_-16px_rgba(250,131,46,0.35)]"
          >
            {startup.logo ? (
              <img
                src={startup.logo}
                alt=""
                className="h-full w-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <span className="text-lg font-black text-primary">{initialsFromName(startup.name)}</span>
              </div>
            )}
          </motion.div>

          <div className="min-w-0">
            <Link to={`/startups/${startup._id}`} className="group/name inline-flex min-w-0 items-center gap-1.5">
              <h2 className="truncate text-[16px] font-black tracking-tight text-neutral-900 group-hover/name:text-primary">
                {startup.name}
              </h2>
              {isVerified && <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-primary" />}
            </Link>
            {startup.tagline && <p className="mt-0.5 line-clamp-1 max-w-md text-[12px] text-neutral-500">{startup.tagline}</p>}

            <div className="mt-1.5 flex flex-wrap gap-1.5">
              <span className="rounded-full border border-primary/20  bg-primary/5 px-2 py-0.5 text-[12px] font-medium text-primary">{stageMeta?.label}</span>
              {startup.industry && <span className="rounded-full border border-primary/20 bg-primary/5 px-2 py-0.5 text-[12px] font-medium text-primary">{startup.industry}</span>}
              {startup.location && (   
                <span className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/5 px-2 py-0.5 text-[12px] font-medium text-primary">
                  <MapPin className="h-2.5 w-2.5" /> {startup.location}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Bookmark + verification, single instance */}
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <motion.button
            type="button"
            whileTap={{ scale: 0.85 }}
            onClick={onToggleFollow}
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-neutral-200 bg-white text-neutral-500 shadow-sm transition-colors duration-200 hover:border-primary hover:text-primary"
          >
            <Bookmark className={cn("h-3.5 w-3.5 transition-colors", isFollowing && "fill-primary text-primary")} />
          </motion.button>
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9.5px] font-bold",
              isVerified ? "bg-success/10 text-success" : "bg-neutral-100 text-neutral-400"
            )}
          >
            {isVerified ? <ShieldCheck className="h-2.5 w-2.5" /> : <ShieldAlert className="h-2.5 w-2.5" />}
            {isVerified ? "Verified" : "Unverified"}
          </span>
        </div>
      </div>

      {/* Funding need */}
      {startup.fundingNeeded > 0 && (
        <div className="mt-3 rounded-xl bg-gradient-to-br from-primary/30 to-secondary/10 px-3 py-2">
          <div className="flex items-center justify-between">
            <p className="text-[9px] font-bold uppercase tracking-wide text-black/70">Funding Need</p>
            <p className="text-[11px] font-bold text-black">{pct}% raised</p>
          </div>
          <p className="text-[16px] font-black tabular-nums text-primary">
            {formatFundingCompact(startup.fundingNeeded)} <span className="text-[11px] font-medium text-primary/60">INR</span>
          </p>
          <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-white">
            <motion.div
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: pct / 100 }}
              viewport={{ once: true }}
              style={{ transformOrigin: "left" }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="h-full rounded-full bg-gradient-to-r from-primary to-secondary"
            />
          </div>
        </div>
      )}

      {/* Stats grid */}
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <StatBlock icon={Users2} value={String(teamSize)} label={teamSize === 1 ? "Person" : "Team"} />
        <StatBlock icon={Rocket} value={stageMeta?.label ?? "—"} label={STAGE_SUBLABEL[startup.stage]} />
        <StatBlock icon={MapPin} value={startup.location || "—"} label="Location" />
        <StatBlock icon={TrendingUp} value={`${pct}%`} label="Funded" />
      </div>

      {startup.description && (
        <p className="mt-3 line-clamp-2 text-[12px] leading-relaxed text-neutral-600">{startup.description}</p>
      )}

      {tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {tags.map((tag, i) => (
            <span key={i} className="rounded-full border border-primary/20 bg-primary/5 px-2 py-0.5 text-[10px] font-semibold text-primary">
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Hiring / investor opportunity cards */}
      {(isHiring || isSeekingInvestment) && (
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {isHiring && (
            <div className="group/panel relative overflow-hidden rounded-2xl border border-primary/15 bg-primary/[0.05] p-3">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-secondary text-white">
                  <UserPlus className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-[12px] font-bold text-neutral-900">Hiring Team</p>
                  <p className="truncate text-[10.5px] text-neutral-500">{openRoleCount} open role{openRoleCount === 1 ? "" : "s"}</p>
                </div>
              </div>
              <Link
                to={`/startups/${startup._id}?tab=team`}
                className="mt-2 inline-flex w-full items-center justify-center rounded-lg bg-primary py-1.5 text-[11px] font-semibold text-white transition hover:opacity-90"
              >
                View Roles
              </Link>
            </div>
          )}

          {isSeekingInvestment && (
            <div className="group/panel relative overflow-hidden rounded-2xl border border-success/15 bg-success/[0.05] p-3">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-success text-white">
                  <Handshake className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-[12px] font-bold text-neutral-900">Raising Investment</p>
                  <p className="truncate text-[10.5px] text-neutral-500">{formatFundingCompact(startup.fundingNeeded - startup.fundingRaised)} still needed</p>
                </div>
              </div>
              <Link
                to={`/startups/${startup._id}?tab=funding`}
                className="mt-2 inline-flex w-full items-center justify-center rounded-lg bg-success py-1.5 text-[11px] font-semibold text-white transition hover:opacity-90"
              >
                Invest Now
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Footer: team + primary CTA, single instance */}
      <div className="mt-3 flex items-center justify-between gap-3 border-t border-neutral-100 pt-3">
        <div className="flex items-center gap-2">
          <div className="flex -space-x-2">
            {visiblePeople.map((p, i) => (
              <Avatar key={i} className="h-7 w-7 border-2 border-white shadow transition-transform duration-200 hover:z-10 hover:scale-110">
                <AvatarImage src={p.avatar} alt={p.name} />
                <AvatarFallback className="bg-primary text-[9px] font-bold text-white">{initialsFromName(p.name)}</AvatarFallback>
              </Avatar>
            ))}
            {people.length > 3 && (
              <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-gradient-to-br from-primary to-secondary text-[9px] font-bold text-white shadow">
                +{people.length - 3}
              </div>
            )}
          </div>
          <p className="text-[11px] font-semibold text-neutral-600">{teamSize} member{teamSize === 1 ? "" : "s"}</p>
        </div>

        <Link
          to={`/startups/${startup._id}`}
          className="group/cta relative flex items-center justify-center gap-1.5 overflow-hidden rounded-xl bg-gradient-to-r from-primary to-secondary px-4 py-2 text-[12px] font-bold text-white shadow-[0_12px_24px_-12px_rgba(250,131,46,0.55)] transition-all duration-300 hover:-translate-y-0.5"
        >
          <span className="pointer-events-none absolute left-[-120%] top-0 h-full w-16 rotate-12 bg-white/30 transition-all duration-700 group-hover/cta:left-[140%]" />
          <span className="relative flex items-center gap-1.5">
            View Startup
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover/cta:translate-x-1" />
          </span>
        </Link>
      </div>
    </motion.div>
  );
}
