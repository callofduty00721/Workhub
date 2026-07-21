import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, Lock, Unlock, Trash2 } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { adminApi } from "@/api/admin";

export default function AdminJobs() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "jobs", { search, page }],
    queryFn: () => adminApi.jobs({ search: search || undefined, page, limit: 20 }),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["admin", "jobs"] });

  const toggleMutation = useMutation({
    mutationFn: (jobId: string) => adminApi.toggleJobStatus(jobId),
    onSuccess: invalidate,
  });

  const removeMutation = useMutation({
    mutationFn: (jobId: string) => adminApi.removeJob(jobId),
    onSuccess: invalidate,
  });

  return (
    <DashboardLayout role="super_admin" title="Manage Jobs & Projects" subtitle="Moderate job and project postings on the platform.">
      <div className="relative mb-5 max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => {
            setPage(1);
            setSearch(e.target.value);
          }}
          placeholder="Search by job title..."
          className="pl-9"
        />
      </div>

      <Card className="overflow-x-auto">
        {isLoading ? (
          <div className="space-y-3 p-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : (
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                <th className="px-5 py-3 font-medium">Job</th>
                <th className="px-5 py-3 font-medium">Employer</th>
                <th className="px-5 py-3 font-medium">Type</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data?.data.map((job) => {
                const employer = typeof job.employer === "object" ? job.employer : null;
                return (
                  <tr key={job._id} className="border-b border-border last:border-0">
                    <td className="px-5 py-3">
                      <Link to={`/jobs/${job._id}`} className="font-medium hover:underline">
                        {job.title}
                      </Link>
                      <p className="text-xs text-muted-foreground">{job.companyName}</p>
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">{employer?.name ?? "—"}</td>
                    <td className="px-5 py-3">
                      <Badge variant="outline" className="capitalize">
                        {job.type.replace("_", " ")}
                      </Badge>
                    </td>
                    <td className="px-5 py-3">
                      <Badge variant={job.status === "open" ? "success" : "outline"} className="capitalize">
                        {job.status}
                      </Badge>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={toggleMutation.isPending}
                          onClick={() => toggleMutation.mutate(job._id)}
                        >
                          {job.status === "open" ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
                          {job.status === "open" ? "Close" : "Reopen"}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-danger hover:bg-danger/10"
                          disabled={removeMutation.isPending}
                          onClick={() => confirm(`Remove "${job.title}"? This can't be undone.`) && removeMutation.mutate(job._id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Card>

      {data && data.pagination.pages > 1 && (
        <div className="mt-5 flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {data.pagination.page} of {data.pagination.pages}
          </span>
          <Button variant="outline" size="sm" disabled={page >= data.pagination.pages} onClick={() => setPage((p) => p + 1)}>
            Next
          </Button>
        </div>
      )}
    </DashboardLayout>
  );
}
