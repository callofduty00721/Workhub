import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Megaphone, Plus, Users, Eye } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { VerificationBanner } from "@/components/shared/VerificationBanner";
import { campaignApi } from "@/api/campaigns";

export default function MyCampaigns() {
  const { data: campaigns, isLoading } = useQuery({ queryKey: ["campaigns", "mine"], queryFn: campaignApi.mine });

  const totalApplicants = campaigns?.reduce((sum, c) => sum + c.applicationsCount, 0) ?? 0;
  const openCampaigns = campaigns?.filter((c) => c.status === "open").length ?? 0;

  return (
    <DashboardLayout
      role="employer"
      title="My Campaigns"
      subtitle="Manage your influencer marketing campaigns and applicants."
      actions={
        <Button variant="gradient" asChild>
          <Link to="/dashboard/employer/post-campaign">
            <Plus className="h-4 w-4" /> Post a Campaign
          </Link>
        </Button>
      }
    >
      <VerificationBanner />
      <div className="grid gap-5 sm:grid-cols-3">
        <Card className="p-5">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Megaphone className="h-5 w-5" />
          </div>
          <p className="text-2xl font-bold">{campaigns?.length ?? 0}</p>
          <p className="text-xs text-muted-foreground">Total Campaigns Posted</p>
        </Card>
        <Card className="p-5">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-success/10 text-success">
            <Eye className="h-5 w-5" />
          </div>
          <p className="text-2xl font-bold">{openCampaigns}</p>
          <p className="text-xs text-muted-foreground">Open Campaigns</p>
        </Card>
        <Card className="p-5">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/10 text-secondary">
            <Users className="h-5 w-5" />
          </div>
          <p className="text-2xl font-bold">{totalApplicants}</p>
          <p className="text-xs text-muted-foreground">Total Applicants</p>
        </Card>
      </div>

      <Card className="mt-6">
        <CardContent className="p-6">
          <h3 className="mb-4 text-base font-semibold">My Campaigns</h3>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : !campaigns?.length ? (
            <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border py-10 text-center">
              <Megaphone className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm font-medium">You haven&apos;t posted any campaigns yet</p>
              <Button variant="gradient" asChild size="sm" className="mt-1">
                <Link to="/dashboard/employer/post-campaign">Post Your First Campaign</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {campaigns.map((c) => (
                <div key={c._id} className="flex flex-col gap-3 rounded-lg border border-border p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-semibold">{c.title}</p>
                      <Badge variant={c.status === "open" ? "success" : "outline"} className="text-[10px] capitalize">
                        {c.status}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {c.location} · {c.applicationsCount} applicants · {c.viewsCount} views
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/dashboard/employer/campaigns/${c._id}/applicants`}>View Applicants</Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/dashboard/employer/campaigns/${c._id}/edit`}>Edit</Link>
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
