import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Search,
  Plus,
  ArrowUpDown,
  ArrowRight,
  Rocket,
  Lightbulb,
  Handshake,
  ShieldCheck,
  Sprout,
  TrendingUp,
  BarChart3,
  Flame,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pagination } from "@/components/shared/Pagination";
import { StartupCard } from "@/roles/founder/components/StartupCard";
import { startupApi, type StartupFilters } from "@/api/startups";
import { INDUSTRIES, INDUSTRY_SUBCATEGORIES } from "@/lib/mockData";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import type { StartupStage } from "@/types";

// Apple's real pill spec (apple.com/in/mac): fully rounded, 11px/21px
// padding — flat solid fills, no gradients.
const pillSolid = "inline-flex items-center justify-center gap-2 rounded-full bg-primary px-[21px] py-[11px] text-[15px] font-semibold text-primary-foreground transition-colors hover:bg-primary/90";
const pillOutline = "inline-flex items-center justify-center gap-2 rounded-full border border-border px-[21px] py-[11px] text-[15px] font-semibold text-foreground transition-colors hover:bg-muted";

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
const STAGE_JOURNEY = [
  { value: "idea", label: "Idea", desc: "Just the concept", icon: Lightbulb, color: "#D97706", tint: "#FEF3C7" },
  { value: "pre_seed", label: "Pre-Seed", desc: "Building the foundation", icon: Sprout, color: "#10B981", tint: "#ECFDF5" },
  { value: "seed", label: "Seed", desc: "First traction", icon: Rocket, color: "#171717", tint: "#F5F5F5" },
  { value: "series_a", label: "Series A", desc: "Scaling up", icon: TrendingUp, color: "#0284C7", tint: "#E0F2FE" },
  { value: "series_b", label: "Series B", desc: "Expanding fast", icon: BarChart3, color: "#9333EA", tint: "#F3E8FF" },
  { value: "growth", label: "Growth", desc: "Full speed ahead", icon: Flame, color: "#E11D48", tint: "#FFE4E6" },
];

// Real platform capabilities — no fabricated numbers, just what founders,
// investors, and hires actually get here.
const TRUST_POINTS = [
  { icon: ShieldCheck, label: "Verified founders", color: "text-green-500" },
  { icon: Handshake, label: "Direct investor access", color: "text-blue-500" },
  { icon: TrendingUp, label: "Real funding tracking", color: "text-purple-500" },
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

  const subIndustryOptions = industry !== "all" ? INDUSTRY_SUBCATEGORIES[industry] ?? [] : [];
  const total = data?.pagination.total ?? 0;

  return (
    <div>
      {/* ================= Hero — full-width centered, matching Home.tsx ================= */}
      <section className="relative overflow-hidden bg-gradient-to-br from-background to-muted pb-10 pt-16 sm:pb-12 sm:pt-20">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <motion.div
            className="absolute -left-32 top-[-100px] h-[420px] w-[420px] rounded-full bg-ink opacity-20 blur-[100px]"
            animate={{ x: [0, 40, 0], y: [0, 30, 0] }}
            transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute -right-24 top-[80px] h-[360px] w-[360px] rounded-full bg-[#E11D48] opacity-[0.12] blur-[110px]"
            animate={{ x: [0, -30, 0], y: [0, 40, 0] }}
            transition={{ duration: 17, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>

        <motion.div initial="hidden" animate="show" variants={stagger} className="container flex flex-col items-center text-center">

          <motion.h1
            variants={fadeUp}
            className="mt-3 max-w-xl font-display text-4xl font-black-thin leading-[1] tracking-[-0.03em] text-foreground sm:text-5xl"
          >
            Discover. Build. Fund.
          </motion.h1>

          <motion.p variants={fadeUp} className="mt-4 max-w-md text-[20px] leading-relaxed text-muted-foreground">
            Find real startups, connect with founders directly, discover investors, and hire people who are already building.
          </motion.p>

          <motion.div variants={fadeUp} className="mt-6  flex flex-wrap items-center justify-center gap-20">
            <a href="#listings" className={cn(pillSolid, "h-14 !py-0 font-semibold !bg-primary hover:!bg-primary/90")}>
              Explore Startups
            </a>
            <Link to={user?.role === "founder" ? "/dashboard/founder/startup" : "/register"} className={pillOutline}>
              Post Startup
            </Link>
          </motion.div>

          {/* Real platform capabilities — no fabricated numbers */}
          <motion.div variants={fadeUp} className="mt-6 flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
            {TRUST_POINTS.map((t) => (
              <span key={t.label} className="flex items-center gap-1.5 text-[16px] font-medium text-muted-foreground">
                <t.icon className={`h-4 w-4 ${t.color}`} /> {t.label}
              </span>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* ================= Search / filters ================= */}
      <div className="container mt-8 relative z-10">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            resetPage();
          }}
          className="rounded-2xl border border-border bg-card p-3"
        >
          <div className="grid gap-3 lg:grid-cols-[2fr,1fr,1fr,auto]">
            <div className="relative">
              <Search className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground/70" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search startups, founders..."
                className="h-14 rounded-2xl border-0 bg-muted pl-14 text-[15px] shadow-none focus-visible:ring-2 focus-visible:ring-primary/30"
              />
            </div>

            <Select value={industry} onValueChange={(v) => { setIndustry(v); setSubIndustry("all"); resetPage(); }}>
              <SelectTrigger className="h-14 rounded-2xl border-0 bg-muted px-5">
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
              <SelectTrigger className="h-14 rounded-2xl border-0 bg-muted px-5">
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

            <Link to={user?.role === "founder" ? "/dashboard/founder/startup" : "/register"} className={cn(pillOutline, "h-14 !py-0 text-15px bg-primary text-primary-foreground hover:!bg-primary/90")}>
              <Plus className="h-4 w-4" /> Post Startup
            </Link>
          </div>
        </form>
      </div>

      {/* ================= Stage journey — real filter across the six real stages ================= */}
      <section className="border-t border-border bg-card py-16 sm:py-20">
        <div className="container">

          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-4px" }}
            variants={stagger}
            className="relative"
          >
            <div className="absolute left-0 right-0 top-8 hidden h-[2px] rounded-full bg-border sm:block" />

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
                      style={{
                        backgroundColor: isActive ? s.color : s.tint,
                        color: isActive ? "#fff" : s.color,
                      }}
                      className={cn(
                        "relative z-10 flex h-16 w-16 items-center justify-center rounded-full transition-all duration-300",
                        isActive && "shadow-[0_16px_36px_-14px_rgba(15,23,42,0.45)]"
                      )}
                    >
                      <s.icon className="h-6 w-6" />
                      {isActive && <span style={{ borderColor: s.color }} className="absolute -inset-2 animate-ping rounded-full border" />}
                    </div>
                    <h3 className={cn("mt-4 text-base font-bold", isActive ? "text-foreground" : "text-foreground")}>{s.label}</h3>
                    <p className="mt-1 max-w-[120px] text-center text-sm text-muted-foreground">{s.desc}</p>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Sticky filter toolbar */}
      <div id="listings" className="sticky top-16 z-20 scroll-mt-16 border-b border-border bg-card">
        <div className="container flex items-center gap-2 overflow-x-auto py-2.5 scrollbar-hide">
          <span className="mr-1 shrink-0 text-[15px] font-medium text-muted-foreground">
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
            <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground/70" />
            <ToolbarSelect value={sort} onChange={(v) => setSort(v as NonNullable<StartupFilters["sort"]>)} placeholder="Sort">
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="funding">Most Funded</SelectItem>
              <SelectItem value="rating">Top Rated</SelectItem>
            </ToolbarSelect>
          </div>
        </div>
      </div>

      <div className="bg-muted/50 py-10">
      <div className="container">
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
          <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-card py-16 text-center">
            <Rocket className="h-9 w-9 text-muted-foreground/50" />
            <p className="font-medium text-foreground">No startups found</p>
            <p className="max-w-sm text-sm text-muted-foreground">Try a different search term or adjust your filters.</p>
          </div>
        )}

        {!isLoading && !isError && (data?.data.length ?? 0) > 0 && (
          <>
            <motion.div initial="hidden" animate="show" variants={stagger} className="grid grid-cols-1 items-stretch gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {data!.data.map((startup) => (
                <motion.div key={startup._id} variants={fadeUp}>
                  <StartupCard startup={startup} />
                </motion.div>
              ))}
            </motion.div>
            <Pagination page={page} pages={data!.pagination.pages} onChange={setPage} />
          </>
        )}
      </div>
      </div>

      {/* ================= Final CTA — flat dark panel with an animated glow blob ================= */}
      <section className="relative overflow-hidden bg-ink py-20 text-center sm:py-28">
        <motion.div
          className="pointer-events-none absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand/20 blur-[120px]"
          animate={{ opacity: [0.4, 0.9, 0.4], scale: [0.9, 1.1, 0.9] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <div className="container">
          <h2 className="mx-auto max-w-lg font-display text-[30px] font-black leading-tight tracking-tight text-white sm:text-[38px]">
            Do you have an idea? Share it with the world.
          </h2>
          <Link
            to={user?.role === "founder" ? "/dashboard/founder/startup" : "/register"}
            className="mt-7 inline-flex items-center gap-2 rounded-full bg-card px-7 py-3.5 text-[15px] font-semibold text-foreground transition-transform hover:-translate-y-0.5"
          >
            Post Your Startup <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
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
      <SelectTrigger className="h-9 w-auto shrink-0 gap-1.5 rounded-full border-border px-3.5 text-[15px] text-muted-foreground">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>{children}</SelectContent>
    </Select>
  );
}

