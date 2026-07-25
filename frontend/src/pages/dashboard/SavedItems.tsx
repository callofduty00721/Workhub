import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bookmark, Briefcase, FolderKanban, Rocket, Heart } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { JobCard } from "@/components/jobs/JobCard";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { ServiceCard } from "@/components/gigs/ServiceCard";
import { StartupCard } from "@/components/startup/StartupCard";
import { userApi } from "@/api/users";
import { startupApi } from "@/api/startups";
import { cn } from "@/lib/utils";

type Tab = "jobs" | "projects" | "gigs" | "startups";

export default function SavedItems() {
  const [tab, setTab] = useState<Tab>("jobs");
  const { data, isLoading } = useQuery({ queryKey: ["users", "me", "saved"], queryFn: userApi.getSavedItems });
  const { data: startups, isLoading: loadingStartups } = useQuery({
    queryKey: ["startups", "followed", "mine"],
    queryFn: startupApi.followedByMe,
  });

  const jobs = data?.jobs ?? [];
  const projects = data?.projects ?? [];
  const services = data?.services ?? [];
  const followedStartups = startups ?? [];

  return (
    <DashboardLayout role="freelancer" title="Saved" subtitle="Jobs, projects, gigs and startups you've bookmarked or followed.">
      <div className="mb-5 flex gap-1 border-b border-border">
        {[
          { key: "jobs" as Tab, label: `Jobs (${jobs.length})`, icon: Briefcase },
          { key: "projects" as Tab, label: `Projects (${projects.length})`, icon: FolderKanban },
          { key: "gigs" as Tab, label: `Gigs (${services.length})`, icon: Rocket },
          { key: "startups" as Tab, label: `Startups (${followedStartups.length})`, icon: Heart },
        ].map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={cn(
              "flex items-center gap-1.5 border-b-2 px-3.5 py-2.5 text-sm font-medium transition-colors",
              tab === t.key ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <t.icon className="h-3.5 w-3.5" /> {t.label}
          </button>
        ))}
      </div>

      {tab === "jobs" &&
        (isLoading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : jobs.length === 0 ? (
          <EmptyState text="No saved jobs yet — tap the bookmark icon on a job to save it here." />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {jobs.map((job) => (
              <JobCard key={job._id} job={job} />
            ))}
          </div>
        ))}

      {tab === "projects" &&
        (isLoading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : projects.length === 0 ? (
          <EmptyState text="No saved projects yet — tap the bookmark icon on a project to save it here." />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <ProjectCard key={project._id} project={project} />
            ))}
          </div>
        ))}

      {tab === "gigs" &&
        (isLoading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : services.length === 0 ? (
          <EmptyState text="No saved gigs yet — tap the bookmark icon on a gig to save it here." />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => (
              <ServiceCard key={service._id} service={service} />
            ))}
          </div>
        ))}

      {tab === "startups" &&
        (loadingStartups ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : followedStartups.length === 0 ? (
          <EmptyState text="No followed or interested startups yet — tap the heart icon on a startup to save it here." />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {followedStartups.map((startup) => (
              <StartupCard key={startup._id} startup={startup} />
            ))}
          </div>
        ))}
    </DashboardLayout>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
        <Bookmark className="h-9 w-9 text-muted-foreground" />
        <p className="max-w-sm text-sm text-muted-foreground">{text}</p>
      </CardContent>
    </Card>
  );
}
