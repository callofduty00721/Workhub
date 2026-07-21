import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Users, Briefcase, FolderKanban, Trophy, ShieldCheck, Lock, ShieldAlert, Headphones, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FreelancerCard } from "@/components/freelancers/FreelancerCard";
import { ServiceCard } from "@/components/freelancers/ServiceCard";
import { JobCard } from "@/components/jobs/JobCard";
import { ContestCard } from "@/components/contests/ContestCard";
import { freelancerApi, serviceApi } from "@/api/freelancers";
import { jobApi } from "@/api/jobs";
import { contestApi } from "@/api/contests";
import { SERVICE_CATEGORIES, SERVICE_CATEGORY_NAMES } from "@/lib/mockData";

const POPULAR_SKILLS = ["UI/UX Design", "Web Development", "Content Writing", "Digital Marketing", "Video Editing"];

// "Projects" is freelance/contract-type work — kept as its own tab, separate
// from the full-time/part-time/internship listings on the main /jobs board.
const PROJECT_TYPES = "freelance,contract";

type SectionTab = "freelancers" | "services" | "projects" | "contests";

export default function FreelancerList() {
  const [tab, setTab] = useState<SectionTab>("freelancers");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [subCategory, setSubCategory] = useState<string>("all");

  const { data: freelancers, isLoading: loadingFreelancers } = useQuery({
    queryKey: ["freelancers", { search, category, subCategory }],
    queryFn: () =>
      freelancerApi.list({
        search: search || undefined,
        category: category === "all" ? undefined : category,
        subCategory: subCategory === "all" ? undefined : subCategory,
        limit: 12,
      }),
    enabled: tab === "freelancers",
  });

  const { data: services, isLoading: loadingServices } = useQuery({
    queryKey: ["services", { search, category, subCategory }],
    queryFn: () =>
      serviceApi.list({
        search: search || undefined,
        category: category === "all" ? undefined : category,
        subCategory: subCategory === "all" ? undefined : subCategory,
        limit: 12,
      }),
    enabled: tab === "services",
  });

  const subCategoryOptions = category !== "all" ? SERVICE_CATEGORIES[category] ?? [] : [];

  const { data: projects, isLoading: loadingProjects } = useQuery({
    queryKey: ["jobs", { search, type: PROJECT_TYPES }],
    queryFn: () => jobApi.list({ search: search || undefined, type: PROJECT_TYPES, limit: 12 }),
    enabled: tab === "projects",
  });

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
            {(tab === "freelancers" || tab === "services") && (
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

        <Tabs value={tab} onValueChange={(v) => setTab(v as SectionTab)}>
          <TabsList>
            <TabsTrigger value="freelancers">
              <Users className="mr-1.5 h-3.5 w-3.5" /> Freelancers
            </TabsTrigger>
            <TabsTrigger value="services">
              <Briefcase className="mr-1.5 h-3.5 w-3.5" /> Gigs
            </TabsTrigger>
            <TabsTrigger value="projects">
              <FolderKanban className="mr-1.5 h-3.5 w-3.5" /> Projects
            </TabsTrigger>
            <TabsTrigger value="contests">
              <Trophy className="mr-1.5 h-3.5 w-3.5" /> Contests
            </TabsTrigger>
          </TabsList>

          <TabsContent value="freelancers">
            {loadingFreelancers ? (
              <GridSkeleton />
            ) : !freelancers?.data.length ? (
              <EmptyState icon={Users} text="No freelancers found. Try a different search." />
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {freelancers.data.map((f) => (
                  <FreelancerCard key={f._id} freelancer={f} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="services">
            {loadingServices ? (
              <GridSkeleton />
            ) : !services?.data.length ? (
              <EmptyState icon={Briefcase} text="No gigs listed yet." />
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {services.data.map((s) => (
                  <ServiceCard key={s._id} service={s} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="projects">
            {loadingProjects ? (
              <GridSkeleton />
            ) : !projects?.data.length ? (
              <EmptyState icon={FolderKanban} text="No projects posted yet." />
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {projects.data.map((job) => (
                  <JobCard key={job._id} job={job} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="contests">
            {loadingContests ? (
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
          </TabsContent>
        </Tabs>

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
