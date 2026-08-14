import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { Send, X, Loader2, Handshake, Clock, CheckCircle2, IndianRupee } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { jobApi } from "@/api/jobs";
import { formatCurrency } from "@/lib/utils";
import type { Campaign } from "@/types";

// Two kinds of rows share this page: real invites (origin:"invited", brand
// started it) and rate-change requests (brand asked to revise an existing
// self-applied proposal — see requestRateChange in job.controller.js, which
// bumps status back to "applied" so the same editApplication endpoint below
// works for both). Both resolve the same way: respond with a rate (or
// revised rate) via editApplication, or decline via withdraw.
export default function CampaignInvites() {
  const queryClient = useQueryClient();
  const [drafts, setDrafts] = useState<Record<string, { proposedRate: string; deliveryDays: string; coverLetter: string }>>({});

  const { data: applications, isLoading } = useQuery({ queryKey: ["applications", "mine"], queryFn: jobApi.myApplications });
  const invites = (applications ?? []).filter((a) => a.onModel === "Campaign" && (a.origin === "invited" || !!a.negotiationRequest?.requestedAt));

  const respondMutation = useMutation({
    mutationFn: (id: string) => {
      const draft = drafts[id];
      return jobApi.editApplication(id, {
        proposedRate: Number(draft?.proposedRate) || 0,
        deliveryDays: Number(draft?.deliveryDays) || 0,
        coverLetter: draft?.coverLetter,
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["applications", "mine"] }),
  });

  const declineMutation = useMutation({
    mutationFn: (id: string) => jobApi.withdraw(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["applications", "mine"] }),
  });

  const draftFor = (id: string, inv: (typeof invites)[number]) =>
    drafts[id] ?? {
      proposedRate: inv.proposedRate ? String(inv.proposedRate) : "",
      deliveryDays: inv.deliveryDays ? String(inv.deliveryDays) : "",
      coverLetter: "",
    };
  const updateDraft = (id: string, patch: Partial<{ proposedRate: string; deliveryDays: string; coverLetter: string }>, inv: (typeof invites)[number]) =>
    setDrafts((prev) => ({ ...prev, [id]: { ...draftFor(id, inv), ...patch } }));

  return (
    <DashboardLayout
      role="influencer"
      title="Campaign Invites"
      subtitle="Brands who've reached out to you directly, or asked you to revise a rate — respond, or decline."
    >
      <Card>
        <CardContent className="p-6">
          {isLoading ? (
            <Skeleton className="h-24 w-full" />
          ) : !invites.length ? (
            <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border py-12 text-center">
              <Handshake className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No campaign invites or rate requests right now.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {invites.map((inv) => {
                const campaign = typeof inv.job === "object" ? (inv.job as Campaign) : null;
                const draft = draftFor(inv._id, inv);
                const isNegotiation = !!inv.negotiationRequest?.requestedAt;
                const needsResponse = inv.status === "applied" && (!inv.proposedRate || isNegotiation);

                return (
                  <div key={inv._id} className="rounded-lg border border-border p-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold">{campaign?.title ?? "Campaign"}</p>
                        <p className="text-xs text-muted-foreground">{campaign?.companyName}</p>
                      </div>
                      {inv.status === "withdrawn" && (
                        <Badge variant="danger" className="flex items-center gap-1 text-[10px]">
                          <X className="h-3 w-3" /> Declined
                        </Badge>
                      )}
                      {inv.status === "hired" && (
                        <Badge variant="success" className="flex items-center gap-1 text-[10px]">
                          <CheckCircle2 className="h-3 w-3" /> Hired
                        </Badge>
                      )}
                      {inv.status === "applied" && !needsResponse && (
                        <Badge variant="warning" className="flex items-center gap-1 text-[10px]">
                          <Clock className="h-3 w-3" /> Proposal Sent — Waiting for Brand
                        </Badge>
                      )}
                    </div>

                    {isNegotiation && needsResponse && (
                      <div className="mt-2 rounded-lg border border-warning/30 bg-warning/10 p-3 text-xs text-foreground/90">
                        <p className="flex items-center gap-1 font-semibold text-warning">
                          <IndianRupee className="h-3.5 w-3.5" /> Brand requested a rate change
                        </p>
                        {inv.negotiationRequest?.suggestedRate ? (
                          <p className="mt-1">Suggested rate: {formatCurrency(inv.negotiationRequest.suggestedRate)}</p>
                        ) : null}
                        {inv.negotiationRequest?.message && <p className="mt-1">&ldquo;{inv.negotiationRequest.message}&rdquo;</p>}
                      </div>
                    )}

                    {inv.coverLetter && !needsResponse && (
                      <p className="mt-2 text-xs text-muted-foreground">&ldquo;{inv.coverLetter}&rdquo;</p>
                    )}

                    {needsResponse && (
                      <div className="mt-3 space-y-3 border-t border-border pt-3">
                        {!isNegotiation && inv.coverLetter && <p className="text-xs text-muted-foreground">&ldquo;{inv.coverLetter}&rdquo;</p>}
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="space-y-1.5">
                            <Label>Your Rate (₹)</Label>
                            <Input
                              type="number"
                              min={0}
                              value={draft.proposedRate}
                              onChange={(e) => updateDraft(inv._id, { proposedRate: e.target.value }, inv)}
                              placeholder="e.g. 8000"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label>Delivery (days)</Label>
                            <Input
                              type="number"
                              min={0}
                              value={draft.deliveryDays}
                              onChange={(e) => updateDraft(inv._id, { deliveryDays: e.target.value }, inv)}
                              placeholder="e.g. 7"
                            />
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <Label>Note (optional)</Label>
                          <Input
                            value={draft.coverLetter}
                            onChange={(e) => updateDraft(inv._id, { coverLetter: e.target.value }, inv)}
                            placeholder="Anything you'd like to add..."
                          />
                        </div>
                        {respondMutation.isError && respondMutation.variables === inv._id && (
                          <p className="text-xs text-danger">
                            {isAxiosError(respondMutation.error) ? respondMutation.error.response?.data?.message : "Something went wrong."}
                          </p>
                        )}
                        <div className="flex gap-2">
                          <Button
                            variant="gradient"
                            size="sm"
                            disabled={!draft.proposedRate || respondMutation.isPending}
                            onClick={() => respondMutation.mutate(inv._id)}
                          >
                            {respondMutation.isPending && respondMutation.variables === inv._id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Send className="h-3.5 w-3.5" />
                            )}
                            {isNegotiation ? "Send Revised Proposal" : "Send Proposal"}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={declineMutation.isPending}
                            onClick={() => declineMutation.mutate(inv._id)}
                          >
                            {declineMutation.isPending && declineMutation.variables === inv._id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <X className="h-3.5 w-3.5" />
                            )}
                            Decline
                          </Button>
                        </div>
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
