import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Printer, ArrowLeft, Download, Loader2, Mail, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { paymentApi } from "@/api/payments";
import { formatCurrency } from "@/lib/utils";
import { ROLE_LABELS } from "@/lib/roles";

export default function SubscriptionInvoice() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const [downloading, setDownloading] = useState(false);
  const [emailState, setEmailState] = useState<"idle" | "sending" | "sent" | "error">("idle");

  const {
    data: subscription,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["payments", "subscriptions", id],
    queryFn: () => paymentApi.getSubscriptionById(id),
    enabled: !!id,
  });

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await paymentApi.downloadSubscriptionInvoice(id);
    } finally {
      setDownloading(false);
    }
  };

  const handleEmail = async () => {
    setEmailState("sending");
    try {
      await paymentApi.emailSubscriptionInvoice(id);
      setEmailState("sent");
    } catch {
      setEmailState("error");
    }
  };

  if (isLoading) {
    return (
      <div className="container max-w-2xl space-y-4 py-10">
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  if (isError || !subscription) {
    return (
      <div className="container py-20 text-center">
        <p className="text-lg font-semibold">Invoice not found</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate(-1)}>
          Go back
        </Button>
      </div>
    );
  }

  const roleLabel = ROLE_LABELS[subscription.role] ?? subscription.role;

  return (
    <div className="container max-w-2xl py-10">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 print:hidden">
        <Button variant="ghost" size="sm" asChild>
          <Link to="#" onClick={(e) => (e.preventDefault(), navigate(-1))}>
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
        </Button>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="h-4 w-4" /> Print
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={subscription.status !== "active" || emailState === "sending"}
            onClick={handleEmail}
          >
            {emailState === "sending" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
            {emailState === "sent" ? "Sent" : "Email Invoice"}
          </Button>
          <Button variant="gradient" size="sm" disabled={subscription.status !== "active" || downloading} onClick={handleDownload}>
            {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} Download PDF
          </Button>
        </div>
      </div>

      {emailState === "sent" && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-success/30 bg-success/10 px-3.5 py-2.5 text-sm text-success print:hidden">
          <CheckCircle2 className="h-4 w-4 shrink-0" /> Invoice emailed to your registered email address.
        </div>
      )}
      {emailState === "error" && (
        <div className="mb-4 rounded-lg border border-danger/30 bg-danger/10 px-3.5 py-2.5 text-sm text-danger print:hidden">
          Couldn't send the invoice email. Please try again.
        </div>
      )}

      <div className="rounded-xl border border-border bg-background p-8 print:border-0 print:p-0">
        <div className="flex items-start justify-between border-b border-border pb-6">
          <div>
            <h1 className="text-xl font-bold text-primary">GrowHive</h1>
            <p className="text-xs text-muted-foreground">Subscription Invoice</p>
          </div>
          <div className="text-right text-xs text-muted-foreground">
            <p>Invoice #{subscription._id.slice(-8).toUpperCase()}</p>
            <p>{new Date(subscription.createdAt).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 border-b border-border py-6 text-sm">
          <div>
            <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">Billed To</p>
            <p className="font-medium">{subscription.user.name}</p>
            <p className="text-muted-foreground">{subscription.user.email}</p>
          </div>
          <div>
            <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">Billing Period</p>
            <p className="text-muted-foreground">
              {subscription.startedAt ? new Date(subscription.startedAt).toLocaleDateString() : "—"}
              {" – "}
              {subscription.expiresAt ? new Date(subscription.expiresAt).toLocaleDateString() : "—"}
            </p>
          </div>
        </div>

        <table className="w-full border-b border-border py-4 text-sm">
          <thead>
            <tr className="text-left text-xs uppercase text-muted-foreground">
              <th className="py-3">Description</th>
              <th className="py-3 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t border-border">
              <td className="py-3">
                {roleLabel} — {subscription.plan} plan
                <span className="block text-xs capitalize text-muted-foreground">
                  {subscription.billingCycle} billing · Qty 1
                </span>
              </td>
              <td className="py-3 text-right font-medium">{formatCurrency(subscription.amount)}</td>
            </tr>
          </tbody>
        </table>

        <div className="flex justify-end py-6">
          <div className="w-56 space-y-1.5 text-sm">
            <div className="flex justify-between border-t border-border pt-1.5 text-base font-bold">
              <span>Total Paid</span>
              <span>{formatCurrency(subscription.amount)}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 border-t border-border pt-6 text-xs text-muted-foreground">
          <div>
            <p>
              Status: <span className="font-medium capitalize text-foreground">{subscription.status}</span>
            </p>
            <p className="mt-1">Gateway: {subscription.provider === "stripe" ? "Stripe" : "Razorpay"}</p>
            {subscription.providerPaymentId && <p className="mt-1">Transaction ID: {subscription.providerPaymentId}</p>}
          </div>
          <div className="text-right">
            <p>This is a computer-generated invoice.</p>
            <p className="mt-2">
              <Link to="/pricing" className="font-medium text-primary hover:underline">
                Renew or manage plan →
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
