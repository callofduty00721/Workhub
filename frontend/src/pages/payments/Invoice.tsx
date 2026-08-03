import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Printer, ArrowLeft, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { paymentApi } from "@/api/payments";
import { useAuth } from "@/context/AuthContext";
import { formatCurrency } from "@/lib/utils";
import type { PaymentType } from "@/types";

const TYPE_LABELS: Record<PaymentType, string> = {
  gig_order: "Gig Order",
  job_hire: "Job / Project Hire",
  contest_prize: "Contest Prize",
  campaign: "Influencer Campaign",
};

export default function Invoice() {
  const { id = "" } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await paymentApi.downloadInvoice(id);
    } finally {
      setDownloading(false);
    }
  };

  const { data: payment, isLoading, isError } = useQuery({
    queryKey: ["payments", "invoice", id],
    queryFn: () => paymentApi.getById(id),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="container max-w-2xl space-y-4 py-10">
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  if (isError || !payment) {
    return (
      <div className="container py-20 text-center">
        <p className="text-lg font-semibold">Invoice not found</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate(-1)}>
          Go back
        </Button>
      </div>
    );
  }

  const payer = typeof payment.payer === "object" ? payment.payer : null;
  const payee = typeof payment.payee === "object" ? payment.payee : null;
  const isPayee = user?.id === payee?._id;

  return (
    <div className="container max-w-2xl py-10">
      <div className="mb-4 flex items-center justify-between print:hidden">
        <Button variant="ghost" size="sm" asChild>
          <Link to="#" onClick={(e) => (e.preventDefault(), navigate(-1))}>
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
        </Button>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="h-4 w-4" /> Print
          </Button>
          <Button variant="gradient" size="sm" disabled={payment.status !== "paid" || downloading} onClick={handleDownload}>
            {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} Download PDF
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-background p-8 print:border-0 print:p-0">
        <div className="flex items-start justify-between border-b border-border pb-6">
          <div>
            <h1 className="text-xl font-bold text-primary">MahaHub</h1>
            <p className="text-xs text-muted-foreground">Payment Invoice</p>
          </div>
          <div className="text-right text-xs text-muted-foreground">
            <p>Invoice #{payment._id.slice(-8).toUpperCase()}</p>
            <p>{new Date(payment.createdAt).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 border-b border-border py-6 text-sm">
          <div>
            <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">From</p>
            <p className="font-medium">{payee?.name}</p>
            {payee?.email && <p className="text-muted-foreground">{payee.email}</p>}
          </div>
          <div>
            <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">Billed To</p>
            <p className="font-medium">{payer?.companyName || payer?.name}</p>
            {payer?.email && <p className="text-muted-foreground">{payer.email}</p>}
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
                {payment.note || TYPE_LABELS[payment.type]}
                {payment.servicePackage?.name && (
                  <span className="block text-xs capitalize text-muted-foreground">{payment.servicePackage.name} package</span>
                )}
              </td>
              <td className="py-3 text-right font-medium">{formatCurrency(payment.amount)}</td>
            </tr>
            {isPayee && !!payment.commissionAmount && (
              <tr className="border-t border-border text-muted-foreground">
                <td className="py-3">Platform commission ({payment.commissionPercent}%)</td>
                <td className="py-3 text-right">− {formatCurrency(payment.commissionAmount)}</td>
              </tr>
            )}
          </tbody>
        </table>

        <div className="flex justify-end py-6">
          <div className="w-56 space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{isPayee ? "Gross Amount" : "Amount Paid"}</span>
              <span>{formatCurrency(payment.amount)}</span>
            </div>
            {isPayee && !!payment.commissionAmount && (
              <div className="flex justify-between text-muted-foreground">
                <span>Platform Fee</span>
                <span>− {formatCurrency(payment.commissionAmount)}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-border pt-1.5 text-base font-bold">
              <span>{isPayee ? "Net Payout" : "Total"}</span>
              <span>{formatCurrency(isPayee ? payment.netAmount || payment.amount : payment.amount)}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 border-t border-border pt-6 text-xs text-muted-foreground">
          <div>
            <p>
              Status: <span className="font-medium capitalize text-foreground">{payment.status}</span>
            </p>
            {payment.providerPaymentId && <p className="mt-1">Payment ID: {payment.providerPaymentId}</p>}
          </div>
          <div className="text-right">
            <p>This is a computer-generated invoice.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
