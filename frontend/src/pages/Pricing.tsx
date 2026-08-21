import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { Check, Loader2, Sparkles, ShieldCheck, HelpCircle, Receipt } from "lucide-react";
import { paymentApi } from "@/api/payments";
import { plansApi } from "@/api/plans";
import { publicSettingsApi } from "@/api/settings";
import { useAuth } from "@/context/AuthContext";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, cn } from "@/lib/utils";
import { loadRazorpayScript } from "@/lib/razorpay";
import { ROLE_LABELS } from "@/lib/roles";
import type { PlanTier, PlanRole, BillingCycle, Subscription } from "@/types";

function subscriptionStatusBadge(status: Subscription["status"]) {
  if (status === "active") return <Badge variant="success">Paid</Badge>;
  if (status === "pending") return <Badge variant="outline">Pending</Badge>;
  if (status === "failed") return <Badge variant="danger">Failed</Badge>;
  return <Badge variant="outline">{status}</Badge>;
}

const asPlanRole = (role: string | null | undefined): PlanRole | null => (role && role !== "super_admin" ? (role as PlanRole) : null);

export default function Pricing() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loadingTier, setLoadingTier] = useState<PlanTier | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");

  // Plans are per-role — a roleless visitor/user (or super_admin, who isn't
  // priced at all) has nothing to price yet.
  const role = asPlanRole(user?.role);

  const { data: plans, isLoading: plansLoading } = useQuery({
    queryKey: ["plans", role],
    queryFn: () => plansApi.forRole(role!),
    enabled: !!role,
  });

  // role in the key — see FreelancerDashboard.tsx's identical comment;
  // without it, switching roles (an SPA-internal navigation, no reload)
  // would keep showing the previous role's subscription from cache.
  const { data: subscription } = useQuery({
    queryKey: ["payments", "subscription", role],
    queryFn: paymentApi.mySubscription,
    enabled: !!user,
  });

  // Recent invoice history, independent of the single "current" subscription
  // above — the natural place to look for a past invoice, since every role
  // dashboard's "Upgrade Plan" link already points here.
  const { data: history } = useQuery({
    queryKey: ["payments", "subscriptions", "mine"],
    queryFn: () => paymentApi.mySubscriptions({ limit: 5 }),
    enabled: !!user,
  });

  // Real per-gateway config check, not a hardcoded toggle — the Stripe
  // button disappears the moment STRIPE_SECRET_KEY is unset, and reappears
  // the moment it's set, no code change needed either way.
  const { data: gateways } = useQuery({
    queryKey: ["settings", "payment-gateways"],
    queryFn: publicSettingsApi.paymentGateways,
    staleTime: 60 * 1000,
  });

  const handleRazorpay = async (tier: PlanTier) => {
    if (!user) return navigate("/login");
    if (!role) return;
    setError(null);
    setLoadingTier(tier);
    try {
      await loadRazorpayScript();
      const order = await paymentApi.createRazorpayOrder(role, tier, billingCycle);

      const razorpay = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        order_id: order.orderId,
        name: "GrowHive",
        description: `${ROLE_LABELS[role]} — ${tier} plan (${billingCycle}) subscription`,
        handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
          await paymentApi.verifyRazorpayPayment(response);
          window.location.reload();
        },
        prefill: { name: user.name, email: user.email },
        theme: { color: "#111111" },
      });
      razorpay.open();
    } catch (err) {
      setError(isAxiosError(err) ? err.response?.data?.message || "Payment failed" : "Payment gateway unavailable");
    } finally {
      setLoadingTier(null);
    }
  };

  const handleStripe = async (tier: PlanTier) => {
    if (!user) return navigate("/login");
    if (!role) return;
    setError(null);
    setLoadingTier(tier);
    try {
      const { checkoutUrl } = await paymentApi.createStripeCheckout(role, tier, billingCycle);
      window.location.href = checkoutUrl;
    } catch (err) {
      setError(isAxiosError(err) ? err.response?.data?.message || "Payment failed" : "Payment gateway unavailable");
      setLoadingTier(null);
    }
  };

  return (
    <div className="bg-[#F7F8F5]">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-[#E5E7EB] bg-white">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -left-20 -top-20 h-[300px] w-[300px] rounded-full bg-[#B6FF00]/25 blur-[100px]" />
          <div className="absolute -right-10 top-0 h-[260px] w-[260px] rounded-full bg-violet-300/20 blur-[100px]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,_rgba(15,23,42,0.05)_1px,_transparent_0)] bg-[size:26px_26px] opacity-40" />
        </div>
        <div className="container py-14 text-center">
          <span className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-[#E5E7EB] bg-[#F1FFD6] px-3 py-1 text-[11.5px] font-semibold text-[#3F6212]">
            <Sparkles className="h-3 w-3" /> Simple, transparent pricing
          </span>
          <h1 className="mx-auto max-w-xl text-[32px] font-extrabold leading-tight tracking-tight text-[#111111] sm:text-[40px]">
            Choose the plan that fits <span className="text-[#3F6212]">where you are</span>
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-[14.5px] text-[#6B7280]">
            {role
              ? `Plans for ${ROLE_LABELS[role]}. No hidden fees — upgrade, downgrade, or cancel anytime.`
              : "Pick a role from your account to see plans built for it."}
          </p>
        </div>
      </section>

      <div className="container py-12">
        {error && (
          <div className="mx-auto mb-8 max-w-lg rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-center text-sm text-red-700">{error}</div>
        )}

        {subscription && subscription.status === "active" && (
          <div className="mx-auto mb-8 flex max-w-lg items-center justify-center gap-2 rounded-xl border border-[#E5E7EB] bg-[#F1FFD6] px-4 py-3 text-center text-[13px] text-[#3F6212]">
            <ShieldCheck className="h-4 w-4 shrink-0" /> You're currently on the{" "}
            <span className="font-bold capitalize">{subscription.plan}</span> plan for {ROLE_LABELS[subscription.role]}.
          </div>
        )}

        {!!history?.data.length && (
          <div className="mx-auto mb-8 max-w-lg rounded-[20px] border border-[#E5E7EB] bg-white p-5">
            <p className="mb-3 flex items-center gap-1.5 text-[13px] font-semibold text-[#111111]">
              <Receipt className="h-4 w-4 text-[#6B7280]" /> Recent invoices
            </p>
            <div className="space-y-2">
              {history.data.map((s) => (
                <Link
                  key={s._id}
                  to={`/subscriptions/${s._id}/invoice`}
                  className="flex items-center justify-between gap-3 rounded-lg border border-[#E5E7EB] px-3.5 py-2.5 text-[13px] transition-colors hover:border-[#B6FF00]/60 hover:bg-[#F7F8F5]"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-[#111111]">
                      {ROLE_LABELS[s.role]} — <span className="capitalize">{s.plan}</span>
                    </p>
                    <p className="text-[11.5px] text-[#9CA3AF]">{new Date(s.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="font-semibold text-[#111111]">{formatCurrency(s.amount)}</span>
                    {subscriptionStatusBadge(s.status)}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {!role ? (
          <div className="mx-auto max-w-lg rounded-[20px] border border-[#E5E7EB] bg-white p-6 text-center text-sm text-[#4B5563]">
            {user ? (
              <>
                You haven't picked a role yet.{" "}
                <Link to="/dashboard/explore" className="font-semibold text-[#111111] hover:underline">
                  Choose one
                </Link>{" "}
                to see plans built for it.
              </>
            ) : (
              <>
                <Link to="/login" className="font-semibold text-[#111111] hover:underline">
                  Log in
                </Link>{" "}
                to see plans for your role.
              </>
            )}
          </div>
        ) : plansLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-[#111111]" />
          </div>
        ) : (
          <>
            <div className="mx-auto mb-8 flex w-fit items-center justify-center gap-2 rounded-full border border-[#E5E7EB] bg-white p-1">
              {(["monthly", "yearly"] as const).map((cycle) => (
                <button
                  key={cycle}
                  type="button"
                  onClick={() => setBillingCycle(cycle)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-full px-4 py-1.5 text-[13px] font-semibold transition-colors",
                    billingCycle === cycle ? "bg-[#111111] text-white" : "text-[#6B7280] hover:text-[#111111]"
                  )}
                >
                  {cycle === "monthly" ? "Monthly" : "Yearly"}
                  {cycle === "yearly" && (
                    <span
                      className={cn(
                        "rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                        billingCycle === "yearly" ? "bg-white/20 text-white" : "bg-[#ECFDF3] text-[#16A34A]"
                      )}
                    >
                      Save up to 17%
                    </span>
                  )}
                </button>
              ))}
            </div>

            <div className="grid gap-5 sm:grid-cols-3">
              {plans?.map((plan) => {
                const isPopular = plan.tier === "pro";
                const price = billingCycle === "yearly" ? plan.priceInInrYearly : plan.priceInInr;
                const monthlyEquivalent = billingCycle === "yearly" && price > 0 ? Math.round(price / 12) : null;
                const savingsPct =
                  billingCycle === "yearly" && plan.priceInInr > 0 && plan.priceInInrYearly > 0
                    ? Math.round((1 - plan.priceInInrYearly / (plan.priceInInr * 12)) * 100)
                    : 0;
                return (
                  <div
                    key={plan._id}
                    className={cn(
                      "group relative flex flex-col rounded-[22px] border bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-all duration-300 hover:-translate-y-1",
                      isPopular
                        ? "border-[#B6FF00] shadow-[0_20px_44px_-20px_rgba(182,255,0,0.35)]"
                        : "border-[#E5E7EB] hover:border-[#B6FF00]/60 hover:shadow-[0_20px_40px_-18px_rgba(15,23,42,0.14)]"
                    )}
                  >
                    {isPopular && (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#B6FF00] px-3 py-1 text-[10.5px] font-bold text-[#111111] shadow-[0_8px_18px_-8px_rgba(182,255,0,0.7)]">
                        Most Popular
                      </span>
                    )}
                    <h3 className="text-[15px] font-bold text-[#111111]">{plan.name}</h3>
                    <p className="mt-2 flex items-baseline gap-1">
                      <span className="text-[30px] font-extrabold tabular-nums tracking-tight text-[#111111]">{formatCurrency(price)}</span>
                      {price > 0 && <span className="text-[12.5px] text-[#9CA3AF]">/{billingCycle === "yearly" ? "year" : "month"}</span>}
                    </p>
                    {monthlyEquivalent !== null && (
                      <p className="mt-0.5 text-[11.5px] text-[#9CA3AF]">
                        {formatCurrency(monthlyEquivalent)}/month, billed yearly
                        {savingsPct > 0 && <span className="ml-1 font-semibold text-[#16A34A]">— save {savingsPct}%</span>}
                      </p>
                    )}
                    <ul className="my-6 flex-1 space-y-2.5">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-2 text-[12.5px] text-[#4B5563]">
                          <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#3F6212]" /> {feature}
                        </li>
                      ))}
                    </ul>
                    {price === 0 ? (
                      <button type="button" disabled className="w-full rounded-full border border-[#E5E7EB] bg-white py-2.5 text-sm font-semibold text-[#9CA3AF]">
                        Current Default
                      </button>
                    ) : !gateways?.razorpay && !gateways?.stripe ? (
                      <button type="button" disabled className="w-full rounded-full border border-[#E5E7EB] bg-white py-2.5 text-sm font-semibold text-[#9CA3AF]">
                        Checkout unavailable
                      </button>
                    ) : (
                      <div className="space-y-2">
                        {gateways?.razorpay && (
                          <button
                            type="button"
                            disabled={loadingTier === plan.tier}
                            onClick={() => handleRazorpay(plan.tier)}
                            className={cn(
                              "flex w-full items-center justify-center gap-1.5 rounded-full py-2.5 text-sm font-semibold transition-colors disabled:opacity-50",
                              isPopular ? "bg-[#111111] text-white hover:bg-[#B6FF00] hover:text-[#111111]" : "border border-[#E5E7EB] bg-white text-[#111111] hover:bg-[#F1F3EF]"
                            )}
                          >
                            {loadingTier === plan.tier && <Loader2 className="h-4 w-4 animate-spin" />}
                            Pay with Razorpay
                          </button>
                        )}
                        {gateways?.stripe && (
                          <button
                            type="button"
                            disabled={loadingTier === plan.tier}
                            onClick={() => handleStripe(plan.tier)}
                            className="flex w-full items-center justify-center gap-1.5 rounded-full py-2.5 text-sm font-semibold text-[#6B7280] transition-colors hover:bg-[#F1F3EF] disabled:opacity-50"
                          >
                            Pay with Stripe
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}

        <p className="mx-auto mt-8 max-w-lg text-center text-xs text-[#9CA3AF]">
          Payments require the platform operator to configure Razorpay/Stripe API keys. If a gateway isn't configured yet, checkout will show an
          error instead of charging you.
        </p>

        <div className="mx-auto mt-4 flex max-w-lg items-center justify-center gap-1.5 text-[13px] text-[#6B7280]">
          <HelpCircle className="h-4 w-4 shrink-0 text-[#9CA3AF]" />
          Have questions?{" "}
          <Link to="/#faq" className="font-semibold text-[#111111] hover:underline">
            Check our FAQ
          </Link>
        </div>
      </div>
    </div>
  );
}
