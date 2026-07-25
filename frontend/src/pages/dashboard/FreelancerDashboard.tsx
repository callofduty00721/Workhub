import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Wallet, Briefcase, FileText, Star, Eye, Plus } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/context/AuthContext";
import { jobApi } from "@/api/jobs";
import { projectApi } from "@/api/projects";
import { paymentApi } from "@/api/payments";
import { serviceApi } from "@/api/freelancers";
import { formatCurrency } from "@/lib/utils";
import type { ApplicationStatus } from "@/types";

const STATUS_VARIANT: Record<ApplicationStatus, "default" | "warning" | "success" | "danger"> = {
  applied: "default",
  shortlisted: "warning",
  interview: "warning",
  hired: "success",
  rejected: "danger",
  withdrawn: "danger",
};

const PROPOSAL_BUCKETS: { label: string; statuses: ApplicationStatus[]; color: string }[] = [
  { label: "Pending", statuses: ["applied"], color: "bg-warning" },
  { label: "Shortlisted / Interview", statuses: ["shortlisted", "interview"], color: "bg-primary" },
  { label: "Hired", statuses: ["hired"], color: "bg-success" },
  { label: "Rejected / Withdrawn", statuses: ["rejected", "withdrawn"], color: "bg-danger" },
];

export default function FreelancerDashboard() {
  const { user } = useAuth();

  const { data: applications, isLoading: loadingApplications } = useQuery({
    queryKey: ["applications", "mine"],
    queryFn: jobApi.myApplications,
  });

  const { data: earnings, isLoading: loadingEarnings } = useQuery({
    queryKey: ["payments", "earnings", { page: 1, limit: 1 }],
    queryFn: () => paymentApi.myEarnings({ page: 1, limit: 1 }),
  });

  const { data: recommended, isLoading: loadingRecommended } = useQuery({
    queryKey: ["projects", "recommended"],
    queryFn: () => projectApi.list({ limit: 3 }),
  });

  const { data: gigAnalytics, isLoading: loadingGigAnalytics } = useQuery({
    queryKey: ["services", "analytics", "mine"],
    queryFn: serviceApi.myAnalytics,
  });

  const activeProjects = applications?.filter((a) => a.status === "hired").length ?? 0;
  const proposalsSent = applications?.length ?? 0;

  const metrics = [
    { label: "Total Earnings", value: formatCurrency(earnings?.totalEarnings ?? 0), icon: Wallet, color: "text-primary bg-primary/10" },
    { label: "Active Projects", value: String(activeProjects), icon: Briefcase, color: "text-secondary bg-secondary/10" },
    { label: "Proposals Sent", value: String(proposalsSent), icon: FileText, color: "text-warning bg-warning/10" },
    {
      label: "Average Rating",
      value: user?.rating ? user.rating.toFixed(1) : "New",
      icon: Star,
      color: "text-success bg-success/10",
      sub: `${user?.reviewCount ?? 0} reviews`,
    },
    {
      label: "Profile Views",
      value: String(user?.profileViews ?? 0),
      icon: Eye,
      color: "text-primary bg-primary/10",
    },
  ];

  const recentApplications = applications?.slice(0, 4) ?? [];
  const isLoading = loadingApplications || loadingEarnings;

  return (
    <DashboardLayout
      role="freelancer"
      title={`Welcome back, ${user?.name.split(" ")[0]} 👋`}
      subtitle="Here's what's happening with your freelance business today."
      actions={
        <Button variant="gradient" asChild>
          <Link to="/dashboard/freelancer/gigs/new">
            <Plus className="h-4 w-4" /> Create New Gig
          </Link>
        </Button>
      }
    >
      {isLoading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
          {metrics.map((m) => (
            <Card key={m.label} className="p-5">
              <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-lg ${m.color}`}>
                <m.icon className="h-5 w-5" />
              </div>
              <p className="text-2xl font-bold">{m.value}</p>
              <p className="text-xs text-muted-foreground">{m.label}</p>
              {m.sub && <p className="mt-1 text-[11px] font-medium text-muted-foreground">{m.sub}</p>}
            </Card>
          ))}
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardContent className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-semibold">Recent Applications</h3>
              <Link to="/dashboard/freelancer/applications" className="text-xs font-medium text-primary hover:underline">
                View All
              </Link>
            </div>
            {loadingApplications ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : !recentApplications.length ? (
              <p className="py-6 text-center text-sm text-muted-foreground">You haven&apos;t applied to any jobs yet.</p>
            ) : (
              <div className="space-y-3">
                {recentApplications.map((a) => {
                  const job = typeof a.job === "object" ? a.job : null;
                  return (
                    <div key={a._id} className="flex items-center justify-between gap-4 rounded-lg border border-border p-3.5">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{job?.title ?? "Job"}</p>
                        <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{job?.companyName}</span>
                          <Badge variant={STATUS_VARIANT[a.status]} className="text-[10px] capitalize">
                            {a.status}
                          </Badge>
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        {!!a.proposedRate && <p className="text-sm font-semibold">{formatCurrency(a.proposedRate)}</p>}
                        <p className="text-xs text-muted-foreground">{new Date(a.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h3 className="mb-4 text-base font-semibold">Proposals Overview</h3>
            <p className="mb-4 text-2xl font-bold">
              {proposalsSent} <span className="text-sm font-normal text-muted-foreground">Total</span>
            </p>
            <div className="space-y-3">
              {PROPOSAL_BUCKETS.map((bucket) => {
                const count = applications?.filter((a) => bucket.statuses.includes(a.status)).length ?? 0;
                return (
                  <div key={bucket.label} className="flex items-center gap-3">
                    <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${bucket.color}`} />
                    <span className="flex-1 text-sm text-muted-foreground">{bucket.label}</span>
                    <span className="text-sm font-semibold">{count}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {!!gigAnalytics?.services.length && (
        <div className="mt-6">
          <Card>
            <CardContent className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-base font-semibold">Gig Performance</h3>
                <Link to="/dashboard/freelancer/gigs" className="text-xs font-medium text-primary hover:underline">
                  Manage Gigs
                </Link>
              </div>
              {loadingGigAnalytics ? (
                <Skeleton className="h-24 w-full" />
              ) : (
                <>
                  <div className="mb-4 flex gap-6 text-sm">
                    <span>
                      <strong>{gigAnalytics.totalViews}</strong> <span className="text-muted-foreground">total views</span>
                    </span>
                    <span>
                      <strong>{gigAnalytics.totalOrders}</strong> <span className="text-muted-foreground">total orders</span>
                    </span>
                  </div>
                  <div className="space-y-2">
                    {gigAnalytics.services.map((s) => (
                      <div key={s._id} className="flex items-center justify-between rounded-lg border border-border p-3 text-sm">
                        <span className="truncate">{s.title}</span>
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {s.viewsCount} views · {s.ordersCount} orders
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      <div className="mt-6">
        <Card>
          <CardContent className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-semibold">Open Projects You Could Apply To</h3>
              <Link to="/freelancers?tab=projects" className="text-xs font-medium text-primary hover:underline">
                View All Projects
              </Link>
            </div>
            {loadingRecommended ? (
              <div className="grid gap-4 sm:grid-cols-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-24 w-full" />
                ))}
              </div>
            ) : !recommended?.data.length ? (
              <p className="py-6 text-center text-sm text-muted-foreground">No open projects right now — check back soon.</p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-3">
                {recommended.data.map((project) => (
                  <Link
                    key={project._id}
                    to={`/projects/${project._id}`}
                    className="rounded-lg border border-border p-4 transition-colors hover:border-primary"
                  >
                    <p className="text-sm font-semibold">{project.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {project.budgetMin > 0 ? `${formatCurrency(project.budgetMin)} - ${formatCurrency(project.budgetMax)}` : "Rate on request"}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {project.skills.slice(0, 3).map((t) => (
                        <Badge key={t} variant="outline" className="text-[10px]">
                          {t}
                        </Badge>
                      ))}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
