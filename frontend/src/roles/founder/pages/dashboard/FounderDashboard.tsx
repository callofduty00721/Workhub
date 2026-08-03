import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Eye, Handshake, Heart, MessageSquare, Rocket, ArrowRight, Plus, ClipboardList } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/context/AuthContext";
import { VerificationBanner } from "@/components/shared/VerificationBanner";
import { startupApi } from "@/api/startups";
import { chatApi } from "@/api/chat";
import { investorApi } from "@/api/investors";
import { mentorApi } from "@/api/mentors";
import { partnerApi } from "@/api/partners";
import { useFounderTeamApplications } from "@/hooks/useFounderTeamApplications";
import { formatCompactNumber } from "@/lib/utils";

const NEXT_STEPS = [
  { title: "Complete your startup profile", desc: "Add more details to improve visibility", icon: Rocket },
  { title: "Review team applications", desc: "Respond to people who want to join you", icon: ClipboardList },
  { title: "Connect with investors", desc: "Find the right investors for you", icon: Heart },
];

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  draft: { label: "Draft", className: "bg-muted text-muted-foreground" },
  pending_review: { label: "Pending Review", className: "bg-warning/10 text-warning" },
  published: { label: "Published", className: "bg-success/10 text-success" },
};

export default function FounderDashboard() {
  const { user } = useAuth();
  const { data: myStartups, isLoading } = useQuery({ queryKey: ["startups", "mine"], queryFn: startupApi.mine });
  const { data: conversations } = useQuery({ queryKey: ["chat", "conversations"], queryFn: chatApi.conversations });
  const { applications, pendingCount } = useFounderTeamApplications();

  const { data: investorTotal } = useQuery({
    queryKey: ["investors", "total"],
    queryFn: () => investorApi.list({ limit: 1 }).then((r) => r.pagination.total),
  });
  const { data: mentorTotal } = useQuery({
    queryKey: ["mentors", "total"],
    queryFn: () => mentorApi.list({ limit: 1 }).then((r) => r.pagination.total),
  });
  const { data: partnerTotal } = useQuery({
    queryKey: ["partners", "total"],
    queryFn: () => partnerApi.list({ limit: 1 }).then((r) => r.pagination.total),
  });

  const totalViews = (myStartups ?? []).reduce((sum, s) => sum + s.viewCount, 0);
  const totalFollowers = (myStartups ?? []).reduce((sum, s) => sum + s.followers.length, 0);
  const totalInterested = (myStartups ?? []).reduce((sum, s) => sum + s.interested.length, 0);
  const totalOpenRoles = (myStartups ?? []).reduce((sum, s) => sum + (s.openRoles?.length ?? 0), 0);
  const conversationCount = conversations?.length ?? 0;

  const METRICS = [
    { label: "Total Views", value: formatCompactNumber(totalViews), icon: Eye, color: "text-primary bg-primary/10" },
    { label: "Followers", value: formatCompactNumber(totalFollowers), icon: Handshake, color: "text-secondary bg-secondary/10" },
    { label: "Interested", value: formatCompactNumber(totalInterested), icon: Heart, color: "text-danger bg-danger/10" },
    { label: "Conversations", value: formatCompactNumber(conversationCount), icon: MessageSquare, color: "text-success bg-success/10" },
  ];

  const recentActivity = [
    ...applications.slice(0, 5).map((a) => ({
      text: `${a.applicant.name} applied for ${a.roleTitle} on ${a.startupName}`,
      time: new Date(a.createdAt),
    })),
    ...(conversations ?? []).slice(0, 5).map((c) => ({
      text: `New message: ${c.lastMessage || "Conversation started"}`,
      time: new Date(c.lastMessageAt),
    })),
  ]
    .sort((a, b) => b.time.getTime() - a.time.getTime())
    .slice(0, 5);

  const primaryStartup = myStartups?.[0];

  return (
    <DashboardLayout
      role="founder"
      title={`Welcome back, ${user?.name.split(" ")[0]} 👋`}
      subtitle="Here's what's happening with your startup today."
      actions={
        <Button variant="gradient" asChild>
          <Link to="/dashboard/founder/startup">
            <Plus className="h-4 w-4" /> New Startup
          </Link>
        </Button>
      }
    >
      <VerificationBanner />
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {METRICS.map((m) => (
          <Card key={m.label} className="p-5">
            <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-lg ${m.color}`}>
              <m.icon className="h-5 w-5" />
            </div>
            <p className="text-2xl font-bold">{m.value}</p>
            <p className="text-xs text-muted-foreground">{m.label}</p>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardContent className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-semibold">My Startups</h3>
              <div className="flex items-center gap-3">
                {!!myStartups?.length && (
                  <Link to="/dashboard/founder/startups" className="text-xs font-medium text-primary hover:underline">
                    View All
                  </Link>
                )}
                <Button variant="outline" size="sm" asChild>
                  <Link to="/dashboard/founder/startup">
                    <Plus className="h-3.5 w-3.5" /> New Startup
                  </Link>
                </Button>
              </div>
            </div>
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-6 w-1/3" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            ) : primaryStartup ? (
              <div className="flex flex-col gap-4 sm:flex-row">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-secondary text-xl font-bold text-white">
                  {primaryStartup.name[0]}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">{primaryStartup.name}</p>
                    <Badge className={STATUS_LABELS[primaryStartup.status]?.className}>{STATUS_LABELS[primaryStartup.status]?.label}</Badge>
                    <Badge variant="secondary" className="capitalize">
                      {primaryStartup.stage.replace("_", " ")}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{primaryStartup.tagline}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Badge variant="outline">{primaryStartup.industry}</Badge>
                    <Badge variant="outline">{primaryStartup.location}</Badge>
                  </div>
                  {myStartups && myStartups.length > 1 && (
                    <p className="mt-2 text-xs text-muted-foreground">+{myStartups.length - 1} more startup{myStartups.length - 1 > 1 ? "s" : ""}</p>
                  )}
                </div>
                <Button variant="outline" size="sm" asChild className="self-start">
                  <Link to={`/startups/${primaryStartup._id}`}>View</Link>
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border py-10 text-center">
                <Rocket className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm font-medium">You haven&apos;t posted a startup yet</p>
                <p className="max-w-xs text-sm text-muted-foreground">
                  Share your idea and start connecting with investors, mentors and partners.
                </p>
                <Button variant="gradient" asChild size="sm" className="mt-1">
                  <Link to="/dashboard/founder/startup">Post Your Startup</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h3 className="mb-4 text-base font-semibold">Next Steps</h3>
            <div className="space-y-4">
              {NEXT_STEPS.map((step) => (
                <div key={step.title} className="flex items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <step.icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{step.title}</p>
                    <p className="text-xs text-muted-foreground">{step.desc}</p>
                  </div>
                  <ArrowRight className="mt-1 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardContent className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-semibold">Recent Activity</h3>
              {pendingCount > 0 && (
                <Link to="/dashboard/founder/applications" className="text-xs font-medium text-primary hover:underline">
                  {pendingCount} pending
                </Link>
              )}
            </div>
            {recentActivity.length === 0 ? (
              <p className="text-sm text-muted-foreground">No activity yet — it'll show up here once people start engaging with your startups.</p>
            ) : (
              <div className="space-y-4">
                {recentActivity.map((a, i) => (
                  <div key={i} className="flex items-start justify-between gap-4 text-sm">
                    <p className="text-foreground/90">{a.text}</p>
                    <span className="shrink-0 text-xs text-muted-foreground">{a.time.toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h3 className="mb-4 text-base font-semibold">Connect &amp; Grow</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Investors", count: investorTotal, to: "/investors" },
                { label: "Mentors", count: mentorTotal, to: "/mentors" },
                { label: "Partners", count: partnerTotal, to: "/partners" },
                { label: "Your Open Roles", count: totalOpenRoles, to: "/dashboard/founder/startups" },
              ].map((c) => (
                <Link key={c.label} to={c.to} className="rounded-lg border border-border p-3.5 transition-colors hover:bg-accent">
                  <p className="text-lg font-bold">{c.count === undefined ? <Skeleton className="h-6 w-10" /> : formatCompactNumber(c.count)}</p>
                  <p className="text-xs text-muted-foreground">{c.label}</p>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
