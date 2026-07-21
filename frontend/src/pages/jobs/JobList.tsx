import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Search, Plus, Briefcase } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { JobCard } from "@/components/jobs/JobCard";
import { jobApi } from "@/api/jobs";
import { useAuth } from "@/context/AuthContext";
import type { JobType } from "@/types";

// Freelance/contract-type postings are "Projects" — browsed separately on the
// Freelancers hub page — so this board only covers traditional employment.
const TYPES: { value: JobType; label: string }[] = [
  { value: "full_time", label: "Full Time" },
  { value: "part_time", label: "Part Time" },
  { value: "internship", label: "Internship" },
];
const JOB_BOARD_TYPES = TYPES.map((t) => t.value).join(",");

export default function JobList() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [type, setType] = useState<JobType | null>(null);
  const [page, setPage] = useState(1);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["jobs", { search, type, page }],
    queryFn: () => jobApi.list({ search: search || undefined, type: type || JOB_BOARD_TYPES, page, limit: 12 }),
  });

  return (
    <div className="container py-10">
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Find Your Next Opportunity</h1>
          <p className="mt-1 text-sm text-muted-foreground">Browse jobs posted by startups and companies on MahaHub.</p>
        </div>
        {user?.role === "employer" && (
          <Button variant="gradient" asChild>
            <Link to="/dashboard/employer/post-job">
              <Plus className="h-4 w-4" /> Post a Job
            </Link>
          </Button>
        )}
      </div>

      <div className="mb-6 space-y-4">
        <div className="relative max-w-lg">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
            }}
            placeholder="Search jobs, companies, skills..."
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge
            variant={type === null ? "solid" : "outline"}
            className="cursor-pointer"
            onClick={() => {
              setType(null);
              setPage(1);
            }}
          >
            All
          </Badge>
          {TYPES.map((t) => (
            <Badge
              key={t.value}
              variant={type === t.value ? "solid" : "outline"}
              className="cursor-pointer"
              onClick={() => {
                setType(t.value);
                setPage(1);
              }}
            >
              {t.label}
            </Badge>
          ))}
        </div>
      </div>

      {isLoading && (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
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

      {!isLoading && !isError && (data?.data.length ?? 0) === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border py-16 text-center">
          <Briefcase className="h-9 w-9 text-muted-foreground" />
          <p className="font-medium">No jobs found</p>
          <p className="max-w-sm text-sm text-muted-foreground">Try a different search term or category.</p>
        </div>
      )}

      {!isLoading && !isError && (data?.data.length ?? 0) > 0 && (
        <>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {data!.data.map((job) => (
              <JobCard key={job._id} job={job} />
            ))}
          </div>

          {data!.pagination.pages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {data!.pagination.page} of {data!.pagination.pages}
              </span>
              <Button variant="outline" size="sm" disabled={page >= data!.pagination.pages} onClick={() => setPage((p) => p + 1)}>
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
