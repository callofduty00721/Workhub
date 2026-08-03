import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Megaphone, Users, ExternalLink, Pencil, Bell, CheckCircle2, MessageSquare, Briefcase, Crown, Sparkles, Wallet } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PortfolioGrid } from "@/components/shared/PortfolioGrid";
import { jobApi } from "@/api/jobs";
import { influencerApi } from "@/api/influencers";
import { paymentApi } from "@/api/payments";
import { notificationApi } from "@/api/notifications";
import { chatApi } from "@/api/chat";
import { useAuth } from "@/context/AuthContext";
import { influencerProfileCompletion } from "@/lib/profileCompletion";
import { formatCompactNumber, formatCurrency, initialsFromName, timeAgoShort as timeAgo } from "@/lib/utils";
import type { NotificationType } from "@/types";

const ACTIVITY_ICON: Partial<Record<NotificationType, typeof Bell>> = {
  job_application: Briefcase,
  application_status: CheckCircle2,
  new_message: MessageSquare,
  system: Bell,
};

export default function InfluencerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const platforms = user?.influencerProfile?.platforms ?? [];
  const totalFollowers = platforms.reduce((sum, p) => sum + (p.followers ?? 0), 0);
  const profileComplete = !!(user?.influencerProfile?.niche && platforms.length > 0);
  const profileStrength = user ? influencerProfileCompletion(user) : 0;

  const { data: applications, isLoading: loadingApplications } = useQuery({ queryKey: ["applications", "mine"], queryFn: jobApi.myApplications });
  const { data: viewTrend, isLoading: loadingTrend } = useQuery({ queryKey: ["influencers", "me", "view-trend"], queryFn: influencerApi.myViewTrend });
  const { data: earnings } = useQuery({
    queryKey: ["payments", "earnings", { page: 1, limit: 200 }],
    queryFn: () => paymentApi.myEarnings({ page: 1, limit: 200 }),
  });
  const { data: notifications, isLoading: loadingNotifications } = useQuery({ queryKey: ["notifications"], queryFn: notificationApi.list });

  const messageMutation = useMutation({
    mutationFn: (employerId: string) => chatApi.getOrCreateConversation(employerId),
    onSuccess: (conversation) => navigate(`/dashboard/messages?c=${conversation._id}`),
  });

  const campaignApplications = (applications ?? []).filter((a) => a.onModel === "Campaign");
  const activeCampaigns = campaignApplications.filter((a) => a.status === "hired");
  const totalCampaignEarnings = earnings?.byType?.campaign ?? 0;
  const chartData = (viewTrend ?? []).map((p) => ({ ...p, label: new Date(p.date).toLocaleDateString("en-US", { day: "numeric", month: "short" }) }));

  return (
    <DashboardLayout
      role="influencer"
      title={`Welcome back, ${user?.name.split(" ")[0]} 👋`}
      subtitle="Manage your creator profile and brand campaigns."
      actions={
        <Button variant="gradient" asChild>
          <Link to="/dashboard/profile">
            <Pencil className="h-4 w-4" /> Edit Profile
          </Link>
        </Button>
      }
    >
      {!profileComplete && (
        <div className="mb-6 flex flex-col gap-2 rounded-xl border border-border bg-muted/60 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
          <p className="text-foreground/90">Add your niche and platforms so brands can discover you in the Influencer Directory.</p>
          <Link to="/dashboard/profile" className="shrink-0 font-semibold text-primary underline">
            Complete Profile
          </Link>
        </div>
      )}

      <Card className="mb-6 overflow-hidden border-none bg-gradient-to-r from-primary to-secondary text-primary-foreground">
        <CardContent className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold sm:text-base">Grow your influence today</p>
            <p className="mt-0.5 text-xs text-primary-foreground/80">A complete profile gets you discovered by more brands.</p>
          </div>
          <div className="w-full max-w-xs">
            <div className="mb-1.5 flex items-center justify-between text-xs font-medium">
              <span>Profile Strength</span>
              <span>{profileStrength}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-white/25">
              <div className="h-full rounded-full bg-white transition-all" style={{ width: `${profileStrength}%` }} />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-5">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Users className="h-5 w-5" />
          </div>
          <p className="text-2xl font-bold">{totalFollowers > 0 ? formatCompactNumber(totalFollowers) : "—"}</p>
          <p className="text-xs text-muted-foreground">Total Followers</p>
        </Card>
        <Card className="p-5">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/10 text-secondary">
            <Megaphone className="h-5 w-5" />
          </div>
          <p className="text-2xl font-bold">{activeCampaigns.length}</p>
          <p className="text-xs text-muted-foreground">Active Campaigns</p>
        </Card>
        <Card className="p-5">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-success/10 text-success">
            <ExternalLink className="h-5 w-5" />
          </div>
          <p className="text-2xl font-bold">{user?.influencerProfile?.avgEngagementRate ?? 0}%</p>
          <p className="text-xs text-muted-foreground">Avg. Engagement Rate</p>
        </Card>
        <Card className="p-5">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10 text-warning">
            <Wallet className="h-5 w-5" />
          </div>
          <p className="text-2xl font-bold">{formatCurrency(totalCampaignEarnings)}</p>
          <p className="text-xs text-muted-foreground">Campaign Earnings</p>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3 lg:items-start">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardContent className="p-6">
              <div className="mb-1 flex items-center justify-between">
                <h3 className="text-base font-semibold">Profile Views</h3>
                <span className="text-xs text-muted-foreground">Last 30 days</span>
              </div>
              {loadingTrend ? (
                <Skeleton className="h-56 w-full" />
              ) : (
                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
                      <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} interval={4} />
                      <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12 }} width={30} allowDecimals={false} />
                      <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12, border: "1px solid hsl(var(--border))" }} />
                      <Line type="monotone" dataKey="views" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-base font-semibold">Active Campaigns</h3>
                <Link to="/campaigns" className="text-xs font-medium text-primary hover:underline">
                  Browse Campaigns
                </Link>
              </div>
              {loadingApplications ? (
                <div className="space-y-3">
                  {Array.from({ length: 2 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : !activeCampaigns.length ? (
                <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border py-10 text-center">
                  <Megaphone className="h-8 w-8 text-muted-foreground" />
                  <p className="text-sm font-medium">No active campaigns yet</p>
                  <Button variant="gradient" asChild size="sm" className="mt-1">
                    <Link to="/campaigns">Browse Campaigns</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {activeCampaigns.map((app) => {
                    const campaign = typeof app.job === "object" ? app.job : null;
                    const employerId = campaign && typeof campaign.employer === "object" ? campaign.employer._id : (campaign?.employer as string | undefined);
                    return (
                      <div key={app._id} className="flex items-start justify-between gap-3 rounded-lg border border-border p-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold">{campaign?.title ?? "Campaign"}</p>
                          <p className="mt-0.5 text-xs text-muted-foreground">{campaign?.companyName}</p>
                          {!!app.proposedRate && <p className="mt-1 text-xs font-medium text-success">{formatCurrency(app.proposedRate)}</p>}
                        </div>
                        {employerId && (
                          <Button variant="outline" size="sm" disabled={messageMutation.isPending} onClick={() => messageMutation.mutate(employerId)}>
                            <MessageSquare className="h-3.5 w-3.5" /> Chat
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h3 className="mb-4 text-base font-semibold">Your Platforms</h3>
              {platforms.length === 0 ? (
                <p className="text-sm text-muted-foreground">No platforms added yet — add them from your profile.</p>
              ) : (
                <div className="space-y-2">
                  {platforms.map((p, i) => (
                    <div key={i} className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm">
                      <div>
                        <Badge variant="outline">{p.platform}</Badge>
                        {p.handle && <span className="ml-2 text-muted-foreground">{p.handle}</span>}
                      </div>
                      <span className="text-xs font-medium text-muted-foreground">
                        {p.followers ? `${formatCompactNumber(p.followers)} followers` : ""}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {!!user?.portfolioItems?.length && (
            <Card>
              <CardContent className="p-6">
                <h3 className="mb-4 text-base font-semibold">Portfolio</h3>
                <PortfolioGrid items={user.portfolioItems} />
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6 lg:sticky lg:top-20 lg:self-start">
          <Card>
            <CardContent className="flex flex-col items-center gap-3 p-6 text-center">
              <Avatar className="h-16 w-16 border border-border">
                <AvatarImage src={user?.avatar} alt={user?.name} />
                <AvatarFallback className="text-lg">{user ? initialsFromName(user.name) : ""}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-semibold">{user?.name}</p>
                {user?.influencerProfile?.niche && (
                  <Badge variant="secondary" className="mt-1">
                    {user.influencerProfile.niche}
                  </Badge>
                )}
              </div>
              {user?.id && (
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link to={`/influencers/${user.id}`}>
                    <ExternalLink className="h-3.5 w-3.5" /> View Public Profile
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-base font-semibold">Recent Activity</h3>
              </div>
              {loadingNotifications ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : !notifications?.data.length ? (
                <p className="py-6 text-center text-sm text-muted-foreground">Nothing new yet.</p>
              ) : (
                <div className="space-y-1">
                  {notifications.data.slice(0, 5).map((n) => {
                    const Icon = ACTIVITY_ICON[n.type] ?? Bell;
                    return (
                      <Link key={n._id} to={n.link || "#"} className="flex items-start gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-accent">
                        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <Icon className="h-3.5 w-3.5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm">{n.title}</p>
                          <p className="text-[11px] text-muted-foreground">{timeAgo(n.createdAt)}</p>
                        </div>
                        {!n.isRead && <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />}
                      </Link>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-none bg-gradient-to-br from-primary to-secondary text-primary-foreground">
            <CardContent className="p-5 text-center">
              <Crown className="mx-auto h-6 w-6" />
              <p className="mt-2 text-sm font-semibold">Upgrade to Premium</p>
              <p className="mt-1 text-xs text-primary-foreground/80">Get priority visibility with brands looking for creators.</p>
              <Button size="sm" className="mt-3 w-full border-none bg-white text-primary hover:bg-white/90" asChild>
                <Link to="/pricing">
                  <Sparkles className="h-3.5 w-3.5" /> View Plans
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
