import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { ArrowLeft, Mail, MapPin, MessageSquare, CreditCard, CheckCircle2, Lock, Unlock, Loader2, ShieldCheck, Eye, FileText } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { jobApi } from "@/api/jobs";
import { projectApi } from "@/api/projects";
import { chatApi } from "@/api/chat";
import { paymentApi } from "@/api/payments";
import { payWithRazorpay } from "@/lib/razorpay";
import { MilestonesPanel } from "@/components/jobs/MilestonesPanel";
import { WorkDiary } from "@/components/jobs/WorkDiary";
import { ContractPanel } from "@/components/jobs/ContractPanel";
import { useAuth } from "@/context/AuthContext";
import { initialsFromName, formatCurrency } from "@/lib/utils";
import type { ApplicationStatus, Job, Project } from "@/types";

const STATUSES: ApplicationStatus[] = ["applied", "shortlisted", "interview", "hired", "rejected"];

const STATUS_VARIANT: Record<ApplicationStatus, "default" | "warning" | "success" | "danger"> = {
  applied: "default",
  shortlisted: "warning",
  interview: "warning",
  hired: "success",
  rejected: "danger",
  withdrawn: "danger",
};

export default function JobApplicants({
  role = "employer",
  basePath = "/dashboard/employer",
  source = "job",
}: {
  role?: "employer" | "client";
  basePath?: string;
  // Which posting type this page is managing applicants for — Job (employer)
  // or Project (client) — since they're now separate collections/endpoints.
  source?: "job" | "project";
}) {
  const { id = "" } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [payError, setPayError] = useState<string | null>(null);
  const api = source === "project" ? projectApi : jobApi;
  const queryKeyPrefix = source === "project" ? "projects" : "jobs";

  const { data: job } = useQuery<Job | Project>({ queryKey: [queryKeyPrefix, id], queryFn: () => api.getById(id), enabled: !!id });
  const { data: applications, isLoading } = useQuery({
    queryKey: [queryKeyPrefix, id, "applications"],
    queryFn: () => api.applications(id),
    enabled: !!id,
  });
  const isConfidential = job?.visibility === "invite_only" || job?.requiresNda;
  const { data: accessLog } = useQuery({
    queryKey: [queryKeyPrefix, id, "access-log"],
    queryFn: () => api.accessLog(id),
    enabled: !!id && !!isConfidential,
  });

  const { data: myPayments } = useQuery({ queryKey: ["payments", "mine", "all"], queryFn: () => paymentApi.myPayments({ limit: 200 }) });
  // Only the single full-amount payment (no milestone ref) counts here — a
  // milestone payment also carries the application id, but that's a partial
  // payment and shouldn't make this look like the whole application was paid.
  const paymentByApplication = new Map(
    (myPayments?.data ?? [])
      .filter((p) => p.type === "job_hire" && p.status === "paid" && !p.milestone)
      .map((p) => [p.application, p])
  );

  const statusMutation = useMutation({
    mutationFn: ({ applicationId, status }: { applicationId: string; status: ApplicationStatus }) =>
      jobApi.updateApplicationStatus(applicationId, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [queryKeyPrefix, id, "applications"] }),
  });

  const messageMutation = useMutation({
    mutationFn: (applicantId: string) => chatApi.getOrCreateConversation(applicantId),
    onSuccess: (conversation) => navigate(`/dashboard/messages?c=${conversation._id}`),
  });

  const payMutation = useMutation({
    mutationFn: async ({ applicationId, applicantName }: { applicationId: string; applicantName: string }) => {
      await payWithRazorpay({
        createOrder: () => paymentApi.createJobHirePayment(applicationId),
        verify: (payload) => paymentApi.verifyMarketplacePayment(payload),
        description: `Payment to ${applicantName}`,
        prefill: { name: user!.name, email: user!.email },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["payments", "mine"] }),
      });
    },
    onError: (err) => setPayError(isAxiosError(err) ? err.response?.data?.message || "Payment failed" : "Payment gateway unavailable"),
  });

  const releaseMutation = useMutation({
    mutationFn: (paymentId: string) => paymentApi.releasePayment(paymentId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["payments", "mine"] }),
    onError: (err) => setPayError(isAxiosError(err) ? err.response?.data?.message || "Failed to release payment" : "Something went wrong"),
  });

  return (
    <DashboardLayout role={role} title={job ? `Applicants for ${job.title}` : "Applicants"} subtitle="Review and manage candidates who applied.">
      <Button variant="ghost" size="sm" asChild className="mb-4">
        <Link to={basePath}>
          <ArrowLeft className="h-3.5 w-3.5" /> Back to My {source === "project" ? "Projects" : "Jobs"}
        </Link>
      </Button>

      {payError && (
        <div className="mb-4 rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">{payError}</div>
      )}

      {isConfidential && (
        <Card className="mb-4">
          <CardContent className="p-5">
            <h3 className="mb-3 flex items-center gap-1.5 text-sm font-semibold">
              <ShieldCheck className="h-4 w-4 text-primary" /> Access Log
            </h3>
            {!accessLog?.length ? (
              <p className="text-xs text-muted-foreground">No access recorded yet — views and NDA acceptances will show up here.</p>
            ) : (
              <div className="max-h-56 space-y-2 overflow-y-auto">
                {accessLog.map((log) => {
                  const logUser = typeof log.user === "object" ? log.user : null;
                  return (
                    <div key={log._id} className="flex items-center justify-between gap-2 text-xs">
                      <span className="flex items-center gap-1.5 text-foreground">
                        {log.action === "accepted_nda" ? (
                          <ShieldCheck className="h-3 w-3 text-success" />
                        ) : log.action === "viewed_attachment" ? (
                          <FileText className="h-3 w-3 text-muted-foreground" />
                        ) : (
                          <Eye className="h-3 w-3 text-muted-foreground" />
                        )}
                        {logUser?.name ?? "Unknown"}{" "}
                        <span className="text-muted-foreground">
                          {log.action === "accepted_nda" ? "accepted the NDA" : log.action === "viewed_attachment" ? `opened ${log.attachmentName}` : "viewed details"}
                        </span>
                      </span>
                      <span className="shrink-0 text-muted-foreground">{new Date(log.createdAt).toLocaleString()}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : !applications?.length ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
            <p className="text-sm font-medium">No applicants yet</p>
            <p className="text-sm text-muted-foreground">Once candidates apply, they&apos;ll show up here.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {applications.map((app) => {
            const applicant = typeof app.applicant === "object" ? app.applicant : null;
            return (
              <Card key={app._id}>
                <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary text-sm font-semibold text-white">
                      {applicant ? initialsFromName(applicant.name) : "?"}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">{applicant?.name}</p>
                      {applicant?.headline && <p className="text-xs text-muted-foreground">{applicant.headline}</p>}
                      <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        {applicant?.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" /> {applicant.email}
                          </span>
                        )}
                        {applicant?.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" /> {applicant.location}
                          </span>
                        )}
                      </div>
                      {(!!app.proposedRate || !!app.deliveryDays) && (
                        <p className="mt-1.5 text-xs font-medium text-foreground/80">
                          {!!app.proposedRate && <>Bid: {formatCurrency(app.proposedRate)}</>}
                          {!!app.proposedRate && !!app.deliveryDays && " · "}
                          {!!app.deliveryDays && <>{app.deliveryDays} day delivery</>}
                        </p>
                      )}
                      {app.coverLetter && <p className="mt-2 line-clamp-2 max-w-md text-xs text-foreground/80">{app.coverLetter}</p>}
                      {applicant && app.status === "hired" && !!app.proposedRate && (
                        <div className="max-w-md space-y-3">
                          <ContractPanel application={app} viewerRole="employer" />
                          <MilestonesPanel
                            applicationId={app._id}
                            freelancerName={applicant.name}
                            contractSigned={!!app.contract?.employerSignedAt && !!app.contract?.freelancerSignedAt}
                          />
                          <WorkDiary applicationId={app._id} hourlyRate={app.proposedRate} freelancerName={applicant.name} viewerRole="client" />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    {applicant && (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={messageMutation.isPending}
                        onClick={() => messageMutation.mutate(applicant._id)}
                      >
                        {messageMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <MessageSquare className="h-3.5 w-3.5" />}
                        Message
                      </Button>
                    )}
                    {applicant &&
                      app.status === "hired" &&
                      !!app.proposedRate &&
                      (() => {
                        const payment = paymentByApplication.get(app._id);
                        const bothSigned = !!app.contract?.employerSignedAt && !!app.contract?.freelancerSignedAt;
                        if (!payment) {
                          return (
                            <Button
                              variant="gradient"
                              size="sm"
                              disabled={payMutation.isPending || !bothSigned}
                              title={!bothSigned ? "Both parties must sign the contract first" : undefined}
                              onClick={() => payMutation.mutate({ applicationId: app._id, applicantName: applicant.name })}
                            >
                              {payMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CreditCard className="h-3.5 w-3.5" />}
                              Pay {formatCurrency(app.proposedRate)}
                            </Button>
                          );
                        }
                        if (payment.escrowStatus === "held") {
                          return (
                            <>
                              <Badge variant="warning" className="flex items-center gap-1 text-[10px]">
                                <Lock className="h-3 w-3" /> In Escrow
                              </Badge>
                              <Button
                                variant="gradient"
                                size="sm"
                                disabled={releaseMutation.isPending}
                                onClick={() => releaseMutation.mutate(payment._id)}
                              >
                                {releaseMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Unlock className="h-3.5 w-3.5" />}
                                Approve & Release
                              </Button>
                            </>
                          );
                        }
                        return (
                          <Badge variant="success" className="flex items-center gap-1 text-[10px]">
                            <CheckCircle2 className="h-3 w-3" /> Paid & Released
                          </Badge>
                        );
                      })()}
                    <Badge variant={STATUS_VARIANT[app.status]} className="capitalize">
                      {app.status}
                    </Badge>
                    <Select
                      value={app.status}
                      onValueChange={(status) => statusMutation.mutate({ applicationId: app._id, status: status as ApplicationStatus })}
                      disabled={app.status === "withdrawn"}
                    >
                      <SelectTrigger className="w-40">
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
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
}
