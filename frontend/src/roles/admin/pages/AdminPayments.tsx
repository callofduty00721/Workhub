import { useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { motion } from "framer-motion";
import { CheckCircle2, XCircle, Loader2, AlertTriangle, Search, Wallet, Eye } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { adminApi } from "@/api/admin";
import { formatCurrency } from "@/lib/utils";
import type { Payment } from "@/types";

const fadeIn = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" as const } } };

const TYPE_LABELS: Record<string, string> = {
  gig_order: "Gig Order",
  job_hire: "Job Hire",
  contest_prize: "Contest Prize",
  campaign: "Campaign",
  campaign_facilitation: "Campaign Facilitation",
};

const TYPE_OPTIONS = [{ value: "all", label: "All types" }, ...Object.entries(TYPE_LABELS).map(([value, label]) => ({ value, label }))];

const STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "pending", label: "Pending" },
  { value: "paid", label: "Paid" },
  { value: "failed", label: "Failed" },
  { value: "refunded", label: "Refunded" },
  { value: "partially_refunded", label: "Partially Refunded" },
];

function statusBadge(status: Payment["status"]) {
  if (status === "paid") return <Badge variant="success">Paid</Badge>;
  if (status === "failed") return <Badge variant="danger">Failed</Badge>;
  if (status === "partially_refunded") return <Badge variant="warning">Partially Refunded</Badge>;
  if (status === "refunded") return <Badge variant="outline">Refunded</Badge>;
  return <Badge variant="outline">Pending</Badge>;
}

const ORDER_STATUS_LABELS: Record<string, string> = {
  not_applicable: "Not applicable",
  in_progress: "In progress",
  delivered: "Delivered — awaiting client",
  revision_requested: "Revision requested",
  completed: "Completed & accepted",
};

const MILESTONE_STATUS_LABELS: Record<string, string> = { pending: "Pending", funded: "Funded (in escrow)", released: "Released" };

function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  if (value === undefined || value === null || value === "") return null;
  return (
    <div className="flex items-start justify-between gap-4 py-2 text-sm">
      <span className="shrink-0 text-muted-foreground">{label}</span>
      <span className="text-right font-medium text-foreground">{value}</span>
    </div>
  );
}

function PaymentDetailsDialog({ payment, onOpenChange }: { payment: Payment | null; onOpenChange: (open: boolean) => void }) {
  const payer = payment && typeof payment.payer === "object" ? payment.payer : null;
  const payee = payment && typeof payment.payee === "object" ? payment.payee : null;
  const service = payment && typeof payment.service === "object" ? payment.service : null;
  const contest = payment && typeof payment.contest === "object" ? payment.contest : null;
  const application = payment && typeof payment.application === "object" ? payment.application : null;
  const jobTitle = application && typeof application.job === "object" ? application.job?.title : null;
  const milestone = payment && typeof payment.milestone === "object" ? payment.milestone : null;
  const contextLabel = service?.title || contest?.title || jobTitle;

  return (
    <Dialog open={!!payment} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Payment details</DialogTitle>
          <DialogDescription>
            {payment && (TYPE_LABELS[payment.type] ?? payment.type)}
            {contextLabel ? ` — ${contextLabel}` : ""}
          </DialogDescription>
        </DialogHeader>
        {payment && (
          <div className="divide-y divide-border">
            <div className="flex flex-wrap items-center gap-2 pb-3">
              {statusBadge(payment.status)}
              {payment.escrowStatus && <Badge variant="outline" className="capitalize">Escrow: {payment.escrowStatus}</Badge>}
              {payment.disputeStatus && payment.disputeStatus !== "none" && (
                <Badge variant="danger" className="flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" /> Dispute: {payment.disputeStatus}
                </Badge>
              )}
            </div>

            <div>
              <DetailRow label="Payer" value={payer ? `${payer.name} (${payer.email})` : "—"} />
              <DetailRow label="Payee" value={payee ? `${payee.name} (${payee.email})` : "—"} />
            </div>

            <div>
              <DetailRow label="Amount paid" value={formatCurrency(payment.amount)} />
              {!!payment.commissionAmount && (
                <DetailRow
                  label="Platform commission"
                  value={`${formatCurrency(payment.commissionAmount)} (${payment.commissionPercent}%)`}
                />
              )}
              {payment.netAmount !== undefined && <DetailRow label="Net to payee" value={formatCurrency(payment.netAmount)} />}
              {!!payment.refundedAmount && <DetailRow label="Refunded" value={formatCurrency(payment.refundedAmount)} />}
            </div>

            <div>
              <DetailRow label="Transaction ID" value={payment.providerPaymentId || "Not captured yet"} />
              {payment.providerPaymentId && <DetailRow label="Provider" value="Razorpay" />}
            </div>

            <div>
              <DetailRow label="Payment sent" value={new Date(payment.createdAt).toLocaleString()} />
              {payment.deliveredAt && <DetailRow label="Marked delivered" value={new Date(payment.deliveredAt).toLocaleString()} />}
              {payment.releasedAt && <DetailRow label="Escrow released (accepted)" value={new Date(payment.releasedAt).toLocaleString()} />}
            </div>

            {payment.orderStatus && payment.orderStatus !== "not_applicable" && (
              <div>
                <DetailRow label="Order status" value={ORDER_STATUS_LABELS[payment.orderStatus] ?? payment.orderStatus} />
                {payment.revisionsAllowed !== undefined && (
                  <DetailRow label="Revisions used" value={`${payment.revisionsUsed ?? 0} / ${payment.revisionsAllowed}`} />
                )}
                {payment.deadline && <DetailRow label="Deadline" value={new Date(payment.deadline).toLocaleDateString()} />}
              </div>
            )}

            {milestone && (
              <div>
                <DetailRow label="Milestone" value={milestone.title} />
                <DetailRow label="Milestone amount" value={formatCurrency(milestone.amount)} />
                <DetailRow label="Milestone status" value={MILESTONE_STATUS_LABELS[milestone.status] ?? milestone.status} />
              </div>
            )}

            {payment.disputeStatus && payment.disputeStatus !== "none" && (
              <div>
                <DetailRow label="Dispute reason" value={payment.disputeReason} />
                {payment.disputeRaisedAt && <DetailRow label="Dispute raised" value={new Date(payment.disputeRaisedAt).toLocaleString()} />}
                {payment.disputeResolutionNote && <DetailRow label="Resolution note" value={payment.disputeResolutionNote} />}
              </div>
            )}

            {payment.note && (
              <div>
                <DetailRow label="Note" value={payment.note} />
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function AllPaymentsTab() {
  const [search, setSearch] = useState("");
  const [type, setType] = useState("all");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [viewing, setViewing] = useState<Payment | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "payments", "all", { search, type, status, page }],
    queryFn: () =>
      adminApi.payments({
        search: search || undefined,
        type: type === "all" ? undefined : type,
        status: status === "all" ? undefined : status,
        page,
        limit: 20,
      }),
  });

  return (
    <>
      <div className="mb-5 mt-4 flex flex-wrap gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
            }}
            placeholder="Search by payer or payee name/email..."
            className="pl-9"
          />
        </div>
        <Select
          value={type}
          onValueChange={(v) => {
            setPage(1);
            setType(v);
          }}
        >
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TYPE_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={status}
          onValueChange={(v) => {
            setPage(1);
            setStatus(v);
          }}
        >
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <motion.div variants={fadeIn} initial="hidden" animate="show">
        <Card className="overflow-x-auto">
          {isLoading ? (
            <div className="space-y-3 p-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : !data?.data.length ? (
            <p className="p-8 text-center text-sm text-muted-foreground">No payments match these filters.</p>
          ) : (
            <table className="w-full min-w-[1080px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th className="px-5 py-3 font-medium">Payer</th>
                  <th className="px-5 py-3 font-medium">Payee</th>
                  <th className="px-5 py-3 font-medium">Type</th>
                  <th className="px-5 py-3 font-medium">Amount</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Escrow</th>
                  <th className="px-5 py-3 font-medium">Txn ID</th>
                  <th className="px-5 py-3 font-medium">Sent On</th>
                  <th className="px-5 py-3 font-medium text-right">Details</th>
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
                      <td className="px-5 py-3">
                        <Badge variant="outline">{TYPE_LABELS[payment.type] ?? payment.type}</Badge>
                      </td>
                      <td className="px-5 py-3 font-medium">{formatCurrency(payment.amount)}</td>
                      <td className="px-5 py-3">
                        <div className="flex flex-col items-start gap-1">
                          {statusBadge(payment.status)}
                          {payment.disputeStatus && payment.disputeStatus !== "none" && (
                            <span className="flex items-center gap-1 text-[10px] text-danger">
                              <AlertTriangle className="h-3 w-3" /> Dispute {payment.disputeStatus}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3 capitalize text-muted-foreground">{payment.escrowStatus ?? "—"}</td>
                      <td className="px-5 py-3 font-mono text-xs text-muted-foreground" title={payment.providerPaymentId || undefined}>
                        {payment.providerPaymentId ? `${payment.providerPaymentId.slice(0, 14)}…` : "—"}
                      </td>
                      <td className="px-5 py-3 text-xs text-muted-foreground">{new Date(payment.createdAt).toLocaleDateString()}</td>
                      <td className="px-5 py-3 text-right">
                        <Button variant="outline" size="sm" onClick={() => setViewing(payment)}>
                          <Eye className="h-3.5 w-3.5" /> View
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </Card>
      </motion.div>

      {data && data.pagination.pages > 1 && (
        <div className="mt-5 flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {data.pagination.page} of {data.pagination.pages}
          </span>
          <Button variant="outline" size="sm" disabled={page >= data.pagination.pages} onClick={() => setPage((p) => p + 1)}>
            Next
          </Button>
        </div>
      )}

      <PaymentDetailsDialog payment={viewing} onOpenChange={(open) => !open && setViewing(null)} />
    </>
  );
}

function DisputesTab() {
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
    <>
      <motion.div variants={fadeIn} initial="hidden" animate="show" className="mt-4">
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
      </motion.div>

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
    </>
  );
}

export default function AdminPayments() {
  return (
    <DashboardLayout role="super_admin" title="Payments" subtitle="Every payment between users on the platform, and any disputes raised on them.">
      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">
            <Wallet className="mr-1.5 h-3.5 w-3.5" /> All Payments
          </TabsTrigger>
          <TabsTrigger value="disputes">
            <AlertTriangle className="mr-1.5 h-3.5 w-3.5" /> Disputes
          </TabsTrigger>
        </TabsList>
        <TabsContent value="all">
          <AllPaymentsTab />
        </TabsContent>
        <TabsContent value="disputes">
          <DisputesTab />
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}
