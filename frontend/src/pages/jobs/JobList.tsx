import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Search, Plus, Briefcase, X, ArrowRight, ShieldCheck, Send, Building2, FolderKanban, CalendarCheck, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { JobCard } from "@/pages/jobs/JobCard";
import { JobFilterSidebar, DEFAULT_JOB_FILTERS, type JobFilterState } from "@/pages/jobs/JobFilterSidebar";
import { JobSalaryRangeCards } from "@/pages/jobs/JobSalaryRangeCards";
import { Pagination } from "@/components/shared/Pagination";
import { jobApi } from "@/api/jobs";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import type { JobType } from "@/types";

// Real platform capabilities — no fabricated numbers.
const TRUST_POINTS = [
  { icon: ShieldCheck, label: "Verified companies", color: "text-green-500" },
  { icon: Send, label: "Apply directly", color: "text-blue-500" },
  { icon: Building2, label: "Real openings", color: "text-purple-500" },
];

// Freelance/contract-type postings are "Projects" — browsed separately on the
// Freelancers hub page — so this board only covers traditional employment.
const TYPES: { value: JobType; label: string }[] = [
  { value: "full_time", label: "Full Time" },
  { value: "part_time", label: "Part Time" },
  { value: "internship", label: "Internship" },
];
const JOB_BOARD_TYPES = TYPES.map((t) => t.value).join(",");

// Same flat palette + real lifecycle pattern as PremiumHero's process strip
// (freelancer/services/projects/contests hub) — matches Application.status
// (applied/shortlisted/interview/hired), not a made-up flow.
const STEP_COLORS = [
  { color: "#D97706", tint: "#FEF3C7" },
  { color: "#10B981", tint: "#ECFDF5" },
  { color: "#0284C7", tint: "#E0F2FE" },
  { color: "#9333EA", tint: "#F3E8FF" },
];

const APPLY_PROCESS = [
  { icon: FolderKanban, title: "Browse the listing", desc: "Real roles posted by real companies" },
  { icon: Send, title: "Apply directly", desc: "Submit your resume and cover letter" },
  { icon: CalendarCheck, title: "Get shortlisted", desc: "The employer reviews and reaches out" },
  { icon: CheckCircle2, title: "Get hired", desc: "Move from applicant to hired" },
];

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" as const } },
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};

export default function JobList() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const category = searchParams.get("category");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<JobFilterState>(DEFAULT_JOB_FILTERS);

  const type = filters.types.length > 0 ? filters.types.join(",") : JOB_BOARD_TYPES;
  const isDefaultSalary = filters.minSalary === DEFAULT_JOB_FILTERS.minSalary && filters.maxSalary === DEFAULT_JOB_FILTERS.maxSalary;

  const { data, isLoading, isError } = useQuery({
    queryKey: [
      "jobs",
      {
        search,
        type,
        category,
        page,
        minSalary: filters.minSalary,
        maxSalary: filters.maxSalary,
        industryType: filters.industryType,
        subIndustry: filters.subIndustry,
        qualification: filters.qualification,
        companyTypes: filters.companyTypes,
      },
    ],
    queryFn: () =>
      jobApi.list({
        search: search || undefined,
        type,
        category: category || undefined,
        page,
        limit: 12,
        isRemote: filters.isRemote || undefined,
        // Only sent once the range has actually been narrowed — at the
        // untouched default (full ₹0–15L span) there's nothing to filter by.
        salaryMin: isDefaultSalary ? undefined : filters.minSalary,
        salaryMax: isDefaultSalary ? undefined : filters.maxSalary,
        industryType: filters.industryType || undefined,
        subIndustry: filters.subIndustry || undefined,
        qualification: filters.qualification || undefined,
        companyType: filters.companyTypes.length > 0 ? filters.companyTypes.join(",") : undefined,
      }),
  });

  const jobs = (data?.data ?? []).filter((job) => filters.categories.length === 0 || filters.categories.includes(job.category));

  const total = data?.pagination.total ?? 0;
  const postJobTo = user?.role === "employer" ? "/dashboard/employer/post-job" : "/register";

  return (
    <div>
      {/* ================= Hero — full-width centered, matching Home.tsx / StartupList.tsx ================= */}
      <section className="relative overflow-hidden bg-card pb-10 pt-16 sm:pb-12 sm:pt-20">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <motion.div
            className="absolute -left-32 top-[-100px] h-[420px] w-[420px] rounded-full bg-primary opacity-20 blur-[100px]"
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
          <motion.span
            variants={fadeUp}
            className="inline-flex items-center gap-1.5 rounded-full bg-muted px-4 py-1.5 text-[14px] font-semibold text-foreground/80 ring-1 ring-border"
          >
            <Briefcase className="h-3.5 w-3.5" />
            {total > 0 ? `${total.toLocaleString()} job${total === 1 ? "" : "s"} open now` : "Browse open roles"}
          </motion.span>

          <motion.h1
            variants={fadeUp}
            className="mt-4 max-w-xl font-display text-4xl font-black-thin leading-[1] tracking-[-0.03em] text-foreground sm:text-5xl"
          >
            Find your next <span className="text-foreground">opportunity</span>
          </motion.h1>

          <motion.p variants={fadeUp} className="mt-4 max-w-md text-[18px] leading-relaxed text-muted-foreground">
            Browse full-time, part-time, and internship roles posted by startups and companies on GrowHive.
          </motion.p>

          <motion.div variants={fadeUp} className="mt-6 flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
            {TRUST_POINTS.map((t) => (
              <span key={t.label} className="flex items-center gap-1.5 text-[15px] font-medium text-muted-foreground">
                <t.icon className={`h-4 w-4 ${t.color}`} />
                {t.label}
              </span>
            ))}
          </motion.div>

          <motion.form
            variants={fadeUp}
            onSubmit={(e) => {
              e.preventDefault();
              setPage(1);
            }}
            className="relative z-10 mt-8 w-full max-w-2xl rounded-2xl border border-border bg-card p-1.5"
          >
            <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/70" />
                <Input
                  value={search}
                  onChange={(e) => {
                    setPage(1);
                    setSearch(e.target.value);
                  }}
                  placeholder="Search jobs, companies, skills..."
                  className="h-10 border-0 pl-9 text-[17px] shadow-none focus-visible:ring-0"
                />
              </div>
              {user?.role === "employer" && (
                <Link to="/dashboard/employer/post-job" className="flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-full bg-primary px-5 text-[15px] font-semibold text-primary-foreground transition-colors hover:bg-primary/90">
                  <Plus className="h-3.5 w-3.5" /> Post a Job
                </Link>
              )}
            </div>
          </motion.form>

          {category && (
            <motion.div variants={fadeUp} className="mt-4">
              <Badge variant="solid" className="flex w-fit items-center gap-1.5">
                Category: {category}
                <button type="button" onClick={() => setSearchParams({})} aria-label="Clear category filter">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            </motion.div>
          )}
        </motion.div>
      </section>

      {/* ================= How applying works ================= */}
      <section className="border-t border-border bg-card pb-12 pt-4 sm:pb-14 sm:pt-6">
        <div className="container">
          <h2 className="mb-8 text-center font-display text-[24px] font-black tracking-tight text-foreground sm:text-[27px]">
            How applying works
          </h2>

          <div className="relative">
            <div className="absolute left-0 right-0 top-7 hidden h-[2px] rounded-full bg-border sm:block" />
            <div className="relative grid grid-cols-2 gap-y-8 sm:grid-cols-4">
              {APPLY_PROCESS.map((step, i) => {
                const c = STEP_COLORS[i % STEP_COLORS.length];
                return (
                  <div key={step.title} className="flex flex-col items-center text-center">
                    <span
                      style={{ backgroundColor: c.tint, color: c.color }}
                      className="relative z-10 flex h-14 w-14 items-center justify-center rounded-full"
                    >
                      <step.icon className="h-5 w-5" />
                    </span>
                    <h3 className="mt-3 text-[18px] font-bold text-foreground">{step.title}</h3>
                    <p className="mt-1 max-w-[150px] text-[15.5px] leading-snug text-muted-foreground">{step.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ================= Browse by salary ================= */}
      <section className="border-t border-border bg-card py-8">
        <div className="container">
          <h2 className="mb-4 text-[20px] font-bold text-foreground">Browse by Salary</h2>
          <JobSalaryRangeCards
            selected={isDefaultSalary ? null : { min: filters.minSalary, max: filters.maxSalary }}
            onSelect={(range) => {
              setFilters({ ...filters, minSalary: range?.min ?? DEFAULT_JOB_FILTERS.minSalary, maxSalary: range?.max ?? DEFAULT_JOB_FILTERS.maxSalary });
              setPage(1);
            }}
          />
        </div>
      </section>

      {/* ================= Filters + results ================= */}
      <div className="border-t border-border bg-muted py-10">
        <div className="container">
          <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
            <JobFilterSidebar value={filters} onChange={setFilters} />

            <div>
              {isLoading && (
                <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-52 w-full rounded-xl" />
                  ))}
                </div>
              )}

              {isError && (
                <div className="rounded-lg border border-danger/30 bg-danger/10 px-5 py-8 text-center text-sm text-danger">
                  Couldn&apos;t load jobs right now. Make sure the API server is running.
                </div>
              )}

              {!isLoading && !isError && jobs.length === 0 && (
                <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-card py-16 text-center">
                  <Briefcase className="h-9 w-9 text-muted-foreground/50" />
                  <p className="font-medium text-foreground">No jobs found</p>
                  <p className="max-w-sm text-sm text-muted-foreground">Try a different search term or filter.</p>
                </div>
              )}

              {!isLoading && !isError && jobs.length > 0 && (
                <>
                  <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                    {jobs.map((job) => (
                      <JobCard key={job._id} job={job} />
                    ))}
                  </div>

                  <Pagination page={page} pages={data!.pagination.pages} onChange={setPage} />
                </>
              )}
            </div>
          </div>
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
          <h2 className="mx-auto max-w-lg font-display text-[30px] font-black leading-tight tracking-tight text-ink-foreground sm:text-[38px]">
            Hiring? Get your role in front of the right people.
          </h2>
          <Link to={postJobTo} className={cn("mt-7 inline-flex items-center gap-2 rounded-full bg-card px-7 py-3.5 text-[15px] font-semibold text-foreground transition-transform hover:-translate-y-0.5")}>
            Post a Job <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
