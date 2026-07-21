import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { ArrowLeft, Mail, MapPin, MessageSquare, CreditCard, CheckCircle2, Loader2 } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { jobApi } from "@/api/jobs";
import { chatApi } from "@/api/chat";
import { paymentApi } from "@/api/payments";
import { payWithRazorpay } from "@/lib/razorpay";
import { useAuth } from "@/context/AuthContext";
import { initialsFromName, formatCurrency } from "@/lib/utils";
import type { ApplicationStatus } from "@/types";

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
}: {
  role?: "employer" | "client";
  basePath?: string;
}) {
  const { id = "" } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [payError, setPayError] = useState<string | null>(null);

  const { data: job } = useQuery({ queryKey: ["jobs", id], queryFn: () => jobApi.getById(id), enabled: !!id });
  const { data: applications, isLoading } = useQuery({
    queryKey: ["jobs", id, "applications"],
    queryFn: () => jobApi.applications(id),
    enabled: !!id,
  });

  const { data: myPayments } = useQuery({ queryKey: ["payments", "mine", "all"], queryFn: () => paymentApi.myPayments({ limit: 200 }) });
  const paidApplicationIds = new Set(
    (myPayments?.data ?? []).filter((p) => p.type === "job_hire" && p.status === "paid").map((p) => p.application)
  );

  const statusMutation = useMutation({
    mutationFn: ({ applicationId, status }: { applicationId: string; status: ApplicationStatus }) =>
      jobApi.updateApplicationStatus(applicationId, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["jobs", id, "applications"] }),
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

  return (
    <DashboardLayout role={role} title={job ? `Applicants for ${job.title}` : "Applicants"} subtitle="Review and manage candidates who applied.">
      <Button variant="ghost" size="sm" asChild className="mb-4">
        <Link to={basePath}>
          <ArrowLeft className="h-3.5 w-3.5" /> Back to My Jobs
        </Link>
      </Button>

      {payError && (
        <div className="mb-4 rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">{payError}</div>
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
                    {applicant && app.status === "hired" && !!app.proposedRate && (
                      paidApplicationIds.has(app._id) ? (
                        <Badge variant="success" className="flex items-center gap-1 text-[10px]">
                          <CheckCircle2 className="h-3 w-3" /> Paid
                        </Badge>
                      ) : (
                        <Button
                          variant="gradient"
                          size="sm"
                          disabled={payMutation.isPending}
                          onClick={() => payMutation.mutate({ applicationId: app._id, applicantName: applicant.name })}
                        >
                          {payMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CreditCard className="h-3.5 w-3.5" />}
                          Pay {formatCurrency(app.proposedRate)}
                        </Button>
                      )
                    )}
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
