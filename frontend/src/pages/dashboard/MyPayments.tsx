import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { Wallet, Briefcase, FolderKanban, Trophy, Flag, Loader2 } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { paymentApi } from "@/api/payments";
import { formatCurrency, initialsFromName } from "@/lib/utils";
import type { Payment, PaymentType } from "@/types";

const TYPE_LABELS: Record<PaymentType, string> = {
  gig_order: "Gig Order",
  job_hire: "Job / Project",
  contest_prize: "Contest Prize",
};

const TYPE_ICONS: Record<PaymentType, typeof Briefcase> = {
  gig_order: Briefcase,
  job_hire: FolderKanban,
  contest_prize: Trophy,
};

export default function MyPayments({ role = "client" }: { role?: "client" | "employer" }) {
  const queryClient = useQueryClient();
  const [disputing, setDisputing] = useState<Payment | null>(null);
  const [reason, setReason] = useState("");
  const [page, setPage] = useState(1);

  const { data: result, isLoading } = useQuery({
    queryKey: ["payments", "mine", { page }],
    queryFn: () => paymentApi.myPayments({ page, limit: 20 }),
  });
  const payments = result?.data;

  const disputeMutation = useMutation({
    mutationFn: () => paymentApi.raiseDispute(disputing!._id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments", "mine"] });
      setDisputing(null);
      setReason("");
    },
  });

  const totalSpent = result?.totalSpent ?? 0;

  return (
    <DashboardLayout role={role} title="My Payments" subtitle="Payments you've made for gigs, hires, and contest prizes.">
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      ) : (
        <div className="space-y-6">
          <Card>
            <CardContent className="flex items-center gap-3 p-5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Wallet className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Total Spent</p>
                <p className="text-lg font-bold">{formatCurrency(totalSpent)}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h3 className="mb-4 text-base font-semibold">Payment History</h3>
              {!payments?.length ? (
                <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border py-12 text-center">
                  <Wallet className="h-8 w-8 text-muted-foreground" />
                  <p className="text-sm font-medium">No payments made yet</p>
                  <p className="max-w-sm text-sm text-muted-foreground">
                    Payments for ordered gigs, hired freelancers, and contest prizes will show up here.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {payments.map((payment) => {
                    const payee = typeof payment.payee === "object" ? payment.payee : null;
                    const Icon = TYPE_ICONS[payment.type];
                    return (
                      <div key={payment._id} className="flex flex-col gap-3 rounded-lg border border-border p-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary text-xs font-semibold text-white">
                            {payee ? initialsFromName(payee.name) : <Icon className="h-4 w-4" />}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium">{payee?.name ?? "Freelancer"}</p>
                            <p className="truncate text-xs text-muted-foreground">{payment.note || TYPE_LABELS[payment.type]}</p>
                          </div>
                        </div>
                        <div className="flex shrink-0 flex-wrap items-center gap-2">
                          <Badge variant="outline" className="text-[10px]">
                            {TYPE_LABELS[payment.type]}
                          </Badge>
                          <Badge
                            variant={
                              payment.status === "paid"
                                ? "success"
                                : payment.status === "failed"
                                  ? "danger"
                                  : payment.status === "refunded" || payment.status === "partially_refunded"
                                    ? "warning"
                                    : "outline"
                            }
                          >
                            {payment.status === "partially_refunded"
                              ? `Partially Refunded (${formatCurrency(payment.refundedAmount ?? 0)})`
                              : payment.status[0].toUpperCase() + payment.status.slice(1)}
                          </Badge>
                          {payment.disputeStatus && payment.disputeStatus !== "none" && (
                            <Badge variant="danger" className="capitalize">
                              Dispute: {payment.disputeStatus}
                            </Badge>
                          )}
                          <span className="text-sm font-semibold">{formatCurrency(payment.amount)}</span>
                          {payment.status === "paid" && (!payment.disputeStatus || payment.disputeStatus === "none") && (
                            <Button variant="outline" size="sm" onClick={() => setDisputing(payment)}>
                              <Flag className="h-3.5 w-3.5" /> Dispute
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

          {result && result.pagination.pages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {result.pagination.page} of {result.pagination.pages}
              </span>
              <Button variant="outline" size="sm" disabled={page >= result.pagination.pages} onClick={() => setPage((p) => p + 1)}>
                Next
              </Button>
            </div>
          )}
        </div>
      )}

      <Dialog open={!!disputing} onOpenChange={(open) => !open && setDisputing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Raise a Dispute</DialogTitle>
            <DialogDescription>
              Tell us what went wrong with this payment{disputing?.note ? ` for "${disputing.note}"` : ""}. An admin will review it.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Describe the issue..."
            className="min-h-[120px]"
          />
          {disputeMutation.isError && (
            <p className="mt-2 text-xs text-danger">
              {isAxiosError(disputeMutation.error) ? disputeMutation.error.response?.data?.message : "Something went wrong."}
            </p>
          )}
          <Button
            className="mt-2 w-full"
            variant="gradient"
            disabled={!reason.trim() || disputeMutation.isPending}
            onClick={() => disputeMutation.mutate()}
          >
            {disputeMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Submit Dispute
          </Button>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
