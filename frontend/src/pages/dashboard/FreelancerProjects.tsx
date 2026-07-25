import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Briefcase, CheckSquare, MessageSquare, Loader2 } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { jobApi } from "@/api/jobs";
import { chatApi } from "@/api/chat";
import { MilestonesPanel } from "@/components/jobs/MilestonesPanel";
import { WorkDiary } from "@/components/jobs/WorkDiary";
import { ContractPanel } from "@/components/jobs/ContractPanel";

// The subset of "My Applications" that's actually active/hired work — a
// quicker way to jump straight to contracts, milestones, and work diaries
// without scrolling past every applied/rejected application.
export default function FreelancerProjects() {
  const navigate = useNavigate();
  const { data: applications, isLoading } = useQuery({ queryKey: ["applications", "mine"], queryFn: jobApi.myApplications });
  const activeApplications = applications?.filter((app) => app.status === "hired") ?? [];

  const messageMutation = useMutation({
    mutationFn: (employerId: string) => chatApi.getOrCreateConversation(employerId),
    onSuccess: (conversation) => navigate(`/dashboard/messages?c=${conversation._id}`),
  });

  return (
    <DashboardLayout role="freelancer" title="My Projects" subtitle="Active work you've been hired for — contracts, milestones, and time tracking.">
      <Card>
        <CardContent className="p-6">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : activeApplications.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border py-12 text-center">
              <CheckSquare className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm font-medium">No active projects yet</p>
              <p className="max-w-sm text-xs text-muted-foreground">Once a client hires you, it'll show up here with the contract and milestones.</p>
              <Button variant="gradient" asChild size="sm" className="mt-1">
                <Link to="/jobs">
                  <Briefcase className="h-3.5 w-3.5" /> Browse Jobs
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {activeApplications.map((app) => {
                const job = typeof app.job === "object" ? app.job : null;
                const employerId = job && typeof job.employer === "object" ? job.employer._id : (job?.employer as string | undefined);
                const isProject = app.onModel === "Project";
                return (
                  <div key={app._id} className="rounded-lg border border-border p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate text-sm font-semibold">{job?.title ?? "Job"}</p>
                          <Badge variant="outline" className="shrink-0 text-[10px]">
                            {isProject ? "Project" : "Job"}
                          </Badge>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {job?.companyName} · {job?.location}
                        </p>
                      </div>
                      <Badge variant="success" className="shrink-0 capitalize">
                        {app.status}
                      </Badge>
                    </div>

                    {!!app.proposedRate && (
                      <div className="space-y-3">
                        <ContractPanel application={app} viewerRole="freelancer" />
                        <MilestonesPanel applicationId={app._id} readOnly />
                        <WorkDiary applicationId={app._id} hourlyRate={app.proposedRate} viewerRole="freelancer" />
                      </div>
                    )}

                    {employerId && (
                      <div className="mt-3">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={messageMutation.isPending}
                          onClick={() => messageMutation.mutate(employerId)}
                        >
                          {messageMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <MessageSquare className="h-3.5 w-3.5" />}
                          Message
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
