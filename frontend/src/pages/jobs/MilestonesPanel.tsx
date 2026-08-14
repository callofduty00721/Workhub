import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { Plus, Trash2, Lock, Unlock, CheckCircle2, CreditCard, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { milestoneApi } from "@/api/milestones";
import { paymentApi } from "@/api/payments";
import { payWithRazorpay } from "@/lib/razorpay";
import { useAuth } from "@/context/AuthContext";
import { formatCurrency } from "@/lib/utils";
import type { MilestoneStatus } from "@/types";

const STATUS_VARIANT: Record<MilestoneStatus, "outline" | "warning" | "success"> = {
  pending: "outline",
  funded: "warning",
  released: "success",
};

export function MilestonesPanel({
  applicationId,
  freelancerName = "",
  readOnly = false,
  contractSigned = true,
}: {
  applicationId: string;
  freelancerName?: string;
  readOnly?: boolean;
  // Whether both parties have signed the contract yet — funding a milestone
  // is blocked server-side either way, but disabling here avoids a failed
  // payment attempt and explains why in the UI.
  contractSigned?: boolean;
}) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [adding, setAdding] = useState(false);
  const [rows, setRows] = useState([{ title: "", amount: 0 }]);
  const [error, setError] = useState<string | null>(null);

  const { data: milestones, isLoading } = useQuery({
    queryKey: ["milestones", applicationId],
    queryFn: () => milestoneApi.list(applicationId),
  });

  const createMutation = useMutation({
    mutationFn: () => milestoneApi.create(applicationId, rows.filter((r) => r.title.trim() && r.amount > 0)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["milestones", applicationId] });
      setAdding(false);
      setRows([{ title: "", amount: 0 }]);
    },
    onError: (err) => setError(isAxiosError(err) ? err.response?.data?.message || "Failed to save milestones" : "Something went wrong"),
  });

  const payMutation = useMutation({
    mutationFn: async (milestoneId: string) => {
      await payWithRazorpay({
        createOrder: () => paymentApi.createMilestonePayment(milestoneId),
        verify: (payload) => paymentApi.verifyMarketplacePayment(payload),
        description: `Milestone payment to ${freelancerName}`,
        prefill: { name: user!.name, email: user!.email },
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["milestones", applicationId] });
          queryClient.invalidateQueries({ queryKey: ["payments", "mine"] });
        },
      });
    },
    onError: (err) => setError(isAxiosError(err) ? err.response?.data?.message || "Payment failed" : "Payment gateway unavailable"),
  });

  const releaseMutation = useMutation({
    mutationFn: async (paymentId: string) => paymentApi.releasePayment(paymentId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["milestones", applicationId] }),
  });

  // We only know a milestone's Payment _id once it's funded — myPayments (client)
  // or myEarnings (freelancer) lets us look that up by matching on the milestone
  // id embedded in each payment.
  const { data: myPayments } = useQuery({
    queryKey: ["payments", "mine", "all"],
    queryFn: () => paymentApi.myPayments({ limit: 200 }),
    enabled: !readOnly,
  });
  const { data: myEarnings } = useQuery({
    queryKey: ["payments", "earnings", "all"],
    queryFn: () => paymentApi.myEarnings({ limit: 200 }),
    enabled: readOnly,
  });
  const paymentByMilestone = new Map(
    (readOnly ? myEarnings?.payments ?? [] : myPayments?.data ?? []).filter((p) => p.milestone).map((p) => [p.milestone, p])
  );

  if (isLoading) return null;

  if (!milestones?.length) {
    if (readOnly) return null;
    return (
      <div className="mt-2">
        {!adding ? (
          <button type="button" onClick={() => setAdding(true)} className="text-xs font-medium text-primary hover:underline">
            + Split into milestones
          </button>
        ) : (
          <div className="mt-2 space-y-2 rounded-lg border border-border p-3">
            {rows.map((row, i) => (
              <div key={i} className="flex gap-2">
                <Input
                  placeholder="Milestone title"
                  value={row.title}
                  onChange={(e) => setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, title: e.target.value } : r)))}
                  className="h-8 text-xs"
                />
                <Input
                  type="number"
                  min={1}
                  placeholder="₹"
                  value={row.amount || ""}
                  onChange={(e) => setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, amount: Number(e.target.value) } : r)))}
                  className="h-8 w-24 text-xs"
                />
                {rows.length > 1 && (
                  <button type="button" onClick={() => setRows((prev) => prev.filter((_, idx) => idx !== i))}>
                    <Trash2 className="h-3.5 w-3.5 text-danger" />
                  </button>
                )}
              </div>
            ))}
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setRows((prev) => [...prev, { title: "", amount: 0 }])}
                className="flex items-center gap-1 text-xs text-primary hover:underline"
              >
                <Plus className="h-3 w-3" /> Add row
              </button>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setAdding(false)}>
                  Cancel
                </Button>
                <Button variant="gradient" size="sm" disabled={createMutation.isPending} onClick={() => createMutation.mutate()}>
                  {createMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Save Milestones
                </Button>
              </div>
            </div>
            {error && <p className="text-xs text-danger">{error}</p>}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="mt-2 space-y-2">
      {error && <p className="text-xs text-danger">{error}</p>}
      {milestones.map((m) => {
        const payment = paymentByMilestone.get(m._id);
        return (
          <div key={m._id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border p-2.5 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-medium">{m.title}</span>
              {readOnly && payment?.netAmount ? (
                <span className="text-muted-foreground">
                  {formatCurrency(payment.netAmount)}{" "}
                  <span className="text-[10px]">(of {formatCurrency(m.amount)}, after {payment.commissionPercent}% fee)</span>
                </span>
              ) : (
                <span className="text-muted-foreground">{formatCurrency(m.amount)}</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={STATUS_VARIANT[m.status]} className="text-[10px] capitalize">
                {m.status === "funded" ? "In Escrow" : m.status}
              </Badge>
              {!readOnly && m.status === "pending" && (
                <Button
                  variant="gradient"
                  size="sm"
                  className="h-7 text-[11px]"
                  disabled={payMutation.isPending || !contractSigned}
                  title={!contractSigned ? "Both parties must sign the contract first" : undefined}
                  onClick={() => payMutation.mutate(m._id)}
                >
                  {payMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <CreditCard className="h-3 w-3" />}
                  Pay
                </Button>
              )}
              {!readOnly && m.status === "funded" && payment && (
                <Button
                  variant="gradient"
                  size="sm"
                  className="h-7 text-[11px]"
                  disabled={releaseMutation.isPending}
                  onClick={() => releaseMutation.mutate(payment._id)}
                >
                  {releaseMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Unlock className="h-3 w-3" />}
                  Release
                </Button>
              )}
              {m.status === "funded" && (readOnly || !payment) && (
                <Badge variant="warning" className="flex items-center gap-1 text-[10px]">
                  <Lock className="h-3 w-3" /> Held
                </Badge>
              )}
              {m.status === "released" && (
                <Badge variant="success" className="flex items-center gap-1 text-[10px]">
                  <CheckCircle2 className="h-3 w-3" /> Paid
                </Badge>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
