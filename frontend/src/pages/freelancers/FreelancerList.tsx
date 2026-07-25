import { useState, lazy, Suspense } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Search, Users, Briefcase, FolderKanban, Trophy, ShieldCheck, Lock, ShieldAlert, Headphones, ChevronRight, LayoutGrid } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FreelancerCard } from "@/components/freelancers/FreelancerCard";
import { ContestCard } from "@/components/contests/ContestCard";
import { freelancerApi } from "@/api/freelancers";
import { contestApi } from "@/api/contests";
import { SERVICE_CATEGORIES, SERVICE_CATEGORY_NAMES } from "@/lib/mockData";

// Code-split — each tab's browsing/filter logic only downloads once someone
// actually opens that tab, instead of bundling it all into this hub page.
const GigList = lazy(() => import("@/pages/gigs/GigList"));
const ProjectList = lazy(() => import("@/pages/projects/ProjectList"));

const POPULAR_SKILLS = ["UI/UX Design", "Web Development", "Content Writing", "Digital Marketing", "Video Editing"];

type SectionTab = "freelancers" | "services" | "projects" | "contests";
const SECTION_TABS: SectionTab[] = ["freelancers", "services", "projects", "contests"];

export default function FreelancerList() {
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get("tab");
  const [tab, setTab] = useState<SectionTab>(
    SECTION_TABS.includes(initialTab as SectionTab) ? (initialTab as SectionTab) : "freelancers"
  );
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [subCategory, setSubCategory] = useState<string>("all");
  const [level, setLevel] = useState<string>("all");
  const [rateMin, setRateMin] = useState("");
  const [rateMax, setRateMax] = useState("");

  const { data: freelancers, isLoading: loadingFreelancers } = useQuery({
    queryKey: ["freelancers", { search, category, subCategory, level, rateMin, rateMax }],
    queryFn: () =>
      freelancerApi.list({
        search: search || undefined,
        category: category === "all" ? undefined : category,
        subCategory: subCategory === "all" ? undefined : subCategory,
        level: level === "all" ? undefined : (level as "new" | "level_1" | "top_rated"),
        rateMin: rateMin ? Number(rateMin) : undefined,
        rateMax: rateMax ? Number(rateMax) : undefined,
        limit: 12,
      }),
    enabled: tab === "freelancers",
  });

  const subCategoryOptions = category !== "all" ? SERVICE_CATEGORIES[category] ?? [] : [];

  const { data: contests, isLoading: loadingContests } = useQuery({
    queryKey: ["contests", { search }],
    queryFn: () => contestApi.list({ search: search || undefined, limit: 12 }),
    enabled: tab === "contests",
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
  };

  return (
    <div>
      {/* Hero */}
      <div className="border-b border-border bg-gradient-to-br from-primary/10 via-secondary/5 to-transparent">
        <div className="container py-14">
          <h1 className="text-4xl font-bold tracking-tight">
            Freelance. <span className="text-primary">Earn.</span> <span className="text-secondary">Grow.</span>
          </h1>
          <p className="mt-3 max-w-md text-sm text-muted-foreground">
            Explore talent, find work, or showcase your skills. Opportunities are everywhere.
          </p>

          <form onSubmit={handleSearch} className="mt-6 flex max-w-2xl flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search freelancers, gigs, skills..."
                className="pl-9"
              />
            </div>
            {tab === "freelancers" && (
              <>
                <Select
                  value={category}
                  onValueChange={(value) => {
                    setCategory(value);
                    setSubCategory("all");
                  }}
                >
                  <SelectTrigger className="sm:w-44">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {SERVICE_CATEGORY_NAMES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {subCategoryOptions.length > 0 && (
                  <Select value={subCategory} onValueChange={setSubCategory}>
                    <SelectTrigger className="sm:w-48">
                      <SelectValue placeholder="All Sub-Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Sub-Categories</SelectItem>
                      {subCategoryOptions.map((sub) => (
                        <SelectItem key={sub} value={sub}>
                          {sub}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </>
            )}
          </form>

          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
            <span className="text-muted-foreground">Popular Skills:</span>
            {POPULAR_SKILLS.map((skill) => (
              <Badge key={skill} variant="outline" className="cursor-pointer" onClick={() => setSearch(skill)}>
                {skill}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      <div className="container py-10">
        {/* Section switcher cards */}
        <div className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SwitchCard icon={Users} title="Freelancers" subtitle="Connect with skilled professionals" active={tab === "freelancers"} onClick={() => setTab("freelancers")} />
          <SwitchCard icon={Briefcase} title="Gigs" subtitle="Find or offer services" active={tab === "services"} onClick={() => setTab("services")} />
          <SwitchCard icon={FolderKanban} title="Projects" subtitle="Hire for larger projects" active={tab === "projects"} onClick={() => setTab("projects")} />
          <SwitchCard icon={Trophy} title="Contests" subtitle="Run contests & get creative ideas" active={tab === "contests"} onClick={() => setTab("contests")} />
        </div>

        {tab === "freelancers" ? (
          <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
            <div className="space-y-6">
              <CategorySidebar
                category={category}
                subCategory={subCategory}
                onSelectCategory={(c) => {
                  setCategory(c);
                  setSubCategory("all");
                }}
                onSelectSubCategory={setSubCategory}
              />
              <FilterPanel title="Filters">
                <FilterField label="Freelancer Level">
                  <Select value={level} onValueChange={setLevel}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Any Level</SelectItem>
                      <SelectItem value="top_rated">Top Rated</SelectItem>
                      <SelectItem value="level_1">Level 1</SelectItem>
                      <SelectItem value="new">New Seller</SelectItem>
                    </SelectContent>
                  </Select>
                </FilterField>
                <FilterField label="Hourly Rate (₹)">
                  <div className="flex items-center gap-2">
                    <Input type="number" min={0} placeholder="Min" value={rateMin} onChange={(e) => setRateMin(e.target.value)} className="h-8 text-xs" />
                    <span className="text-xs text-muted-foreground">–</span>
                    <Input type="number" min={0} placeholder="Max" value={rateMax} onChange={(e) => setRateMax(e.target.value)} className="h-8 text-xs" />
                  </div>
                </FilterField>
              </FilterPanel>
            </div>
            <div className="min-w-0">
              {loadingFreelancers ? (
                <GridSkeleton />
              ) : !freelancers?.data.length ? (
                <EmptyState icon={Users} text="No freelancers found. Try a different search." />
              ) : (
                <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                  {freelancers.data.map((f) => (
                    <FreelancerCard key={f._id} freelancer={f} />
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : tab === "services" ? (
          <Suspense fallback={<GridSkeleton />}>
            <GigList search={search} />
          </Suspense>
        ) : tab === "projects" ? (
          <Suspense fallback={<GridSkeleton />}>
            <ProjectList search={search} />
          </Suspense>
        ) : loadingContests ? (
          <GridSkeleton />
        ) : !contests?.data.length ? (
          <EmptyState icon={Trophy} text="No contests running yet." />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {contests.data.map((contest) => (
              <ContestCard key={contest._id} contest={contest} />
            ))}
          </div>
        )}

        {/* Trust badges */}
        <div className="mt-14 grid gap-4 rounded-xl border border-border bg-card p-6 sm:grid-cols-2 lg:grid-cols-4">
          <TrustBadge icon={ShieldCheck} title="Verified Professionals" subtitle="All freelancers are verified" />
          <TrustBadge icon={Lock} title="Secure Payments" subtitle="100% secure transactions" />
          <TrustBadge icon={ShieldAlert} title="Dispute Protection" subtitle="We've got you covered" />
          <TrustBadge icon={Headphones} title="24/7 Support" subtitle="Always here to help" />
        </div>
      </div>
    </div>
  );
}

function CategorySidebar({
  category,
  subCategory,
  onSelectCategory,
  onSelectSubCategory,
}: {
  category: string;
  subCategory: string;
  onSelectCategory: (category: string) => void;
  onSelectSubCategory: (subCategory: string) => void;
}) {
  return (
    <aside className="h-fit rounded-xl border border-border bg-card lg:sticky lg:top-4">
      <div className="border-b border-border px-4 py-3">
        <h3 className="text-sm font-semibold">Categories</h3>
      </div>
      <nav className="max-h-[70vh] overflow-y-auto py-1.5 scrollbar-thin">
        <button
          type="button"
          onClick={() => onSelectCategory("all")}
          className={`flex w-full items-center gap-2 px-4 py-2 text-left text-sm transition-colors ${
            category === "all" ? "bg-primary/10 font-medium text-primary" : "text-foreground/80 hover:bg-accent"
          }`}
        >
          <LayoutGrid className="h-3.5 w-3.5 shrink-0" /> All Categories
        </button>
        {SERVICE_CATEGORY_NAMES.map((c) => {
          const isActive = category === c;
          const subOptions = SERVICE_CATEGORIES[c] ?? [];
          return (
            <div key={c}>
              <button
                type="button"
                onClick={() => onSelectCategory(isActive ? "all" : c)}
                className={`flex w-full items-center justify-between gap-2 px-4 py-2 text-left text-sm transition-colors ${
                  isActive ? "bg-primary/10 font-medium text-primary" : "text-foreground/80 hover:bg-accent"
                }`}
              >
                <span className="truncate">{c}</span>
                {subOptions.length > 0 && <ChevronRight className={`h-3.5 w-3.5 shrink-0 transition-transform ${isActive ? "rotate-90" : ""}`} />}
              </button>
              {isActive && subOptions.length > 0 && (
                <div className="pb-1">
                  {subOptions.map((sub) => (
                    <button
                      key={sub}
                      type="button"
                      onClick={() => onSelectSubCategory(sub)}
                      className={`flex w-full items-center gap-2 py-1.5 pl-9 pr-4 text-left text-xs transition-colors ${
                        subCategory === sub ? "font-medium text-primary" : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {sub}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}

function FilterPanel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <h3 className="mb-3 text-sm font-semibold">{title}</h3>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function FilterField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      {children}
    </div>
  );
}

function SwitchCard({
  icon: Icon,
  title,
  subtitle,
  onClick,
  active = false,
}: {
  icon: typeof Users;
  title: string;
  subtitle: string;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center justify-between gap-3 rounded-xl border p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-card ${
        active ? "border-primary bg-primary/5" : "border-border bg-card"
      }`}
    >
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${active ? "bg-primary/15 text-primary" : "bg-accent text-foreground/70"}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold">{title}</p>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
    </button>
  );
}

function GridSkeleton() {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <Skeleton key={i} className="h-52 w-full rounded-xl" />
      ))}
    </div>
  );
}

function TrustBadge({ icon: Icon, title, subtitle }: { icon: typeof ShieldCheck; title: string; subtitle: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-success/10 text-success">
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>
    </div>
  );
}

function EmptyState({ icon: Icon, text }: { icon: typeof Users; text: string }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border py-16 text-center">
      <Icon className="h-9 w-9 text-muted-foreground" />
      <p className="max-w-sm text-sm text-muted-foreground">{text}</p>
    </div>
  );
}
