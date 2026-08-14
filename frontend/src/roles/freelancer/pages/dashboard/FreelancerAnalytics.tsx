import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Eye, ShoppingBag, Wallet, ArrowRight } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { serviceApi } from "@/api/freelancers";
import { jobApi } from "@/api/jobs";
import { useScrollToHash } from "@/hooks/useScrollToHash";
import { formatCompactNumber } from "@/lib/utils";
import type { ApplicationStatus } from "@/types";

const PROPOSAL_BUCKETS: { label: string; statuses: ApplicationStatus[]; color: string }[] = [
  { label: "Pending", statuses: ["applied"], color: "bg-warning" },
  { label: "Shortlisted / Interview", statuses: ["shortlisted", "interview"], color: "bg-primary" },
  { label: "Hired", statuses: ["hired"], color: "bg-success" },
  { label: "Rejected / Withdrawn", statuses: ["rejected", "withdrawn"], color: "bg-danger" },
];

export default function FreelancerAnalytics() {
  useScrollToHash();
  const { data: gigAnalytics, isLoading: loadingGigs } = useQuery({ queryKey: ["services", "analytics", "mine"], queryFn: serviceApi.myAnalytics });
  const { data: applications, isLoading: loadingApplications } = useQuery({ queryKey: ["applications", "mine"], queryFn: jobApi.myApplications });

  return (
    <DashboardLayout role="freelancer" title="Analytics" subtitle="How your gigs, proposals, and earnings are performing.">
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="p-5">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Eye className="h-5 w-5" />
          </div>
          {loadingGigs ? <Skeleton className="h-7 w-16" /> : <p className="text-2xl font-bold">{formatCompactNumber(gigAnalytics?.totalViews ?? 0)}</p>}
          <p className="text-xs text-muted-foreground">Total Gig Views</p>
        </Card>
        <Card className="p-5">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/10 text-secondary">
            <ShoppingBag className="h-5 w-5" />
          </div>
          {loadingGigs ? <Skeleton className="h-7 w-16" /> : <p className="text-2xl font-bold">{gigAnalytics?.totalOrders ?? 0}</p>}
          <p className="text-xs text-muted-foreground">Total Gig Orders</p>
        </Card>
        <Link to="/dashboard/freelancer/earnings">
          <Card className="h-full p-5 transition-colors hover:border-foreground/20">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-success/10 text-success">
              <Wallet className="h-5 w-5" />
            </div>
            <p className="flex items-center gap-1 text-sm font-semibold">
              View earnings & wallet <ArrowRight className="h-3.5 w-3.5" />
            </p>
            <p className="text-xs text-muted-foreground">Balance, payment history, and withdrawals</p>
          </Card>
        </Link>
      </div>

      <div className="mt-6">
        <Card>
          <CardContent className="p-6">
            <h3 className="mb-4 text-base font-semibold">Proposal Funnel</h3>
            {loadingApplications ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-8 w-full" />
                ))}
              </div>
            ) : (
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
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-6">
        <Card>
          <CardContent className="p-6">
            <h3 className="mb-4 text-base font-semibold">Gig Performance</h3>
            {loadingGigs ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : !gigAnalytics?.services.length ? (
              <p className="py-6 text-center text-sm text-muted-foreground">Create a gig to start seeing performance data.</p>
            ) : (
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
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
