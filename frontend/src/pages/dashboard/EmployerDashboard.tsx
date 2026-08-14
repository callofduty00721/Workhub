import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Briefcase, ClipboardList, Plus, Users, Eye, Wallet, UserCheck, Handshake } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/context/AuthContext";
import { VerificationBanner } from "@/components/shared/VerificationBanner";
import { jobApi } from "@/api/jobs";
import { projectApi } from "@/api/projects";
import { campaignApi } from "@/api/campaigns";
import { agencyClientApi } from "@/api/agencyClients";
import { talentRosterApi } from "@/api/talentRoster";
import { formatCurrency } from "@/lib/utils";
import type { ApplicationStatus, Job, Project, Campaign } from "@/types";

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
  role?: "employer" | "client" | "brand" | "agency" | "talent_partner";
  basePath?: string;
  entityLabel?: "Job" | "Project" | "Campaign";
  source?: "job" | "project" | "campaign";
}) {
  const { user } = useAuth();
  const isCampaign = source === "campaign";
  const routeSegment = source === "project" ? "projects" : source === "campaign" ? "campaigns" : "jobs";
  const postPath = isCampaign ? `${basePath}/post-campaign` : `${basePath}/post-job`;
  const { data: jobs, isLoading } = useQuery<(Job | Project | Campaign)[]>({
    queryKey: [routeSegment, "mine"],
    queryFn: () => (source === "project" ? projectApi.mine() : isCampaign ? campaignApi.mine() : jobApi.mine()),
  });
  const { data: analytics } = useQuery<{
    totalViews: number;
    totalApplications: number;
    byStatus: Partial<Record<ApplicationStatus, number>>;
    totalSpent?: number;
    hiredInfluencersCount?: number;
  }>({
    queryKey: [routeSegment, "analytics", "mine"],
    queryFn: () => (source === "project" ? projectApi.myAnalytics() : isCampaign ? campaignApi.myAnalytics() : jobApi.myAnalytics()),
  });

  // Only one of these three is ever non-empty for a given role — each query
  // just stays idle (enabled: false) for the other two roles.
  const { data: myAgencies } = useQuery({
    queryKey: ["agency-clients", "mine"],
    queryFn: agencyClientApi.mine,
    enabled: role === "brand",
  });
  const { data: myClients } = useQuery({
    queryKey: ["agency-clients", "managed"],
    queryFn: agencyClientApi.managed,
    enabled: role === "agency",
  });
  const { data: myRoster } = useQuery({
    queryKey: ["talent-roster", "mine"],
    queryFn: talentRosterApi.mine,
    enabled: role === "agency" || role === "talent_partner",
  });

  const totalApplicants = jobs?.reduce((sum, j) => sum + j.applicationsCount, 0) ?? 0;
  const openJobs = jobs?.filter((j) => j.status === "open").length ?? 0;

  // One flat list so every stat card sits in a single row instead of
  // wrapping into a visually separate second block — count varies by role
  // (4 for job/project, up to 7 for brand/agency), so the column count below
  // is picked to match rather than hardcoded.
  const stats = [
    { icon: Briefcase, color: "text-primary bg-primary/10", value: jobs?.length ?? 0, label: `Total ${entityLabel}s Posted` },
    { icon: ClipboardList, color: "text-success bg-success/10", value: openJobs, label: `Open ${entityLabel}s` },
    { icon: Users, color: "text-secondary bg-secondary/10", value: totalApplicants, label: "Total Applicants" },
    { icon: Eye, color: "text-warning bg-warning/10", value: analytics?.totalViews ?? 0, label: "Total Views" },
    // Campaign-only — real numbers a brand/agency/talent_partner can't get
    // anywhere else on their dashboard (see getMyCampaignAnalytics/
    // agencyClientApi/talentRosterApi — nothing here is estimated or cached).
    ...(isCampaign
      ? [
          { icon: Wallet, color: "text-success bg-success/10", value: formatCurrency(analytics?.totalSpent ?? 0), label: "Total Spent" },
          { icon: UserCheck, color: "text-primary bg-primary/10", value: analytics?.hiredInfluencersCount ?? 0, label: "Hired Influencers" },
          ...(role === "brand" ? [{ icon: Handshake, color: "text-secondary bg-secondary/10", value: myAgencies?.length ?? 0, label: "My Agencies" }] : []),
          ...(role === "agency" ? [{ icon: Handshake, color: "text-secondary bg-secondary/10", value: myClients?.length ?? 0, label: "My Clients" }] : []),
          ...(role === "agency" || role === "talent_partner"
            ? [{ icon: Users, color: "text-warning bg-warning/10", value: myRoster?.length ?? 0, label: "Roster" }]
            : []),
        ]
      : []),
  ];
  // Tailwind needs literal class names (not a template string) to pick them
  // up — same lookup pattern as DirectoryCard's STATS_GRID_COLS.
  const STATS_GRID_LG_COLS: Record<number, string> = {
    4: "lg:grid-cols-4",
    5: "lg:grid-cols-5",
    6: "lg:grid-cols-6",
    7: "lg:grid-cols-7",
  };

  return (
    <DashboardLayout
      role={role}
      title={`Welcome back, ${user?.name.split(" ")[0]} 👋`}
      subtitle={`Manage your ${entityLabel.toLowerCase()} postings and applicants.`}
      actions={
        <Button variant="gradient" asChild>
          <Link to={postPath}>
            <Plus className="h-4 w-4" /> Post a {entityLabel}
          </Link>
        </Button>
      }
    >
      <VerificationBanner />
      <div className={`grid gap-5 sm:grid-cols-2 ${STATS_GRID_LG_COLS[stats.length] ?? "lg:grid-cols-4"}`}>
        {stats.map(({ icon: Icon, color, value, label }) => (
          <Card key={label} className="p-5">
            <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-lg ${color}`}>
              <Icon className="h-5 w-5" />
            </div>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </Card>
        ))}
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
                <Link to={postPath}>Post Your First {entityLabel}</Link>
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
