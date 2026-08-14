import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { ArrowLeft, Mail, MapPin, MessageSquare, CreditCard, CheckCircle2, Lock, Unlock, Loader2, HandCoins, TriangleAlert, IndianRupee, Clock } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import type { DashboardRole } from "@/components/layout/DashboardSidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { campaignApi } from "@/api/campaigns";
import { jobApi } from "@/api/jobs";
import { chatApi } from "@/api/chat";
import { paymentApi } from "@/api/payments";
import { publicSettingsApi } from "@/api/settings";
import { payWithRazorpay } from "@/lib/razorpay";
import { useAuth } from "@/context/AuthContext";
import { initialsFromName, formatCurrency } from "@/lib/utils";
import type { ApplicationStatus } from "@/types";

const STATUSES: ApplicationStatus[] = ["applied", "shortlisted", "hired", "rejected"];

const STATUS_VARIANT: Record<ApplicationStatus, "default" | "warning" | "success" | "danger"> = {
  applied: "default",
  shortlisted: "warning",
  interview: "warning",
  hired: "success",
  rejected: "danger",
  withdrawn: "danger",
};

export default function CampaignApplicants() {
  const { id = "" } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [payError, setPayError] = useState<string | null>(null);
  const [offPlatformTarget, setOffPlatformTarget] = useState<{ applicationId: string; applicantName: string; rate: number } | null>(null);
  const [negotiationTarget, setNegotiationTarget] = useState<{ applicationId: string; applicantName: string; currentRate: number } | null>(null);
  const [negotiationMessage, setNegotiationMessage] = useState("");
  const [negotiationSuggestedRate, setNegotiationSuggestedRate] = useState(0);
  const dashboardRole = (user?.role ?? "employer") as DashboardRole;

  const { data: campaign } = useQuery({ queryKey: ["campaigns", id], queryFn: () => campaignApi.getById(id), enabled: !!id });
  const { data: applications, isLoading } = useQuery({
    queryKey: ["campaigns", id, "applications"],
    queryFn: () => campaignApi.applications(id),
    enabled: !!id,
  });

  const { data: myPayments } = useQuery({ queryKey: ["payments", "mine", "all"], queryFn: () => paymentApi.myPayments({ limit: 200 }) });
  const paymentByApplication = new Map((myPayments?.data ?? []).filter((p) => p.type === "campaign" && p.status === "paid").map((p) => [p.application, p]));

  const { data: commissionPercent } = useQuery({ queryKey: ["settings", "commission-percent"], queryFn: publicSettingsApi.commissionPercent });

  const statusMutation = useMutation({
    mutationFn: ({ applicationId, status }: { applicationId: string; status: ApplicationStatus }) =>
      jobApi.updateApplicationStatus(applicationId, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["campaigns", id, "applications"] }),
  });

  const negotiationMutation = useMutation({
    mutationFn: () =>
      jobApi.requestRateChange(negotiationTarget!.applicationId, {
        message: negotiationMessage,
        suggestedRate: negotiationSuggestedRate || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaigns", id, "applications"] });
      setNegotiationTarget(null);
      setNegotiationMessage("");
      setNegotiationSuggestedRate(0);
    },
  });

  const messageMutation = useMutation({
    mutationFn: (applicantId: string) => chatApi.getOrCreateConversation(applicantId),
    onSuccess: (conversation) => navigate(`/dashboard/messages?c=${conversation._id}`),
  });

  const payMutation = useMutation({
    mutationFn: async ({ applicationId, applicantName }: { applicationId: string; applicantName: string }) => {
      await payWithRazorpay({
        createOrder: () => paymentApi.createCampaignPayment(applicationId),
        verify: (payload) => paymentApi.verifyMarketplacePayment(payload),
        description: `Payment to ${applicantName}`,
        prefill: { name: user!.name, email: user!.email },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["payments", "mine"] }),
      });
    },
    onError: (err) => setPayError(isAxiosError(err) ? err.response?.data?.message || "Payment failed" : "Payment gateway unavailable"),
  });

  const offPlatformMutation = useMutation({
    mutationFn: async ({ applicationId, applicantName }: { applicationId: string; applicantName: string }) => {
      await payWithRazorpay({
        createOrder: () => paymentApi.createOffPlatformFacilitationPayment(applicationId),
        verify: (payload) => paymentApi.verifyMarketplacePayment(payload),
        description: `Off-platform facilitation fee — ${applicantName}`,
        prefill: { name: user!.name, email: user!.email },
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["campaigns", id, "applications"] });
          setOffPlatformTarget(null);
        },
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
    <DashboardLayout
      role={dashboardRole}
      title={campaign ? `Applicants for ${campaign.title}` : "Applicants"}
      subtitle="Review influencers who applied to this campaign."
    >
      <Button variant="ghost" size="sm" asChild className="mb-4">
        <Link to="/dashboard/employer/campaigns">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to My Campaigns
        </Link>
      </Button>

      {payError && <div className="mb-4 rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">{payError}</div>}

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
            <p className="text-sm text-muted-foreground">Once influencers apply, they&apos;ll show up here.</p>
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
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white">
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
                          {!!app.proposedRate && <>Rate: {formatCurrency(app.proposedRate)}</>}
                          {!!app.proposedRate && !!app.deliveryDays && " · "}
                          {!!app.deliveryDays && <>{app.deliveryDays} day delivery</>}
                        </p>
                      )}
                      {!!app.negotiationRequest?.requestedAt && (
                        <p className="mt-1 flex items-center gap-1 text-[11px] font-medium text-warning">
                          <Clock className="h-3 w-3" /> Rate change requested — waiting for a revised proposal
                        </p>
                      )}
                      {app.coverLetter && <p className="mt-2 line-clamp-2 max-w-md text-xs text-foreground/80">{app.coverLetter}</p>}
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    {applicant && (
                      <Button variant="outline" size="sm" disabled={messageMutation.isPending} onClick={() => messageMutation.mutate(applicant._id)}>
                        {messageMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <MessageSquare className="h-3.5 w-3.5" />}
                        Message
                      </Button>
                    )}
                    {applicant &&
                      !!app.proposedRate &&
                      !app.negotiationRequest?.requestedAt &&
                      ["applied", "shortlisted"].includes(app.status) && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setNegotiationTarget({ applicationId: app._id, applicantName: applicant.name, currentRate: app.proposedRate! });
                            setNegotiationSuggestedRate(0);
                            setNegotiationMessage("");
                          }}
                        >
                          <IndianRupee className="h-3.5 w-3.5" /> Request Rate Change
                        </Button>
                      )}
                    {applicant &&
                      app.status === "hired" &&
                      !!app.proposedRate &&
                      (() => {
                        if (app.offPlatformSettledAt) {
                          return (
                            <Badge variant="outline" className="flex items-center gap-1 text-[10px]">
                              <HandCoins className="h-3 w-3" /> Settled Off-Platform
                            </Badge>
                          );
                        }
                        const payment = paymentByApplication.get(app._id);
                        if (!payment) {
                          return (
                            <>
                              <Button
                                variant="gradient"
                                size="sm"
                                disabled={payMutation.isPending}
                                onClick={() => payMutation.mutate({ applicationId: app._id, applicantName: applicant.name })}
                              >
                                {payMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CreditCard className="h-3.5 w-3.5" />}
                                Pay {formatCurrency(app.proposedRate)}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setOffPlatformTarget({ applicationId: app._id, applicantName: applicant.name, rate: app.proposedRate! })}
                              >
                                <HandCoins className="h-3.5 w-3.5" /> Settle Off-Platform
                              </Button>
                            </>
                          );
                        }
                        if (payment.escrowStatus === "held") {
                          return (
                            <>
                              <Badge variant="warning" className="flex items-center gap-1 text-[10px]">
                                <Lock className="h-3 w-3" /> In Escrow
                              </Badge>
                              <Button variant="gradient" size="sm" disabled={releaseMutation.isPending} onClick={() => releaseMutation.mutate(payment._id)}>
                                {releaseMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Unlock className="h-3.5 w-3.5" />}
                                Approve &amp; Release
                              </Button>
                            </>
                          );
                        }
                        return (
                          <Badge variant="success" className="flex items-center gap-1 text-[10px]">
                            <CheckCircle2 className="h-3 w-3" /> Paid &amp; Released
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

      <Dialog open={!!offPlatformTarget} onOpenChange={(open) => !open && setOffPlatformTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TriangleAlert className="h-4 w-4 text-warning" /> Settle Off-Platform
            </DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-3 pt-2 text-left text-sm text-foreground">
                <p>
                  You&apos;re confirming that you&apos;ll pay <strong>{offPlatformTarget && formatCurrency(offPlatformTarget.rate)}</strong> directly to{" "}
                  <strong>{offPlatformTarget?.applicantName}</strong>, outside GrowHive.
                </p>
                <div className="rounded-lg border border-warning/30 bg-warning/10 p-3 text-xs text-foreground/90">
                  <p className="font-semibold">GrowHive will not hold or protect this payment.</p>
                  <p className="mt-1">
                    No escrow, no delivery tracking, and no dispute resolution — if something goes wrong with the off-platform payment, GrowHive can&apos;t
                    help recover it.
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">
                  A facilitation fee{commissionPercent ? ` (${commissionPercent}% of the rate)` : ""} is charged to GrowHive to mark this hire settled.
                  {offPlatformTarget && commissionPercent
                    ? ` That's approximately ${formatCurrency(Math.round((offPlatformTarget.rate * commissionPercent) / 100))}.`
                    : ""}
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>
          <div className="mt-2 flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setOffPlatformTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="gradient"
              size="sm"
              disabled={offPlatformMutation.isPending}
              onClick={() => offPlatformTarget && offPlatformMutation.mutate(offPlatformTarget)}
            >
              {offPlatformMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <HandCoins className="h-3.5 w-3.5" />}
              Confirm & Pay Facilitation Fee
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!negotiationTarget} onOpenChange={(open) => !open && setNegotiationTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request a Rate Change</DialogTitle>
            <DialogDescription>
              Ask <strong>{negotiationTarget?.applicantName}</strong> to revise their proposal
              {negotiationTarget && <> (currently {formatCurrency(negotiationTarget.currentRate)})</>}. This reopens their proposal for editing.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label>Suggested Rate (₹, optional)</Label>
            <Input
              type="number"
              min={0}
              value={negotiationSuggestedRate || ""}
              onChange={(e) => setNegotiationSuggestedRate(Number(e.target.value))}
              placeholder="e.g. 7000"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Message (optional)</Label>
            <Textarea
              value={negotiationMessage}
              onChange={(e) => setNegotiationMessage(e.target.value)}
              placeholder="Can you do this a bit lower given our budget?"
              className="min-h-[100px]"
            />
          </div>
          {negotiationMutation.isError && (
            <p className="text-xs text-danger">
              {isAxiosError(negotiationMutation.error) ? negotiationMutation.error.response?.data?.message : "Something went wrong."}
            </p>
          )}
          <div className="mt-2 flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setNegotiationTarget(null)}>
              Cancel
            </Button>
            <Button variant="gradient" size="sm" disabled={negotiationMutation.isPending} onClick={() => negotiationMutation.mutate()}>
              {negotiationMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Send Request
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
