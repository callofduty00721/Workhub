import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Search, Plus, Briefcase, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { JobCard } from "@/components/jobs/JobCard";
import { JobFilterSidebar, DEFAULT_JOB_FILTERS, type JobFilterState } from "@/components/jobs/JobFilterSidebar";
import { Pagination } from "@/components/shared/Pagination";
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
  const [searchParams, setSearchParams] = useSearchParams();
  const category = searchParams.get("category");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<JobFilterState>(DEFAULT_JOB_FILTERS);

  const type = filters.types.length > 0 ? filters.types.join(",") : JOB_BOARD_TYPES;

  const { data, isLoading, isError } = useQuery({
    queryKey: ["jobs", { search, type, category, page }],
    queryFn: () => jobApi.list({ search: search || undefined, type, category: category || undefined, page, limit: 12, isRemote: filters.isRemote || undefined }),
  });

  const jobs = (data?.data ?? []).filter(
    (job) =>
      (filters.categories.length === 0 || filters.categories.includes(job.category)) &&
      job.salaryMin <= filters.maxSalary
  );

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

      <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
        <JobFilterSidebar value={filters} onChange={setFilters} />

        <div>
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
            {category && (
              <Badge variant="solid" className="flex w-fit items-center gap-1.5">
                Category: {category}
                <button type="button" onClick={() => setSearchParams({})} aria-label="Clear category filter">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
          </div>

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
            <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border py-16 text-center">
              <Briefcase className="h-9 w-9 text-muted-foreground" />
              <p className="font-medium">No jobs found</p>
              <p className="max-w-sm text-sm text-muted-foreground">Try a different search term or filter.</p>
            </div>
          )}

          {!isLoading && !isError && jobs.length > 0 && (
            <>
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
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
  );
}
