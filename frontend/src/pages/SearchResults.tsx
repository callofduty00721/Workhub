import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Search, Rocket, Users, Briefcase, FolderKanban, Trophy, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FreelancerCard } from "@/components/freelancers/FreelancerCard";
import { ServiceCard } from "@/components/gigs/ServiceCard";
import { JobCard } from "@/components/jobs/JobCard";
import { ContestCard } from "@/components/contests/ContestCard";
import { startupApi } from "@/api/startups";
import { freelancerApi, serviceApi } from "@/api/freelancers";
import { jobApi } from "@/api/jobs";
import { contestApi } from "@/api/contests";

type ResultTab = "startups" | "freelancers" | "services" | "jobs" | "contests";

export default function SearchResults() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("q") ?? "";
  const [draft, setDraft] = useState(query);
  const [tab, setTab] = useState<ResultTab>("startups");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchParams(draft ? { q: draft } : {});
  };

  const { data: startups, isLoading: loadingStartups } = useQuery({
    queryKey: ["search", "startups", query],
    queryFn: () => startupApi.list({ search: query || undefined, limit: 12 }),
    enabled: !!query,
  });

  const { data: freelancers, isLoading: loadingFreelancers } = useQuery({
    queryKey: ["search", "freelancers", query],
    queryFn: () => freelancerApi.list({ search: query || undefined, limit: 12 }),
    enabled: !!query,
  });

  const { data: services, isLoading: loadingServices } = useQuery({
    queryKey: ["search", "services", query],
    queryFn: () => serviceApi.list({ search: query || undefined, limit: 12 }),
    enabled: !!query,
  });

  const { data: jobs, isLoading: loadingJobs } = useQuery({
    queryKey: ["search", "jobs", query],
    queryFn: () => jobApi.list({ search: query || undefined, limit: 12 }),
    enabled: !!query,
  });

  const { data: contests, isLoading: loadingContests } = useQuery({
    queryKey: ["search", "contests", query],
    queryFn: () => contestApi.list({ search: query || undefined, limit: 12 }),
    enabled: !!query,
  });

  const counts: Record<ResultTab, number> = {
    startups: startups?.pagination.total ?? 0,
    freelancers: freelancers?.pagination.total ?? 0,
    services: services?.pagination.total ?? 0,
    jobs: jobs?.pagination.total ?? 0,
    contests: contests?.pagination.total ?? 0,
  };

  return (
    <div className="container py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Search MahaHub</h1>
        <p className="mt-1 text-sm text-muted-foreground">Find startups, freelancers, gigs, jobs, projects, and contests — all in one place.</p>
      </div>

      <form onSubmit={handleSubmit} className="relative mb-8 max-w-xl">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Search everything on MahaHub..."
          className="pl-9"
          autoFocus
        />
      </form>

      {!query ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border py-16 text-center">
          <Search className="h-9 w-9 text-muted-foreground" />
          <p className="max-w-sm text-sm text-muted-foreground">Type something above to search across the whole platform.</p>
        </div>
      ) : (
        <Tabs value={tab} onValueChange={(v) => setTab(v as ResultTab)}>
          <TabsList className="flex-wrap">
            <TabsTrigger value="startups">
              <Rocket className="mr-1.5 h-3.5 w-3.5" /> Startups ({counts.startups})
            </TabsTrigger>
            <TabsTrigger value="freelancers">
              <Users className="mr-1.5 h-3.5 w-3.5" /> Freelancers ({counts.freelancers})
            </TabsTrigger>
            <TabsTrigger value="services">
              <Briefcase className="mr-1.5 h-3.5 w-3.5" /> Gigs ({counts.services})
            </TabsTrigger>
            <TabsTrigger value="jobs">
              <FolderKanban className="mr-1.5 h-3.5 w-3.5" /> Jobs & Projects ({counts.jobs})
            </TabsTrigger>
            <TabsTrigger value="contests">
              <Trophy className="mr-1.5 h-3.5 w-3.5" /> Contests ({counts.contests})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="startups">
            {loadingStartups ? (
              <GridSkeleton />
            ) : !startups?.data.length ? (
              <EmptyState icon={Rocket} text="No startups found." />
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {startups.data.map((s) => (
                  <Link key={s._id} to={`/startups/${s._id}`}>
                    <Card className="flex h-full flex-col p-5 transition-all hover:-translate-y-0.5 hover:shadow-card">
                      <div className="mb-3 flex items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-secondary text-sm font-bold text-white">
                          {s.name[0]}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold">{s.name}</p>
                          <p className="truncate text-xs text-muted-foreground">{s.industry}</p>
                        </div>
                      </div>
                      <p className="mb-3 line-clamp-2 flex-1 text-sm text-muted-foreground">{s.tagline}</p>
                      <div className="flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" /> {s.location || "—"}
                        </span>
                        <Badge variant="outline" className="text-[10px] capitalize">
                          {s.stage.replace("_", " ")}
                        </Badge>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="freelancers">
            {loadingFreelancers ? (
              <GridSkeleton />
            ) : !freelancers?.data.length ? (
              <EmptyState icon={Users} text="No freelancers found." />
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
              <EmptyState icon={Briefcase} text="No gigs found." />
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {services.data.map((s) => (
                  <ServiceCard key={s._id} service={s} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="jobs">
            {loadingJobs ? (
              <GridSkeleton />
            ) : !jobs?.data.length ? (
              <EmptyState icon={FolderKanban} text="No jobs or projects found." />
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {jobs.data.map((job) => (
                  <JobCard key={job._id} job={job} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="contests">
            {loadingContests ? (
              <GridSkeleton />
            ) : !contests?.data.length ? (
              <EmptyState icon={Trophy} text="No contests found." />
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {contests.data.map((contest) => (
                  <ContestCard key={contest._id} contest={contest} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
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

function EmptyState({ icon: Icon, text }: { icon: typeof Rocket; text: string }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border py-16 text-center">
      <Icon className="h-9 w-9 text-muted-foreground" />
      <p className="max-w-sm text-sm text-muted-foreground">{text}</p>
    </div>
  );
}
