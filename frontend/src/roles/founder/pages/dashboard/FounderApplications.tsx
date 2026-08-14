import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Mail, FileText } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { teamApplicationApi } from "@/api/teamApplications";
import { useFounderTeamApplications } from "@/hooks/useFounderTeamApplications";
import { initialsFromName } from "@/lib/utils";
import type { TeamApplicationStatus } from "@/types";

const STATUSES: TeamApplicationStatus[] = ["pending", "reviewing", "accepted", "rejected"];
const STATUS_VARIANT: Record<TeamApplicationStatus, "default" | "warning" | "success" | "danger"> = {
  pending: "default",
  reviewing: "warning",
  accepted: "success",
  rejected: "danger",
};
const TABS = ["All", "Pending", "Reviewing", "Accepted", "Rejected"] as const;

export default function FounderApplications() {
  const queryClient = useQueryClient();
  const { applications, isLoading, pendingCount } = useFounderTeamApplications();
  const [tab, setTab] = useState<(typeof TABS)[number]>("All");

  const statusMutation = useMutation({
    mutationFn: (variables: { applicationId: string; status: TeamApplicationStatus; startupId: string }) =>
      teamApplicationApi.updateStatus(variables.applicationId, variables.status),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["startups", variables.startupId, "team-applications"] });
    },
  });

  const filtered = tab === "All" ? applications : applications.filter((a) => a.status === tab.toLowerCase());

  return (
    <DashboardLayout
      role="founder"
      title="Team Applications"
      subtitle={pendingCount > 0 ? `${pendingCount} application${pendingCount > 1 ? "s" : ""} waiting for your review.` : "Review people who applied to join your startups."}
    >
      <div className="mb-4 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
              tab === t ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-accent"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : !filtered.length ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
            <p className="text-sm font-medium">No applications here yet</p>
            <p className="text-sm text-muted-foreground">
              Applications from people applying to your open roles will show up here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((app) => (
            <Card key={app._id}>
              <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex min-w-0 items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white">
                    {app.applicant.avatar ? (
                      <img src={app.applicant.avatar} alt="" className="h-full w-full rounded-full object-cover" />
                    ) : (
                      initialsFromName(app.applicant.name)
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">{app.applicant.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Applied for <span className="font-medium text-foreground">{app.roleTitle}</span>
                      {app.isCustomRole && " (suggested role)"} on{" "}
                      <Link to={`/startups/${app.startup}`} className="text-primary hover:underline">
                        {app.startupName}
                      </Link>
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      {app.applicant.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" /> {app.applicant.email}
                        </span>
                      )}
                      {app.resumeUrl && (
                        <a href={app.resumeUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-primary hover:underline">
                          <FileText className="h-3 w-3" /> Resume
                        </a>
                      )}
                      <span>{new Date(app.createdAt).toLocaleDateString()}</span>
                    </div>
                    {app.bio && <p className="mt-2 max-w-lg text-xs text-foreground/80">{app.bio}</p>}
                    {app.experience && <p className="mt-1 max-w-lg text-xs text-muted-foreground">Experience: {app.experience}</p>}
                    {app.skills.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {app.skills.map((s) => (
                          <Badge key={s} variant="outline" className="text-[11px]">
                            {s}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-3">
                  <Badge variant={STATUS_VARIANT[app.status]} className="capitalize">
                    {app.status}
                  </Badge>
                  <Select
                    value={app.status}
                    onValueChange={(status) =>
                      statusMutation.mutate({ applicationId: app._id, status: status as TeamApplicationStatus, startupId: app.startup })
                    }
                  >
                    <SelectTrigger className="w-36">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUSES.map((s) => (
                        <SelectItem key={s} value={s} className="capitalize">
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
