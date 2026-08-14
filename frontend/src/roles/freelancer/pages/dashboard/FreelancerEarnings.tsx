import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { Wallet, Briefcase, FolderKanban, Trophy, Megaphone, HandCoins, Lock, Unlock, ArrowDownToLine, Settings, Loader2, ChevronDown, ChevronUp, Receipt } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import type { DashboardRole } from "@/components/layout/DashboardSidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { paymentApi } from "@/api/payments";
import { RateClientModal } from "@/components/shared/RateClientModal";
import { useAuth } from "@/context/AuthContext";
import { formatCurrency, initialsFromName } from "@/lib/utils";
import type { PaymentType, WithdrawalMethod, WithdrawalStatus } from "@/types";

const TYPE_LABELS: Record<PaymentType, string> = {
  gig_order: "Gig Order",
  job_hire: "Job / Project",
  contest_prize: "Contest Prize",
  campaign: "Influencer Campaign",
  campaign_facilitation: "Off-Platform Facilitation Fee",
};

const TYPE_ICONS: Record<PaymentType, typeof Briefcase> = {
  gig_order: Briefcase,
  job_hire: FolderKanban,
  contest_prize: Trophy,
  campaign: Megaphone,
  campaign_facilitation: HandCoins,
};

const WITHDRAWAL_STATUS_VARIANT: Record<WithdrawalStatus, "warning" | "success" | "danger"> = {
  pending: "warning",
  completed: "success",
  rejected: "danger",
};

export default function FreelancerEarnings() {
  const { user } = useAuth();
  // Shared by freelancer and influencer — earnings/withdrawal are entirely
  // payee-based on the backend (see earnings.controller.js's getMyEarnings),
  // no role check, so the sidebar just needs to match whoever's signed in.
  const dashboardRole = (user?.role ?? "freelancer") as DashboardRole;
  const withdrawalBlockers = [
    user?.kycStatus !== "verified" && "Government ID verification (KYC)",
    !user?.isEmailVerified && "Email verification",
    !user?.isPhoneVerified && "Mobile verification",
    user?.bankVerificationStatus !== "verified" && "Bank verification",
  ].filter(Boolean) as string[];
  const [page, setPage] = useState(1);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [expandedPaymentId, setExpandedPaymentId] = useState<string | null>(null);
  const [rateClient, setRateClient] = useState<{ id: string; name: string } | null>(null);
  const [amount, setAmount] = useState(0);
  const [method, setMethod] = useState<WithdrawalMethod>("upi");
  const [upiId, setUpiId] = useState("");
  const [bankAccountNumber, setBankAccountNumber] = useState("");
  const [bankIfsc, setBankIfsc] = useState("");
  const [bankAccountHolder, setBankAccountHolder] = useState("");
  const queryClient = useQueryClient();

  const hasSavedPayoutDetails =
    !!user?.payoutDetails?.upiId || !!(user?.payoutDetails?.bankAccountNumber && user?.payoutDetails?.bankIfsc);

  const openWithdrawDialog = (availableBalance: number) => {
    const saved = user?.payoutDetails;
    setAmount(availableBalance);
    setMethod(saved?.preferredMethod ?? "upi");
    setUpiId(saved?.upiId ?? "");
    setBankAccountNumber(saved?.bankAccountNumber ?? "");
    setBankIfsc(saved?.bankIfsc ?? "");
    setBankAccountHolder(saved?.bankAccountHolder ?? "");
    setWithdrawOpen(true);
  };

  const destinationValid = method === "upi" ? !!upiId.trim() : !!bankAccountNumber.trim() && !!bankIfsc.trim() && !!bankAccountHolder.trim();

  const { data, isLoading } = useQuery({
    queryKey: ["payments", "earnings", { page }],
    queryFn: () => paymentApi.myEarnings({ page, limit: 20 }),
  });

  const { data: withdrawals, isLoading: loadingWithdrawals } = useQuery({
    queryKey: ["payments", "withdrawals", "mine"],
    queryFn: paymentApi.myWithdrawals,
  });

  const withdrawMutation = useMutation({
    mutationFn: () =>
      paymentApi.requestWithdrawal(
        method === "upi" ? { amount, method, upiId } : { amount, method, bankAccountNumber, bankIfsc, bankAccountHolder }
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments", "earnings"] });
      queryClient.invalidateQueries({ queryKey: ["payments", "withdrawals", "mine"] });
      setWithdrawOpen(false);
      setAmount(0);
      setUpiId("");
      setBankAccountNumber("");
      setBankIfsc("");
      setBankAccountHolder("");
    },
  });

  const wallet = data?.wallet;
  const subtitle =
    dashboardRole === "influencer"
      ? "Track payments you've received for campaigns."
      : "Track payments you've received for gigs, projects, and contests.";
  // An influencer never earns gig_order/job_hire/contest_prize — showing
  // those as permanent ₹0 tiles would just be confusing filler, not an
  // honest "nothing here yet" state.
  const statTypes: PaymentType[] = dashboardRole === "influencer" ? ["campaign"] : ["gig_order", "job_hire", "contest_prize"];

  return (
    <DashboardLayout role={dashboardRole} title="Earnings" subtitle={subtitle}>
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-28 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      ) : (
        <div className="space-y-6">
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Available Balance (withdrawable)</p>
                <p className="text-3xl font-bold text-primary">{formatCurrency(wallet?.availableBalance ?? 0)}</p>
                <div className="mt-2 flex flex-wrap gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Lock className="h-3 w-3" /> {formatCurrency(wallet?.heldAmount ?? 0)} in escrow
                  </span>
                  <span className="flex items-center gap-1">
                    <ArrowDownToLine className="h-3 w-3" /> {formatCurrency(wallet?.withdrawnTotal ?? 0)} withdrawn
                  </span>
                  {!!wallet?.pendingWithdrawal && (
                    <span className="flex items-center gap-1">{formatCurrency(wallet.pendingWithdrawal)} withdrawal pending</span>
                  )}
                </div>
              </div>
              <Button
                variant="gradient"
                disabled={!wallet || wallet.availableBalance <= 0 || withdrawalBlockers.length > 0}
                onClick={() => openWithdrawDialog(wallet?.availableBalance ?? 0)}
              >
                <ArrowDownToLine className="h-4 w-4" /> Withdraw
              </Button>
            </CardContent>
          </Card>

          {withdrawalBlockers.length > 0 && (
            <Card className="border-warning/30 bg-warning/5">
              <CardContent className="flex items-start gap-3 p-4 text-sm">
                <Settings className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
                <div>
                  <p className="font-medium">Complete these before you can withdraw:</p>
                  <ul className="mt-1.5 list-disc space-y-1 pl-4">
                    {withdrawalBlockers.map((reason) => (
                      <li key={reason}>{reason}</li>
                    ))}
                  </ul>
                  <Link to="/dashboard/profile" className="mt-1.5 inline-block font-medium text-primary hover:underline">
                    Go to Verification
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}

          <div className={`grid gap-4 sm:grid-cols-2 ${dashboardRole === "influencer" ? "lg:grid-cols-2" : "lg:grid-cols-4"}`}>
            <Card>
              <CardContent className="flex items-center gap-3 p-5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-success/10 text-success">
                  <Wallet className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Total Earnings</p>
                  <p className="text-lg font-bold">{formatCurrency(data?.totalEarnings ?? 0)}</p>
                </div>
              </CardContent>
            </Card>
            {statTypes.map((type) => {
              const Icon = TYPE_ICONS[type];
              return (
                <Card key={type}>
                  <CardContent className="flex items-center gap-3 p-5">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">{TYPE_LABELS[type]}</p>
                      <p className="text-lg font-bold">{formatCurrency(data?.byType[type] ?? 0)}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <Card>
            <CardContent className="p-6">
              <h3 className="mb-4 text-base font-semibold">Payment History</h3>
              {!data?.payments.length ? (
                <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border py-12 text-center">
                  <Wallet className="h-8 w-8 text-muted-foreground" />
                  <p className="text-sm font-medium">No payments received yet</p>
                  <p className="max-w-sm text-sm text-muted-foreground">
                    {dashboardRole === "influencer"
                      ? "Earnings from hired campaigns will show up here."
                      : "Earnings from ordered gigs, hired projects, and won contests will show up here."}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {data.payments.map((payment) => {
                    const payer = typeof payment.payer === "object" ? payment.payer : null;
                    const hasDispute = !!payment.disputeStatus && payment.disputeStatus !== "none";
                    const hasOrderDetails = !!payment.servicePackage || hasDispute;
                    const isExpanded = expandedPaymentId === payment._id;
                    return (
                      <div key={payment._id} className="rounded-lg border border-border p-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-white">
                              {payer ? initialsFromName(payer.name) : "?"}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium">{payer?.name ?? "Client"}</p>
                              <p className="truncate text-xs text-muted-foreground">
                                {payment.note || TYPE_LABELS[payment.type]}
                                {payment.servicePackage?.name && ` · ${payment.servicePackage.name} package`}
                              </p>
                            </div>
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            <Badge variant="outline" className="text-[10px]">
                              {TYPE_LABELS[payment.type]}
                            </Badge>
                            {hasDispute && (
                              <Badge variant="danger" className="capitalize">
                                Dispute: {payment.disputeStatus}
                              </Badge>
                            )}
                            {payment.escrowStatus === "held" ? (
                              <Badge variant="warning" className="flex items-center gap-1 text-[10px]">
                                <Lock className="h-3 w-3" /> In Escrow
                              </Badge>
                            ) : (
                              <Badge variant="success" className="flex items-center gap-1 text-[10px]">
                                <Unlock className="h-3 w-3" /> Released
                              </Badge>
                            )}
                            <div className="text-right">
                              <span className="text-sm font-semibold text-success">{formatCurrency(payment.netAmount || payment.amount)}</span>
                              {!!payment.commissionAmount && (
                                <p className="text-[10px] text-muted-foreground">
                                  {formatCurrency(payment.amount)} − {formatCurrency(payment.commissionAmount)} fee ({payment.commissionPercent}%)
                                </p>
                              )}
                            </div>
                            <Link
                              to={`/payments/${payment._id}/invoice`}
                              target="_blank"
                              className="text-muted-foreground hover:text-foreground"
                              title="Download invoice"
                            >
                              <Receipt className="h-4 w-4" />
                            </Link>
                            {payment.escrowStatus === "released" && payer && (
                              <Button variant="outline" size="sm" onClick={() => setRateClient({ id: payer._id, name: payer.name })}>
                                Rate Client
                              </Button>
                            )}
                            {hasOrderDetails && (
                              <button
                                type="button"
                                onClick={() => setExpandedPaymentId(isExpanded ? null : payment._id)}
                                className="text-muted-foreground hover:text-foreground"
                              >
                                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                              </button>
                            )}
                          </div>
                        </div>
                        {isExpanded && hasOrderDetails && (
                          <div className="mt-3 space-y-2 border-t border-border pt-3 text-xs">
                            {payment.servicePackage && (
                              <p>
                                <span className="text-muted-foreground">Package:</span>{" "}
                                <span className="font-medium capitalize">{payment.servicePackage.name}</span>
                                {payment.servicePackage.title && ` — ${payment.servicePackage.title}`}
                                {" · "}
                                {payment.servicePackage.deliveryDays}-day delivery
                                {!!payment.servicePackage.revisions && `, ${payment.servicePackage.revisions} revisions`}
                              </p>
                            )}
                            {hasDispute && (
                              <div className="rounded-md border border-danger/30 bg-danger/5 p-2.5">
                                <p className="font-medium text-danger">Dispute reason</p>
                                <p className="text-muted-foreground">{payment.disputeReason || "—"}</p>
                                {payment.disputeResolutionNote && (
                                  <>
                                    <p className="mt-1.5 font-medium">Resolution note</p>
                                    <p className="text-muted-foreground">{payment.disputeResolutionNote}</p>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {data && data.pagination.pages > 1 && (
            <div className="flex items-center justify-center gap-2">
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

          <Card>
            <CardContent className="p-6">
              <h3 className="mb-4 text-base font-semibold">Withdrawal Requests</h3>
              {loadingWithdrawals ? (
                <Skeleton className="h-20 w-full" />
              ) : !withdrawals?.length ? (
                <p className="py-6 text-center text-sm text-muted-foreground">No withdrawal requests yet.</p>
              ) : (
                <div className="space-y-3">
                  {withdrawals.map((w) => (
                    <div key={w._id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-4">
                      <div className="min-w-0">
                        <p className="text-sm font-medium">{formatCurrency(w.amount)}</p>
                        <p className="text-xs text-muted-foreground">
                          {w.method === "upi" ? w.upiId : `${w.bankAccountHolder} · ${w.bankAccountNumber}`} ·{" "}
                          {new Date(w.createdAt).toLocaleDateString()}
                          {w.provider === "razorpayx" && " · Sent via RazorpayX"}
                        </p>
                        {w.adminNote && <p className="mt-1 text-xs text-muted-foreground">Note: {w.adminNote}</p>}
                      </div>
                      <Badge variant={WITHDRAWAL_STATUS_VARIANT[w.status]} className="capitalize">
                        {w.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      <Dialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Withdraw Funds</DialogTitle>
            <DialogDescription>
              Available balance: {formatCurrency(wallet?.availableBalance ?? 0)}. An admin will review and send this to your account.
            </DialogDescription>
          </DialogHeader>
          {hasSavedPayoutDetails ? (
            <p className="text-xs text-muted-foreground">
              Pre-filled from your saved payout details.{" "}
              <Link to="/dashboard/profile" className="text-primary hover:underline">
                Change them
              </Link>
              .
            </p>
          ) : (
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Settings className="h-3.5 w-3.5" />
              <Link to="/dashboard/profile" className="text-primary hover:underline">
                Save your payout details
              </Link>{" "}
              so you don&apos;t have to re-enter them next time.
            </p>
          )}
          <div className="space-y-1.5">
            <Label>Amount (₹)</Label>
            <Input type="number" min={1} max={wallet?.availableBalance ?? 0} value={amount || ""} onChange={(e) => setAmount(Number(e.target.value))} />
          </div>
          <div className="space-y-1.5">
            <Label>Method</Label>
            <Select value={method} onValueChange={(v) => setMethod(v as WithdrawalMethod)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="upi">UPI</SelectItem>
                <SelectItem value="bank">Bank Transfer</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {method === "upi" ? (
            <div className="space-y-1.5">
              <Label>UPI ID</Label>
              <Input value={upiId} onChange={(e) => setUpiId(e.target.value)} placeholder="yourname@upi" />
            </div>
          ) : (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>Account Holder Name</Label>
                <Input value={bankAccountHolder} onChange={(e) => setBankAccountHolder(e.target.value)} placeholder="As per bank records" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Account Number</Label>
                  <Input value={bankAccountNumber} onChange={(e) => setBankAccountNumber(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>IFSC Code</Label>
                  <Input value={bankIfsc} onChange={(e) => setBankIfsc(e.target.value.toUpperCase())} placeholder="ABCD0123456" />
                </div>
              </div>
            </div>
          )}
          {withdrawMutation.isError && (
            <p className="text-xs text-danger">
              {isAxiosError(withdrawMutation.error) ? withdrawMutation.error.response?.data?.message : "Something went wrong."}
            </p>
          )}
          <Button
            className="mt-2 w-full"
            variant="gradient"
            disabled={!amount || !destinationValid || amount > (wallet?.availableBalance ?? 0) || withdrawMutation.isPending}
            onClick={() => withdrawMutation.mutate()}
          >
            {withdrawMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Request Withdrawal
          </Button>
        </DialogContent>
      </Dialog>

      {rateClient && (
        <RateClientModal
          clientId={rateClient.id}
          clientName={rateClient.name}
          open={!!rateClient}
          onOpenChange={(open) => !open && setRateClient(null)}
        />
      )}
    </DashboardLayout>
  );
}
