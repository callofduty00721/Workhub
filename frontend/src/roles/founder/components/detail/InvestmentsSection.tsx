import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { Wallet, CheckCircle2, MessageSquare, Loader2, ShieldCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { investmentApi } from "@/api/investments";
import { authApi } from "@/api/auth";
import { loadRazorpayScript } from "@/lib/razorpay";
import { formatCurrency, initialsFromName } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { SectionCard, EmptyNote, isRecentAccount } from "./shared";

const INVESTMENT_STATUS_META: Record<string, { label: string; bg: string; fg: string }> = {
  pending: { label: "Pending Confirmation", bg: "#fdf1de", fg: "#d97706" },
  confirmed: { label: "Confirmed", bg: "#ffece5", fg: "#FF5722" },
  declined: { label: "Declined", bg: "#fce8e8", fg: "#dc2626" },
};

const VERIFICATION_FEE_INR = 199;

export function InvestmentsSection({
  startupId,
  isOwner,
  canReport,
  onMessageFounder,
  isStartupVerified,
  isFounderVerified,
}: {
  startupId: string;
  isOwner: boolean;
  canReport: boolean;
  onMessageFounder: () => void;
  isStartupVerified: boolean;
  isFounderVerified: boolean;
}) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [isPaySubmitting, setIsPaySubmitting] = useState(false);

  const { data: investments, isLoading } = useQuery({
    queryKey: ["startups", startupId, "investments"],
    queryFn: () => investmentApi.list(startupId),
    enabled: !!user,
  });

  const createMutation = useMutation({
    mutationFn: () => investmentApi.create(startupId, { amount: Number(amount), note: note || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["startups", startupId, "investments"] });
      setAmount("");
      setNote("");
      setShowForm(false);
      setFormError(null);
    },
    onError: (err) => {
      setFormError(isAxiosError(err) ? err.response?.data?.message || "Could not submit your report." : "Could not submit your report.");
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ investmentId, status }: { investmentId: string; status: "confirmed" | "declined" }) =>
      investmentApi.updateStatus(investmentId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["startups", startupId, "investments"] });
      queryClient.invalidateQueries({ queryKey: ["startups", startupId] });
    },
  });

  const resendVerificationMutation = useMutation({
    mutationFn: () => authApi.resendVerification(),
  });

  const handleVerify = async (investmentId: string) => {
    if (!user) return;
    setVerifyError(null);
    setVerifyingId(investmentId);
    try {
      await loadRazorpayScript();
      const order = await investmentApi.createVerificationOrder(investmentId);

      const razorpay = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        order_id: order.orderId,
        name: "MahaHub",
        description: "Investment report verification fee",
        handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
          await investmentApi.confirmVerificationPayment(investmentId, response);
          queryClient.invalidateQueries({ queryKey: ["startups", startupId, "investments"] });
          setVerifyingId(null);
        },
        prefill: { name: user.name, email: user.email },
        theme: { color: "#FF5722" },
        modal: { ondismiss: () => setVerifyingId(null) },
      });
      razorpay.open();
    } catch (err) {
      setVerifyError(isAxiosError(err) ? err.response?.data?.message || "Verification payment failed." : "Payment gateway unavailable.");
      setVerifyingId(null);
    }
  };

  const handlePayAndSubmit = async () => {
    if (!user || !(Number(amount) > 0)) return;
    setFormError(null);
    setIsPaySubmitting(true);
    try {
      await loadRazorpayScript();
      const order = await investmentApi.createPreVerificationOrder(startupId, Number(amount));

      const razorpay = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        order_id: order.orderId,
        name: "MahaHub",
        description: "Investment report + verification fee",
        handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
          try {
            await investmentApi.createVerified(startupId, { amount: Number(amount), note: note || undefined, ...response });
            queryClient.invalidateQueries({ queryKey: ["startups", startupId, "investments"] });
            setAmount("");
            setNote("");
            setShowForm(false);
          } catch (err) {
            setFormError(
              isAxiosError(err)
                ? err.response?.data?.message ||
                    "Payment succeeded but we couldn't save your report — please contact support with your payment reference."
                : "Payment succeeded but we couldn't save your report — please contact support with your payment reference."
            );
          } finally {
            setIsPaySubmitting(false);
          }
        },
        prefill: { name: user.name, email: user.email },
        theme: { color: "#FF5722" },
        modal: { ondismiss: () => setIsPaySubmitting(false) },
      });
      razorpay.open();
    } catch (err) {
      setFormError(isAxiosError(err) ? err.response?.data?.message || "Payment failed." : "Payment gateway unavailable.");
      setIsPaySubmitting(false);
    }
  };

  const myInvestment = investments?.find((inv) => inv.investor._id === user?.id);

  if (!user) return null;

  return (
    <SectionCard title="Investment Records" icon={Wallet} iconColor="#FF5722">
      <p className="mb-3 text-[11px] text-[#94a3b8]">
        Self-reported by investors — MahaHub does not process or verify the investment itself. Founders should confirm only after receiving
        funds through their own banking/legal process.
      </p>

      {isOwner ? (
        isLoading ? (
          <EmptyNote text="Loading investment records..." />
        ) : !investments?.length ? (
          <EmptyNote text="No investments reported yet." />
        ) : (
          <div className="divide-y divide-[#f1f5f9]">
            {investments.map((inv) => {
              const meta = INVESTMENT_STATUS_META[inv.status];
              return (
                <div key={inv._id} className="flex items-center gap-3 py-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#7c3aed] to-[#4c1d95] text-xs font-bold text-white">
                    {inv.investor.avatar ? <img src={inv.investor.avatar} alt="" className="h-full w-full rounded-full object-cover" /> : initialsFromName(inv.investor.name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <p className="text-[13px] font-bold">{inv.investor.name}</p>
                      {inv.verified && (
                        <span className="flex items-center gap-1 rounded-full bg-[#ffece5] px-2 py-0.5 text-[10px] font-bold text-[#FF5722]">
                          <CheckCircle2 className="h-3 w-3" /> Verified
                        </span>
                      )}
                      {isRecentAccount(inv.investor.createdAt) && (
                        <span className="rounded-full bg-[#fce8e8] px-2 py-0.5 text-[10px] font-bold text-[#dc2626]">New Investor</span>
                      )}
                      {inv.refunded && (
                        <span className="rounded-full bg-[#f1f5f9] px-2 py-0.5 text-[10px] font-bold text-[#64748b]">Verification Fee Refunded</span>
                      )}
                    </div>
                    <p className="text-[11.5px] text-[#64748b]">
                      {formatCurrency(inv.amount)} · {new Date(inv.createdAt).toLocaleDateString()}
                    </p>
                    {inv.note && <p className="mt-0.5 text-[11px] text-[#94a3b8]">{inv.note}</p>}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="rounded-full px-2.5 py-1 text-[10.5px] font-bold" style={{ background: meta.bg, color: meta.fg }}>
                      {meta.label}
                    </span>
                    {inv.status === "pending" && (
                      <>
                        <button
                          onClick={() => statusMutation.mutate({ investmentId: inv._id, status: "confirmed" })}
                          disabled={statusMutation.isPending}
                          className="rounded-lg border border-[#FF5722] px-2.5 py-1 text-[11px] font-bold text-[#FF5722] hover:bg-[#ffece5]"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => statusMutation.mutate({ investmentId: inv._id, status: "declined" })}
                          disabled={statusMutation.isPending}
                          className="rounded-lg border border-[#e2e8f0] px-2.5 py-1 text-[11px] font-bold text-[#64748b] hover:bg-[#f8fafc]"
                        >
                          Decline
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : myInvestment && !(myInvestment.status === "declined" && showForm) ? (
        <div className="space-y-2 rounded-lg border border-[#e2e8f0] p-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="flex items-center gap-1.5 text-[13px] font-bold">
                You reported {formatCurrency(myInvestment.amount)}
                {myInvestment.verified && (
                  <span className="flex items-center gap-1 rounded-full bg-[#ffece5] px-2 py-0.5 text-[10px] font-bold text-[#FF5722]">
                    <CheckCircle2 className="h-3 w-3" /> Verified
                  </span>
                )}
              </p>
              <p className="text-[11px] text-[#94a3b8]">{new Date(myInvestment.createdAt).toLocaleDateString()}</p>
            </div>
            <span
              className="rounded-full px-2.5 py-1 text-[10.5px] font-bold"
              style={{ background: INVESTMENT_STATUS_META[myInvestment.status].bg, color: INVESTMENT_STATUS_META[myInvestment.status].fg }}
            >
              {INVESTMENT_STATUS_META[myInvestment.status].label}
            </span>
          </div>
          {myInvestment.refunded ? (
            <p className="border-t border-[#f1f5f9] pt-2 text-[11px] text-[#94a3b8]">
              The founder didn&apos;t respond within 15 days, so ₹{myInvestment.refundAmount} of your verification fee was auto-refunded on{" "}
              {myInvestment.refundedAt && new Date(myInvestment.refundedAt).toLocaleDateString()}.
            </p>
          ) : (
            !myInvestment.verified &&
            myInvestment.status !== "declined" && (
              <div className="border-t border-[#f1f5f9] pt-2">
                <button
                  onClick={() => handleVerify(myInvestment._id)}
                  disabled={verifyingId === myInvestment._id}
                  className="flex items-center gap-1.5 rounded-lg border border-[#FF5722] px-3 py-1.5 text-[11.5px] font-bold text-[#FF5722] hover:bg-[#ffece5] disabled:opacity-50"
                >
                  {verifyingId === myInvestment._id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ShieldCheck className="h-3.5 w-3.5" />}
                  Get Verified (₹{VERIFICATION_FEE_INR})
                </button>
                <p className="mt-1 text-[10.5px] text-[#94a3b8]">
                  Optional. Adds a Verified badge to your report. If the founder doesn&apos;t respond within 15 days, 94% of this fee (₹187) is
                  automatically refunded.
                </p>
                {verifyError && <p className="mt-1 text-[10.5px] text-danger">{verifyError}</p>}
              </div>
            )
          )}
          {myInvestment.status === "declined" && canReport && (
            <div className="border-t border-[#f1f5f9] pt-2">
              <button
                onClick={() => setShowForm(true)}
                className="flex items-center gap-1.5 rounded-lg border border-[#FF5722] px-3 py-1.5 text-[11.5px] font-bold text-[#FF5722] hover:bg-[#ffece5]"
              >
                <Wallet className="h-3.5 w-3.5" /> Report a New Investment
              </button>
            </div>
          )}
        </div>
      ) : canReport ? (
        <>
          {!isStartupVerified && (
            <div className="mb-3 flex items-start gap-2 rounded-lg border border-[#fce8e8] bg-[#fef7f7] p-3">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#dc2626]" />
              <p className="text-[11.5px] text-[#dc2626]">
                {isFounderVerified
                  ? "MahaHub has confirmed the founder's identity, but not the business registration or funding claims. Do your own due diligence before sending any money."
                  : "MahaHub has not independently verified this startup, its founder, or its funding claims. Do your own due diligence — confirm the founder's identity and business before sending any money."}
              </p>
            </div>
          )}
          <div className="mb-3 flex flex-wrap gap-2">
            <button onClick={onMessageFounder} className="flex items-center gap-1.5 rounded-lg border border-[#e2e8f0] px-3.5 py-2 text-[12px] font-bold text-[#0f172a] hover:bg-[#f8fafc]">
              <MessageSquare className="h-3.5 w-3.5" /> Message Founder First
            </button>
            {!showForm && (
              <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 rounded-lg bg-[#FF5722] px-3.5 py-2 text-[12px] font-bold text-white hover:opacity-90">
                <Wallet className="h-3.5 w-3.5" /> I&apos;ve Invested
              </button>
            )}
          </div>
          <p className="mb-3 text-[10.5px] text-[#94a3b8]">Discuss the details with the founder first, and only report an investment once you&apos;ve actually sent the funds.</p>

          {showForm && (
            <div className="space-y-2 rounded-xl border border-[#e2e8f0] p-4">
              <Input type="number" min={1} placeholder="Amount invested (₹)" value={amount} onChange={(e) => setAmount(e.target.value)} />
              <Textarea placeholder="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} className="min-h-[60px]" />
              <p className="text-[10.5px] text-[#94a3b8]">
                By submitting, you confirm you have actually sent this amount to the founder outside MahaHub. This is not a verified transaction.
              </p>
              {formError && (
                <div className="space-y-1.5">
                  <p className="text-[11px] text-danger">{formError}</p>
                  {formError.toLowerCase().includes("verify your email") && (
                    <button
                      type="button"
                      onClick={() => resendVerificationMutation.mutate()}
                      disabled={resendVerificationMutation.isPending || resendVerificationMutation.isSuccess}
                      className="text-[11px] font-bold text-[#FF5722] hover:underline disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {resendVerificationMutation.isSuccess
                        ? "Verification email sent — check your inbox"
                        : resendVerificationMutation.isPending
                          ? "Sending..."
                          : "Resend verification email"}
                    </button>
                  )}
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={handlePayAndSubmit}
                  disabled={!(Number(amount) > 0) || isPaySubmitting || createMutation.isPending}
                  className="flex items-center gap-1.5 rounded-lg bg-[#FF5722] px-3.5 py-2 text-[12px] font-bold text-white disabled:opacity-50"
                >
                  {isPaySubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ShieldCheck className="h-3.5 w-3.5" />}
                  Pay ₹{VERIFICATION_FEE_INR} &amp; Submit as Verified
                </button>
                <button
                  onClick={() => Number(amount) > 0 && createMutation.mutate()}
                  disabled={!(Number(amount) > 0) || createMutation.isPending || isPaySubmitting}
                  className="flex items-center gap-1.5 rounded-lg border border-[#e2e8f0] px-3.5 py-2 text-[12px] font-bold text-[#0f172a] hover:bg-[#f8fafc] disabled:opacity-50"
                >
                  {createMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}Submit without Paying
                </button>
                <button onClick={() => setShowForm(false)} className="rounded-lg border border-[#e2e8f0] px-3.5 py-2 text-[12px] font-bold text-[#0f172a]">
                  Cancel
                </button>
              </div>
            </div>
          )}
        </>
      ) : null}
    </SectionCard>
  );
}
