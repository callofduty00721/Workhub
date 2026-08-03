import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Briefcase, CheckSquare, MessageSquare, Loader2, FileText, Receipt, Calendar, Lock, Unlock } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FilterPills } from "@/components/shared/FilterPills";
import { jobApi } from "@/api/jobs";
import { chatApi } from "@/api/chat";
import { paymentApi } from "@/api/payments";
import { MilestonesPanel } from "@/components/jobs/MilestonesPanel";
import { WorkDiary } from "@/components/jobs/WorkDiary";
import { ContractPanel } from "@/components/jobs/ContractPanel";
import { formatCurrency } from "@/lib/utils";
import type { Payment } from "@/types";

// Active / Submitted / Revision Requested / Completed / Cancelled — joins a
// hired Application against its backing job_hire Payment (if any) for the
// order-lifecycle status. Milestone-based hires have no single such payment
// and fall back to "active" until milestones say otherwise.
type ProjectFilter = "all" | "active" | "submitted" | "revision_requested" | "completed" | "cancelled";

const PROJECT_FILTERS: { value: ProjectFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "submitted", label: "Submitted" },
  { value: "revision_requested", label: "Revision Requested" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

const PROJECT_STATUS_LABEL: Record<ProjectFilter, string> = {
  all: "All",
  active: "Active",
  submitted: "Submitted / Pending Review",
  revision_requested: "Revision Requested",
  completed: "Completed",
  cancelled: "Cancelled",
};

const PROJECT_STATUS_VARIANT: Record<Exclude<ProjectFilter, "all">, "default" | "warning" | "success" | "danger"> = {
  active: "default",
  submitted: "warning",
  revision_requested: "warning",
  completed: "success",
  cancelled: "danger",
};

function computeProjectStatus(payment: Payment | undefined): Exclude<ProjectFilter, "all"> {
  if (payment?.status === "refunded" || payment?.status === "partially_refunded") return "cancelled";
  if (payment?.orderStatus === "completed") return "completed";
  if (payment?.orderStatus === "revision_requested") return "revision_requested";
  if (payment?.orderStatus === "delivered") return "submitted";
  return "active";
}

export default function FreelancerProjects() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<ProjectFilter>("all");

  const { data: applications, isLoading: applicationsLoading } = useQuery({ queryKey: ["applications", "mine"], queryFn: jobApi.myApplications });
  const { data: earnings, isLoading: loadingPayments } = useQuery({
    queryKey: ["payments", "earnings", { page: 1, limit: 200 }],
    queryFn: () => paymentApi.myEarnings({ page: 1, limit: 200 }),
  });

  const allProjects = applications?.filter((app) => app.status === "hired") ?? [];

  const paymentByApplication = new Map<string, Payment>();
  for (const p of earnings?.payments ?? []) {
    if (p.type === "job_hire" && p.application) paymentByApplication.set(p.application, p);
  }

  const messageMutation = useMutation({
    mutationFn: (employerId: string) => chatApi.getOrCreateConversation(employerId),
    onSuccess: (conversation) => navigate(`/dashboard/messages?c=${conversation._id}`),
  });

  const isLoading = applicationsLoading || loadingPayments;
  const projectsWithStatus = allProjects.map((app) => {
    const payment = paymentByApplication.get(app._id);
    return { app, payment, status: computeProjectStatus(payment) };
  });
  const filtered = projectsWithStatus.filter((p) => filter === "all" || p.status === filter);

  return (
    <DashboardLayout role="freelancer" title="Projects" subtitle="Active and past work you've been hired for.">
      <Card>
        <CardContent className="p-6">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : allProjects.length === 0 ? (
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
            <>
              <FilterPills options={PROJECT_FILTERS} value={filter} onChange={setFilter} />
              {!filtered.length ? (
                <p className="py-6 text-center text-sm text-muted-foreground">No projects with this status.</p>
              ) : (
                <div className="space-y-3">
                  {filtered.map(({ app, payment, status }) => {
                    const job = typeof app.job === "object" ? app.job : null;
                    const client = payment && typeof payment.payer === "object" ? payment.payer.name : job?.companyName;
                    const employerId = job && typeof job.employer === "object" ? job.employer._id : (job?.employer as string | undefined);
                    const isProject = app.onModel === "Project";
                    return (
                      <div key={app._id} className="rounded-lg border border-border p-4">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="truncate text-sm font-semibold">{job?.title ?? "Job"}</p>
                              <Badge variant="outline" className="shrink-0 text-[10px]">
                                {isProject ? "Project" : "Job"}
                              </Badge>
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">Client: {client ?? "—"}</p>
                            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                              {!!(payment?.amount || app.proposedRate) && <span>Budget: {formatCurrency(payment?.amount || app.proposedRate || 0)}</span>}
                              {payment?.deadline && (
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" /> Deadline: {new Date(payment.deadline).toLocaleDateString()}
                                </span>
                              )}
                              {payment && (
                                <span className="flex items-center gap-1">
                                  {payment.escrowStatus === "held" ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
                                  {payment.escrowStatus === "held" ? "Payment in escrow" : "Payment released"}
                                </span>
                              )}
                            </div>
                          </div>
                          <Badge variant={PROJECT_STATUS_VARIANT[status]} className="shrink-0">
                            {PROJECT_STATUS_LABEL[status]}
                          </Badge>
                        </div>

                        {!!payment?.deliverables?.length && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {payment.deliverables.map((d, i) => (
                              <a
                                key={i}
                                href={d.url}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1 text-xs text-primary hover:underline"
                              >
                                <FileText className="h-3.5 w-3.5" /> {d.name || `File ${i + 1}`}
                              </a>
                            ))}
                          </div>
                        )}

                        {!!app.proposedRate && (
                          <div className="mt-3 space-y-3">
                            <ContractPanel application={app} viewerRole="freelancer" />
                            <MilestonesPanel applicationId={app._id} readOnly />
                            <WorkDiary applicationId={app._id} hourlyRate={app.proposedRate} viewerRole="freelancer" />
                          </div>
                        )}

                        <div className="mt-3 flex flex-wrap gap-2">
                          {employerId && (
                            <Button variant="outline" size="sm" disabled={messageMutation.isPending} onClick={() => messageMutation.mutate(employerId)}>
                              {messageMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <MessageSquare className="h-3.5 w-3.5" />}
                              Chat
                            </Button>
                          )}
                          {payment && (
                            <Button variant="outline" size="sm" asChild>
                              <Link to={`/payments/${payment._id}/invoice`} target="_blank">
                                <Receipt className="h-3.5 w-3.5" /> Invoice
                              </Link>
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
