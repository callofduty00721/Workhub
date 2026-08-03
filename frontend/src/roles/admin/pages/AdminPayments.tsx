import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { CheckCircle2, XCircle, Loader2, AlertTriangle } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { adminApi } from "@/api/admin";
import { formatCurrency } from "@/lib/utils";
import type { Payment } from "@/types";

export default function AdminPayments() {
  const queryClient = useQueryClient();
  const [resolving, setResolving] = useState<{ payment: Payment; action: "refund" | "reject" } | null>(null);
  const [note, setNote] = useState("");
  const [refundAmount, setRefundAmount] = useState(0);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "payments", "disputed"],
    queryFn: () => adminApi.payments({ disputeStatus: "raised", limit: 50 }),
  });

  const resolveMutation = useMutation({
    mutationFn: () =>
      adminApi.resolveDispute(resolving!.payment._id, resolving!.action, note, resolving!.action === "refund" ? refundAmount : undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "payments"] });
      setResolving(null);
      setNote("");
      setRefundAmount(0);
    },
  });

  return (
    <DashboardLayout role="super_admin" title="Payment Disputes" subtitle="Review disputes raised by clients and employers, then refund or reject.">
      <Card className="overflow-x-auto">
        {isLoading ? (
          <div className="space-y-3 p-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : !data?.data.length ? (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <p className="text-sm font-medium">No open disputes</p>
            <p className="text-sm text-muted-foreground">Disputes raised by clients or employers will show up here.</p>
          </div>
        ) : (
          <table className="w-full min-w-[820px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                <th className="px-5 py-3 font-medium">Payer</th>
                <th className="px-5 py-3 font-medium">Payee</th>
                <th className="px-5 py-3 font-medium">Amount</th>
                <th className="px-5 py-3 font-medium">Reason</th>
                <th className="px-5 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.data.map((payment) => {
                const payer = typeof payment.payer === "object" ? payment.payer : null;
                const payee = typeof payment.payee === "object" ? payment.payee : null;
                return (
                  <tr key={payment._id} className="border-b border-border last:border-0">
                    <td className="px-5 py-3">
                      <p className="font-medium">{payer?.name ?? "—"}</p>
                      <p className="text-xs text-muted-foreground">{payer?.email}</p>
                    </td>
                    <td className="px-5 py-3">
                      <p className="font-medium">{payee?.name ?? "—"}</p>
                      <p className="text-xs text-muted-foreground">{payee?.email}</p>
                    </td>
                    <td className="px-5 py-3">{formatCurrency(payment.amount)}</td>
                    <td className="px-5 py-3 max-w-xs">
                      {payment.disputeEscalated && (
                        <Badge variant="danger" className="mb-1 flex w-fit items-center gap-1 text-[10px]">
                          <AlertTriangle className="h-3 w-3" /> Escalated
                        </Badge>
                      )}
                      <p className="line-clamp-2 text-xs text-muted-foreground">{payment.disputeReason}</p>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-success hover:bg-success/10"
                          onClick={() => {
                            setResolving({ payment, action: "refund" });
                            setRefundAmount(payment.amount);
                          }}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" /> Refund
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-danger hover:bg-danger/10"
                          onClick={() => setResolving({ payment, action: "reject" })}
                        >
                          <XCircle className="h-3.5 w-3.5" /> Reject
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Card>

      <Dialog open={!!resolving} onOpenChange={(open) => !open && setResolving(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{resolving?.action === "refund" ? "Refund this payment?" : "Reject this dispute?"}</DialogTitle>
            <DialogDescription>
              {resolving?.action === "refund"
                ? `${formatCurrency(resolving.payment.amount)} will be refunded to the payer via Razorpay.`
                : "The payer will be notified that their dispute was reviewed and rejected."}
            </DialogDescription>
          </DialogHeader>
          {resolving?.action === "refund" && (
            <div className="space-y-1.5">
              <Label>Refund Amount (₹)</Label>
              <Input
                type="number"
                min={1}
                max={resolving.payment.amount}
                value={refundAmount || ""}
                onChange={(e) => setRefundAmount(Number(e.target.value))}
              />
              <p className="text-xs text-muted-foreground">
                Full payment was {formatCurrency(resolving.payment.amount)}. Enter a smaller amount for a partial refund.
              </p>
            </div>
          )}
          <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Resolution note (shown to the payer)..." className="min-h-[100px]" />
          {resolveMutation.isError && (
            <p className="mt-2 text-xs text-danger">
              {isAxiosError(resolveMutation.error) ? resolveMutation.error.response?.data?.message : "Something went wrong."}
            </p>
          )}
          <Button
            className="mt-2 w-full"
            variant={resolving?.action === "refund" ? "gradient" : "destructive"}
            disabled={
              resolveMutation.isPending || (resolving?.action === "refund" && (refundAmount <= 0 || refundAmount > resolving.payment.amount))
            }
            onClick={() => resolveMutation.mutate()}
          >
            {resolveMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Confirm {resolving?.action === "refund" ? "Refund" : "Rejection"}
          </Button>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
