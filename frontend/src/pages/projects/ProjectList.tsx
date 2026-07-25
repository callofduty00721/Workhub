import { useQuery } from "@tanstack/react-query";
import { FolderKanban } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { projectApi } from "@/api/projects";

// Self-contained Projects browsing tab — only loaded (code-split) once
// someone actually opens the "Projects" tab on the Freelance hub, instead of
// bundling project-search logic into FreelancerList.tsx itself.
export default function ProjectList({ search }: { search: string }) {
  const { data: projects, isLoading } = useQuery({
    queryKey: ["projects", { search }],
    queryFn: () => projectApi.list({ search: search || undefined, limit: 12 }),
  });

  if (isLoading) {
    return (
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-52 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (!projects?.data.length) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border py-16 text-center">
        <FolderKanban className="h-9 w-9 text-muted-foreground" />
        <p className="max-w-sm text-sm text-muted-foreground">No projects posted yet.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {projects.data.map((project) => (
        <ProjectCard key={project._id} project={project} />
      ))}
    </div>
  );
}
