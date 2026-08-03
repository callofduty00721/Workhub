import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Users2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { JobSeekerCard } from "@/roles/job-seeker/components/JobSeekerCard";
import { jobSeekerApi } from "@/api/jobSeekers";

export default function JobSeekerList() {
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["job-seekers", { search }],
    queryFn: () => jobSeekerApi.list({ search: search || undefined, limit: 12 }),
  });

  return (
    <div className="container py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Job Seeker Directory</h1>
        <p className="mt-1 text-sm text-muted-foreground">Browse candidates actively looking for their next full-time role.</p>
      </div>

      <div className="relative mb-6 max-w-lg">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search job seekers..." className="pl-9" />
      </div>

      {isLoading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full rounded-xl" />
          ))}
        </div>
      ) : !data?.data.length ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border py-16 text-center">
          <Users2 className="h-9 w-9 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No job seekers found.</p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {data.data.map((jobSeeker) => (
            <JobSeekerCard key={jobSeeker._id} jobSeeker={jobSeeker} />
          ))}
        </div>
      )}
    </div>
  );
}
