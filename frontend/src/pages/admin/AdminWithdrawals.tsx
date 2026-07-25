import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { adminApi } from "@/api/admin";
import { formatCurrency } from "@/lib/utils";
import type { Withdrawal } from "@/types";

function destinationLabel(w: Withdrawal) {
  return w.method === "upi" ? (w.upiId ?? "") : `${w.bankAccountHolder ?? ""} · ${w.bankAccountNumber ?? ""} · ${w.bankIfsc ?? ""}`;
}

export default function AdminWithdrawals() {
  const queryClient = useQueryClient();
  const [resolving, setResolving] = useState<{ withdrawal: Withdrawal; action: "complete" | "reject" } | null>(null);
  const [note, setNote] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "withdrawals", "pending"],
    queryFn: () => adminApi.withdrawals({ status: "pending", limit: 50 }),
  });

  const resolveMutation = useMutation({
    mutationFn: () => adminApi.resolveWithdrawal(resolving!.withdrawal._id, resolving!.action, note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "withdrawals"] });
      setResolving(null);
      setNote("");
    },
  });

  return (
    <DashboardLayout role="super_admin" title="Withdrawal Requests" subtitle="Review pending freelancer withdrawal requests, then send the money and mark them complete.">
      <Card className="overflow-x-auto">
        {isLoading ? (
          <div className="space-y-3 p-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : !data?.data.length ? (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <p className="text-sm font-medium">No pending withdrawal requests</p>
            <p className="text-sm text-muted-foreground">Freelancer withdrawal requests will show up here.</p>
          </div>
        ) : (
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                <th className="px-5 py-3 font-medium">Freelancer</th>
                <th className="px-5 py-3 font-medium">Amount</th>
                <th className="px-5 py-3 font-medium">Method</th>
                <th className="px-5 py-3 font-medium">Destination</th>
                <th className="px-5 py-3 font-medium">Requested</th>
                <th className="px-5 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.data.map((w) => {
                const freelancer = typeof w.freelancer === "object" ? w.freelancer : null;
                return (
                  <tr key={w._id} className="border-b border-border last:border-0">
                    <td className="px-5 py-3">
                      <p className="font-medium">{freelancer?.name ?? "—"}</p>
                      <p className="text-xs text-muted-foreground">{freelancer?.email}</p>
                    </td>
                    <td className="px-5 py-3 font-semibold">{formatCurrency(w.amount)}</td>
                    <td className="px-5 py-3">
                      <Badge variant="outline" className="uppercase">
                        {w.method}
                      </Badge>
                    </td>
                    <td className="px-5 py-3 text-xs text-muted-foreground">{destinationLabel(w)}</td>
                    <td className="px-5 py-3 text-xs text-muted-foreground">{new Date(w.createdAt).toLocaleDateString()}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-success hover:bg-success/10"
                          onClick={() => setResolving({ withdrawal: w, action: "complete" })}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" /> Mark Paid
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-danger hover:bg-danger/10"
                          onClick={() => setResolving({ withdrawal: w, action: "reject" })}
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
            <DialogTitle>{resolving?.action === "complete" ? "Mark this withdrawal as paid?" : "Reject this withdrawal request?"}</DialogTitle>
            <DialogDescription>
              {resolving?.action === "complete"
                ? `This will send ${formatCurrency(resolving.withdrawal.amount)} to ${destinationLabel(resolving.withdrawal)} automatically via RazorpayX if configured — otherwise confirm you've sent it manually.`
                : "The freelancer will be notified that their request was rejected, and the amount returns to their available balance."}
            </DialogDescription>
          </DialogHeader>
          <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note (shown to the freelancer)..." className="min-h-[100px]" />
          {resolveMutation.isError && (
            <p className="mt-2 text-xs text-danger">
              {isAxiosError(resolveMutation.error) ? resolveMutation.error.response?.data?.message : "Something went wrong."}
            </p>
          )}
          <Button
            className="mt-2 w-full"
            variant={resolving?.action === "complete" ? "gradient" : "destructive"}
            disabled={resolveMutation.isPending}
            onClick={() => resolveMutation.mutate()}
          >
            {resolveMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Confirm {resolving?.action === "complete" ? "Paid" : "Rejection"}
          </Button>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
