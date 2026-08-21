import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Search, Lock, Unlock, Trash2, Flag, ShieldCheck } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { adminApi } from "@/api/admin";
import type { Paginated, Job, Project } from "@/types";

type Tab = "jobs" | "projects";

const fadeIn = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" as const } } };

export default function AdminJobs() {
  const [tab, setTab] = useState<Tab>("jobs");
  const [search, setSearch] = useState("");
  const [reportedOnly, setReportedOnly] = useState(false);
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const isJobs = tab === "jobs";

  const { data, isLoading } = useQuery<Paginated<Job | Project>>({
    queryKey: ["admin", tab, { search, page, reportedOnly: isJobs ? reportedOnly : false }],
    queryFn: () =>
      isJobs
        ? adminApi.jobs({ search: search || undefined, page, limit: 20, hasReports: reportedOnly || undefined })
        : adminApi.projects({ search: search || undefined, page, limit: 20 }),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["admin", tab] });

  const toggleMutation = useMutation({
    mutationFn: (id: string) => (isJobs ? adminApi.toggleJobStatus(id) : adminApi.toggleProjectStatus(id)),
    onSuccess: invalidate,
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => (isJobs ? adminApi.removeJob(id) : adminApi.removeProject(id)),
    onSuccess: invalidate,
  });

  const dismissReportsMutation = useMutation({
    mutationFn: (id: string) => adminApi.dismissJobReports(id),
    onSuccess: invalidate,
  });

  const switchTab = (next: Tab) => {
    setTab(next);
    setPage(1);
    setSearch("");
    setReportedOnly(false);
  };

  return (
    <DashboardLayout role="super_admin" title="Manage Jobs & Projects" subtitle="Moderate job and project postings on the platform.">
      <div className="mb-5 flex items-center gap-2">
        {(["jobs", "projects"] as const).map((t) => (
          <button
            key={t}
            onClick={() => switchTab(t)}
            className={cn(
              "rounded-lg px-3.5 py-1.5 text-sm font-medium capitalize transition-colors",
              tab === t ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
            )}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
            }}
            placeholder={`Search by ${isJobs ? "job" : "project"} title...`}
            className="pl-9"
          />
        </div>
        {isJobs && (
          <button
            type="button"
            onClick={() => {
              setPage(1);
              setReportedOnly((v) => !v);
            }}
            className={cn(
              "flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors",
              reportedOnly ? "border-danger/40 bg-danger/10 text-danger" : "border-border text-muted-foreground hover:text-foreground"
            )}
          >
            <Flag className="h-3.5 w-3.5" /> Reported only
          </button>
        )}
      </div>

      <motion.div variants={fadeIn} initial="hidden" animate="show">
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
                <th className="px-5 py-3 font-medium">{isJobs ? "Job" : "Project"}</th>
                <th className="px-5 py-3 font-medium">{isJobs ? "Employer" : "Client"}</th>
                <th className="px-5 py-3 font-medium">Type</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data?.data.map((item) => {
                const employer = typeof item.employer === "object" ? item.employer : null;
                return (
                  <tr key={item._id} className="border-b border-border last:border-0">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1.5">
                        <Link to={`/${isJobs ? "jobs" : "projects"}/${item._id}`} className="font-medium hover:underline">
                          {item.title}
                        </Link>
                        {isJobs && !!(item as Job).reports?.length && (
                          <Badge variant="danger" className="shrink-0 gap-1 text-[10px]">
                            <Flag className="h-2.5 w-2.5" /> {(item as Job).reports!.length}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{item.companyName}</p>
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">{employer?.name ?? "—"}</td>
                    <td className="px-5 py-3">
                      <Badge variant="outline" className="capitalize">
                        {item.type.replace("_", " ")}
                      </Badge>
                    </td>
                    <td className="px-5 py-3">
                      <Badge variant={item.status === "open" ? "success" : "outline"} className="capitalize">
                        {item.status}
                      </Badge>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        {isJobs && !!(item as Job).reports?.length && (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={dismissReportsMutation.isPending}
                            onClick={() => dismissReportsMutation.mutate(item._id)}
                          >
                            <ShieldCheck className="h-3.5 w-3.5" /> Dismiss reports
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={toggleMutation.isPending}
                          onClick={() => toggleMutation.mutate(item._id)}
                        >
                          {item.status === "open" ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
                          {item.status === "open" ? "Close" : "Reopen"}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-danger hover:bg-danger/10"
                          disabled={removeMutation.isPending}
                          onClick={() => confirm(`Remove "${item.title}"? This can't be undone.`) && removeMutation.mutate(item._id)}
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
      </motion.div>

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
