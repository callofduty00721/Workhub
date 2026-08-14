import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Eye, Users, IndianRupee, CheckCircle2, Wallet } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import type { DashboardRole } from "@/components/layout/DashboardSidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { campaignApi } from "@/api/campaigns";
import { useAuth } from "@/context/AuthContext";
import { initialsFromName, formatCurrency } from "@/lib/utils";

const STATUS_VARIANT: Record<string, "default" | "warning" | "success" | "danger"> = {
  applied: "default",
  shortlisted: "warning",
  interview: "warning",
  hired: "success",
  rejected: "danger",
  withdrawn: "danger",
};

// A real, computed report (see campaign.controller.js's getCampaignReport) —
// every number here comes straight from Applications/Payments, nothing
// stored or self-reported. Viewable by whoever manages the campaign and,
// when it was posted on their behalf, the delegating brand.
export default function CampaignReport() {
  const { id = "" } = useParams();
  const { user } = useAuth();
  const dashboardRole = (user?.role ?? "employer") as DashboardRole;

  const { data: report, isLoading } = useQuery({
    queryKey: ["campaigns", id, "report"],
    queryFn: () => campaignApi.getReport(id),
    enabled: !!id,
  });

  return (
    <DashboardLayout role={dashboardRole} title={report ? `Report — ${report.campaign.title}` : "Campaign Report"} subtitle="Real numbers, computed fresh from applications and payments.">
      <Button variant="ghost" size="sm" asChild className="mb-4">
        <Link to="/dashboard/employer/campaigns">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to My Campaigns
        </Link>
      </Button>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : !report ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">Report not found, or you don't have access to it.</CardContent>
        </Card>
      ) : (
        <>
          {report.campaign.onBehalfOf && (
            <p className="mb-4 text-sm text-muted-foreground">
              Run by <span className="font-medium text-foreground">{report.campaign.employer.name}</span> on behalf of{" "}
              <span className="font-medium text-foreground">{report.campaign.onBehalfOf.name}</span>
            </p>
          )}

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <Card>
              <CardContent className="flex items-center gap-3 p-5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Eye className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Views</p>
                  <p className="text-lg font-bold">{report.campaign.viewsCount}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-3 p-5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-secondary/10 text-secondary">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Applications</p>
                  <p className="text-lg font-bold">{report.summary.totalApplications}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-3 p-5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-success/10 text-success">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Hired</p>
                  <p className="text-lg font-bold">{report.summary.hiredCount}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-3 p-5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-warning/10 text-warning">
                  <IndianRupee className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total Spend</p>
                  <p className="text-lg font-bold">{formatCurrency(report.summary.totalSpend)}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-3 p-5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Wallet className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Released</p>
                  <p className="text-lg font-bold">{formatCurrency(report.summary.totalReleased)}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="mt-6">
            <CardContent className="p-6">
              <h3 className="mb-4 text-base font-semibold">Influencers ({report.influencers.length})</h3>
              {!report.influencers.length ? (
                <p className="text-sm text-muted-foreground">No applicants yet.</p>
              ) : (
                <div className="space-y-3">
                  {report.influencers.map((row) => (
                    <div key={row.applicationId} className="flex flex-col gap-3 rounded-lg border border-border p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 shrink-0">
                          <AvatarImage src={row.influencer.avatar} alt={row.influencer.name} />
                          <AvatarFallback className="bg-neutral-900 text-sm text-white">{initialsFromName(row.influencer.name)}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold">{row.influencer.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {row.influencer.influencerProfile?.niche || row.influencer.influencerProfile?.category || "—"}
                            {row.origin === "invited" && " · Invited"}
                          </p>
                        </div>
                      </div>
                      <div className="flex shrink-0 flex-wrap items-center gap-2">
                        {!!row.proposedRate && <span className="text-sm font-semibold">{formatCurrency(row.proposedRate)}</span>}
                        {row.payment && (
                          <Badge variant={row.payment.escrowStatus === "released" ? "success" : "warning"} className="text-[10px]">
                            {row.payment.escrowStatus === "released" ? "Paid & Released" : "In Escrow"}
                          </Badge>
                        )}
                        <Badge variant={STATUS_VARIANT[row.status]} className="text-[10px] capitalize">
                          {row.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </DashboardLayout>
  );
}
