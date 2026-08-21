import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Search, Rocket, Users, Briefcase, FolderKanban, Trophy, MapPin } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { FreelancerCard } from "@/roles/freelancer/components/FreelancerCard";
import { GigListCard } from "@/pages/gigs/GigListCard";
import { JobCard } from "@/pages/jobs/JobCard";
import { ContestCard } from "@/pages/contests/ContestCard";
import { startupApi } from "@/api/startups";
import { freelancerApi, serviceApi } from "@/api/freelancers";
import { jobApi } from "@/api/jobs";
import { contestApi } from "@/api/contests";
import { cn } from "@/lib/utils";

type ResultTab = "startups" | "freelancers" | "services" | "jobs" | "contests";

const TABS: { value: ResultTab; label: string; icon: typeof Rocket }[] = [
  { value: "startups", label: "Startups", icon: Rocket },
  { value: "freelancers", label: "Freelancers", icon: Users },
  { value: "services", label: "Gigs", icon: Briefcase },
  { value: "jobs", label: "Jobs & Projects", icon: FolderKanban },
  { value: "contests", label: "Contests", icon: Trophy },
];

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
    <div className="bg-[#F7F8F5]">
      <div className="container py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-extrabold tracking-tight text-[#111111]">Search GrowHive</h1>
          <p className="mt-1 text-sm text-[#6B7280]">Find startups, freelancers, gigs, jobs, projects, and contests — all in one place.</p>
        </div>

        <form onSubmit={handleSubmit} className="relative mb-8 max-w-xl">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" />
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Search everything on GrowHive..."
            autoFocus
            className="h-11 w-full rounded-full border border-[#E5E7EB] bg-white pl-11 pr-4 text-sm text-[#111111] placeholder:text-[#9CA3AF] focus:border-[#B6FF00] focus:outline-none"
          />
        </form>

        {!query ? (
          <div className="flex flex-col items-center gap-3 rounded-[20px] border border-dashed border-[#E5E7EB] bg-white py-16 text-center">
            <Search className="h-9 w-9 text-[#9CA3AF]" />
            <p className="max-w-sm text-sm text-[#6B7280]">Type something above to search across the whole platform.</p>
          </div>
        ) : (
          <div>
            <div className="mb-6 flex flex-wrap gap-2 border-b border-[#E5E7EB] pb-3">
              {TABS.map((t) => {
                const isActive = tab === t.value;
                return (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setTab(t.value)}
                    className={cn(
                      "flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition-colors",
                      isActive ? "bg-[#111111] text-white" : "border border-[#E5E7EB] bg-white text-[#4B5563] hover:bg-[#F1F3EF]"
                    )}
                  >
                    <t.icon className="h-3.5 w-3.5" /> {t.label} ({counts[t.value]})
                  </button>
                );
              })}
            </div>

            {tab === "startups" &&
              (loadingStartups ? (
                <GridSkeleton />
              ) : !startups?.data.length ? (
                <EmptyState icon={Rocket} text="No startups found." />
              ) : (
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {startups.data.map((s) => (
                    <Link key={s._id} to={`/startups/${s._id}`}>
                      <div className="flex h-full flex-col rounded-[20px] border border-[#E5E7EB] bg-white p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#B6FF00] hover:shadow-[0_16px_32px_-18px_rgba(15,23,42,0.18)]">
                        <div className="mb-3 flex items-center gap-3">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#111111] text-sm font-bold text-white">
                            {s.name[0]}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-[#111111]">{s.name}</p>
                            <p className="truncate text-xs text-[#9CA3AF]">{s.industry}</p>
                          </div>
                        </div>
                        <p className="mb-3 line-clamp-2 flex-1 text-sm text-[#6B7280]">{s.tagline}</p>
                        <div className="flex items-center justify-between border-t border-[#F1F3EF] pt-3 text-xs text-[#9CA3AF]">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5" /> {s.location || "—"}
                          </span>
                          <span className="rounded-full border border-[#E5E7EB] px-2 py-0.5 text-[10px] font-medium capitalize text-[#4B5563]">
                            {s.stage.replace("_", " ")}
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ))}

            {tab === "freelancers" &&
              (loadingFreelancers ? (
                <GridSkeleton />
              ) : !freelancers?.data.length ? (
                <EmptyState icon={Users} text="No freelancers found." />
              ) : (
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {freelancers.data.map((f) => (
                    <FreelancerCard key={f._id} freelancer={f} />
                  ))}
                </div>
              ))}

            {tab === "services" &&
              (loadingServices ? (
                <GridSkeleton />
              ) : !services?.data.length ? (
                <EmptyState icon={Briefcase} text="No gigs found." />
              ) : (
                <div className="flex flex-col gap-4">
                  {services.data.map((s) => (
                    <GigListCard key={s._id} service={s} />
                  ))}
                </div>
              ))}

            {tab === "jobs" &&
              (loadingJobs ? (
                <GridSkeleton />
              ) : !jobs?.data.length ? (
                <EmptyState icon={FolderKanban} text="No jobs or projects found." />
              ) : (
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {jobs.data.map((job) => (
                    <JobCard key={job._id} job={job} />
                  ))}
                </div>
              ))}

            {tab === "contests" &&
              (loadingContests ? (
                <GridSkeleton />
              ) : !contests?.data.length ? (
                <EmptyState icon={Trophy} text="No contests found." />
              ) : (
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {contests.data.map((contest) => (
                    <ContestCard key={contest._id} contest={contest} />
                  ))}
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}

function GridSkeleton() {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <Skeleton key={i} className="h-52 w-full rounded-[20px] bg-[#EDEFEA]" />
      ))}
    </div>
  );
}

function EmptyState({ icon: Icon, text }: { icon: typeof Rocket; text: string }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-[20px] border border-dashed border-[#E5E7EB] bg-white py-16 text-center">
      <Icon className="h-9 w-9 text-[#9CA3AF]" />
      <p className="max-w-sm text-sm text-[#6B7280]">{text}</p>
    </div>
  );
}
