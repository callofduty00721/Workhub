import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Briefcase, ClipboardList, MessageSquare, X, Loader2 } from "lucide-react";
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

const WITHDRAWABLE: ApplicationStatus[] = ["applied", "shortlisted", "interview"];

export default function FreelancerApplications() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: applications, isLoading } = useQuery({ queryKey: ["applications", "mine"], queryFn: jobApi.myApplications });

  const withdrawMutation = useMutation({
    mutationFn: (applicationId: string) => jobApi.withdraw(applicationId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["applications", "mine"] }),
  });

  const messageMutation = useMutation({
    mutationFn: (employerId: string) => chatApi.getOrCreateConversation(employerId),
    onSuccess: (conversation) => navigate(`/dashboard/messages?c=${conversation._id}`),
  });

  return (
    <DashboardLayout
      role="freelancer"
      title="My Applications"
      subtitle="Track jobs you've applied to and proposals you've sent for freelance projects."
      actions={
        <Button variant="gradient" asChild>
          <Link to="/jobs">
            <Briefcase className="h-4 w-4" /> Find More Jobs
          </Link>
        </Button>
      }
    >
      <Card>
        <CardContent className="p-6">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : !applications?.length ? (
            <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border py-12 text-center">
              <ClipboardList className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm font-medium">You haven&apos;t applied to any jobs yet</p>
              <Button variant="gradient" asChild size="sm" className="mt-1">
                <Link to="/jobs">Browse Jobs</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {applications.map((app) => {
                const job = typeof app.job === "object" ? app.job : null;
                const employerId = job && typeof job.employer === "object" ? job.employer._id : (job?.employer as string | undefined);
                const isProposal = app.onModel === "Project";
                return (
                  <div key={app._id} className="rounded-lg border border-border p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate text-sm font-semibold">{job?.title ?? "Job"}</p>
                          <Badge variant="outline" className="shrink-0 text-[10px]">
                            {isProposal ? "Project" : "Job"}
                          </Badge>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {job?.companyName} · {job?.location}
                        </p>
                        {(!!app.proposedRate || !!app.deliveryDays) && (
                          <p className="mt-1.5 text-xs font-medium text-foreground/80">
                            {!!app.proposedRate && <>Your bid: {formatCurrency(app.proposedRate)}</>}
                            {!!app.proposedRate && !!app.deliveryDays && " · "}
                            {!!app.deliveryDays && <>{app.deliveryDays} day delivery</>}
                          </p>
                        )}
                      </div>
                      <Badge variant={STATUS_VARIANT[app.status]} className="shrink-0 capitalize">
                        {app.status}
                      </Badge>
                    </div>

                    {app.status === "hired" && !!app.proposedRate && (
                      <div className="space-y-3">
                        <ContractPanel application={app} viewerRole="freelancer" />
                        <MilestonesPanel applicationId={app._id} readOnly />
                        <WorkDiary applicationId={app._id} hourlyRate={app.proposedRate} viewerRole="freelancer" />
                      </div>
                    )}

                    <div className="mt-3 flex flex-wrap gap-2">
                      {employerId && (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={messageMutation.isPending}
                          onClick={() => messageMutation.mutate(employerId)}
                        >
                          {messageMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <MessageSquare className="h-3.5 w-3.5" />}
                          Message
                        </Button>
                      )}
                      {WITHDRAWABLE.includes(app.status) && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-danger hover:bg-danger/10"
                          disabled={withdrawMutation.isPending}
                          onClick={() => withdrawMutation.mutate(app._id)}
                        >
                          <X className="h-3.5 w-3.5" /> Withdraw
                        </Button>
                      )}
                    </div>
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
