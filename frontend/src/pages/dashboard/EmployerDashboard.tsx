import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Briefcase, ClipboardList, Plus, Users, Eye } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/context/AuthContext";
import { VerificationBanner } from "@/components/shared/VerificationBanner";
import { jobApi } from "@/api/jobs";
import { projectApi } from "@/api/projects";
import type { ApplicationStatus, Job, Project } from "@/types";

const STATUS_LABELS: Record<ApplicationStatus, string> = {
  applied: "Applied",
  shortlisted: "Shortlisted",
  interview: "Interview",
  hired: "Hired",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
};

export default function EmployerDashboard({
  role = "employer",
  basePath = "/dashboard/employer",
  entityLabel = "Job",
  source = "job",
}: {
  role?: "employer" | "client";
  basePath?: string;
  entityLabel?: "Job" | "Project";
  source?: "job" | "project";
}) {
  const { user } = useAuth();
  const routeSegment = source === "project" ? "projects" : "jobs";
  const { data: jobs, isLoading } = useQuery<(Job | Project)[]>({
    queryKey: [routeSegment, "mine"],
    queryFn: () => (source === "project" ? projectApi.mine() : jobApi.mine()),
  });
  const { data: analytics } = useQuery<{ totalViews: number; totalApplications: number; byStatus: Partial<Record<ApplicationStatus, number>> }>({
    queryKey: [routeSegment, "analytics", "mine"],
    queryFn: () => (source === "project" ? projectApi.myAnalytics() : jobApi.myAnalytics()),
  });

  const totalApplicants = jobs?.reduce((sum, j) => sum + j.applicationsCount, 0) ?? 0;
  const openJobs = jobs?.filter((j) => j.status === "open").length ?? 0;

  return (
    <DashboardLayout
      role={role}
      title={`Welcome back, ${user?.name.split(" ")[0]} 👋`}
      subtitle={`Manage your ${entityLabel.toLowerCase()} postings and applicants.`}
      actions={
        <Button variant="gradient" asChild>
          <Link to={`${basePath}/post-job`}>
            <Plus className="h-4 w-4" /> Post a {entityLabel}
          </Link>
        </Button>
      }
    >
      <VerificationBanner />
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-5">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Briefcase className="h-5 w-5" />
          </div>
          <p className="text-2xl font-bold">{jobs?.length ?? 0}</p>
          <p className="text-xs text-muted-foreground">Total {entityLabel}s Posted</p>
        </Card>
        <Card className="p-5">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-success/10 text-success">
            <ClipboardList className="h-5 w-5" />
          </div>
          <p className="text-2xl font-bold">{openJobs}</p>
          <p className="text-xs text-muted-foreground">Open {entityLabel}s</p>
        </Card>
        <Card className="p-5">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/10 text-secondary">
            <Users className="h-5 w-5" />
          </div>
          <p className="text-2xl font-bold">{totalApplicants}</p>
          <p className="text-xs text-muted-foreground">Total Applicants</p>
        </Card>
        <Card className="p-5">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10 text-warning">
            <Eye className="h-5 w-5" />
          </div>
          <p className="text-2xl font-bold">{analytics?.totalViews ?? 0}</p>
          <p className="text-xs text-muted-foreground">Total Views</p>
        </Card>
      </div>

      {analytics && !!analytics.totalApplications && (
        <Card className="mt-6">
          <CardContent className="p-6">
            <h3 className="mb-4 text-base font-semibold">Applicant Funnel</h3>
            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {(Object.keys(STATUS_LABELS) as ApplicationStatus[]).map((status) => (
                <div key={status} className="rounded-lg border border-border p-3 text-center">
                  <p className="text-lg font-bold">{analytics.byStatus[status] ?? 0}</p>
                  <p className="text-xs text-muted-foreground">{STATUS_LABELS[status]}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="mt-6">
        <CardContent className="p-6">
          <h3 className="mb-4 text-base font-semibold">My {entityLabel}s</h3>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : !jobs?.length ? (
            <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border py-10 text-center">
              <Briefcase className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm font-medium">You haven&apos;t posted any {entityLabel.toLowerCase()}s yet</p>
              <Button variant="gradient" asChild size="sm" className="mt-1">
                <Link to={`${basePath}/post-job`}>Post Your First {entityLabel}</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {jobs.map((job) => (
                <div key={job._id} className="flex flex-col gap-3 rounded-lg border border-border p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-semibold">{job.title}</p>
                      <Badge variant={job.status === "open" ? "success" : "outline"} className="text-[10px] capitalize">
                        {job.status}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {job.location} · {job.applicationsCount} applicants · {job.viewsCount} views
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`${basePath}/${routeSegment}/${job._id}/applicants`}>View Applicants</Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`${basePath}/${routeSegment}/${job._id}/edit`}>Edit</Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
