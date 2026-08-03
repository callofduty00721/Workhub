import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { Check, Loader2, Sparkles, ShieldCheck, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { paymentApi } from "@/api/payments";
import { plansApi } from "@/api/plans";
import { useAuth } from "@/context/AuthContext";
import { formatCurrency, cn } from "@/lib/utils";
import { loadRazorpayScript } from "@/lib/razorpay";
import { ROLE_LABELS } from "@/lib/roles";
import type { PlanTier, PlanRole } from "@/types";

const asPlanRole = (role: string | null | undefined): PlanRole | null => (role && role !== "super_admin" ? (role as PlanRole) : null);

export default function Pricing() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loadingTier, setLoadingTier] = useState<PlanTier | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Plans are per-role — a roleless visitor/user (or super_admin, who isn't
  // priced at all) has nothing to price yet.
  const role = asPlanRole(user?.role);

  const { data: plans, isLoading: plansLoading } = useQuery({
    queryKey: ["plans", role],
    queryFn: () => plansApi.forRole(role!),
    enabled: !!role,
  });

  const { data: subscription } = useQuery({ queryKey: ["payments", "subscription"], queryFn: paymentApi.mySubscription, enabled: !!user });

  const handleRazorpay = async (tier: PlanTier) => {
    if (!user) return navigate("/login");
    if (!role) return;
    setError(null);
    setLoadingTier(tier);
    try {
      await loadRazorpayScript();
      const order = await paymentApi.createRazorpayOrder(role, tier);

      const razorpay = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        order_id: order.orderId,
        name: "MahaHub",
        description: `${ROLE_LABELS[role]} — ${tier} plan subscription`,
        handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
          await paymentApi.verifyRazorpayPayment(response);
          window.location.reload();
        },
        prefill: { name: user.name, email: user.email },
        theme: { color: "#2563EB" },
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
      const { checkoutUrl } = await paymentApi.createStripeCheckout(role, tier);
      window.location.href = checkoutUrl;
    } catch (err) {
      setError(isAxiosError(err) ? err.response?.data?.message || "Payment failed" : "Payment gateway unavailable");
      setLoadingTier(null);
    }
  };

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-neutral-100 bg-white">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -left-20 -top-20 h-[300px] w-[300px] rounded-full bg-primary/15 blur-[100px]" />
          <div className="absolute -right-10 top-0 h-[260px] w-[260px] rounded-full bg-violet-400/15 blur-[100px]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,_rgba(15,23,42,0.05)_1px,_transparent_0)] bg-[size:26px_26px] opacity-40" />
        </div>
        <div className="container py-14 text-center">
          <span className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-primary/15 bg-primary/5 px-3 py-1 text-[11.5px] font-semibold text-primary">
            <Sparkles className="h-3 w-3" /> Simple, transparent pricing
          </span>
          <h1 className="mx-auto max-w-xl text-[32px] font-extrabold leading-tight tracking-tight text-neutral-900 sm:text-[40px]">
            Choose the plan that fits{" "}
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">where you are</span>
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-[14.5px] text-neutral-500">
            {role
              ? `Plans for ${ROLE_LABELS[role]}. No hidden fees — upgrade, downgrade, or cancel anytime.`
              : "Pick a role from your account to see plans built for it."}
          </p>
        </div>
      </section>

      <div className="container py-12">
        {error && (
          <div className="mx-auto mb-8 max-w-lg rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-center text-sm text-danger">
            {error}
          </div>
        )}

        {subscription && subscription.status === "active" && (
          <div className="mx-auto mb-8 flex max-w-lg items-center justify-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-center text-[13px] text-primary">
            <ShieldCheck className="h-4 w-4 shrink-0" /> You're currently on the{" "}
            <span className="font-bold capitalize">{subscription.plan}</span> plan for {ROLE_LABELS[subscription.role]}.
          </div>
        )}

        {!role ? (
          <div className="mx-auto max-w-lg rounded-xl border border-neutral-200 bg-white p-6 text-center text-sm text-neutral-600">
            {user ? (
              <>
                You haven't picked a role yet.{" "}
                <Link to="/dashboard/explore" className="font-semibold text-primary hover:underline">
                  Choose one
                </Link>{" "}
                to see plans built for it.
              </>
            ) : (
              <>
                <Link to="/login" className="font-semibold text-primary hover:underline">
                  Log in
                </Link>{" "}
                to see plans for your role.
              </>
            )}
          </div>
        ) : plansLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-3">
            {plans?.map((plan) => {
              const isPopular = plan.tier === "pro";
              return (
                <div
                  key={plan._id}
                  className={cn(
                    "group relative flex flex-col rounded-[22px] border bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-all duration-300 hover:-translate-y-1",
                    isPopular
                      ? "border-primary/30 shadow-[0_20px_44px_-20px_rgba(255,87,34,0.35)]"
                      : "border-neutral-200 hover:border-primary/25 hover:shadow-[0_20px_40px_-18px_rgba(255,87,34,0.2)]"
                  )}
                >
                  {isPopular && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-br from-primary to-secondary px-3 py-1 text-[10.5px] font-bold text-white shadow-[0_8px_18px_-8px_rgba(255,87,34,0.7)]">
                      Most Popular
                    </span>
                  )}
                  <h3 className="text-[15px] font-bold text-neutral-900">{plan.name}</h3>
                  <p className="mt-2 flex items-baseline gap-1">
                    <span className="text-[30px] font-extrabold tabular-nums tracking-tight text-neutral-900">
                      {formatCurrency(plan.priceInInr)}
                    </span>
                    {plan.priceInInr > 0 && <span className="text-[12.5px] text-neutral-400">/month</span>}
                  </p>
                  <ul className="my-6 flex-1 space-y-2.5">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2 text-[12.5px] text-neutral-600">
                        <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" /> {feature}
                      </li>
                    ))}
                  </ul>
                  {plan.priceInInr === 0 ? (
                    <Button variant="outline" disabled className="w-full rounded-xl">
                      Current Default
                    </Button>
                  ) : (
                    <div className="space-y-2">
                      <Button
                        className={cn(
                          "w-full rounded-xl",
                          isPopular && "bg-gradient-to-br from-primary to-secondary text-white hover:opacity-90"
                        )}
                        variant={isPopular ? "default" : "outline"}
                        disabled={loadingTier === plan.tier}
                        onClick={() => handleRazorpay(plan.tier)}
                      >
                        {loadingTier === plan.tier && <Loader2 className="h-4 w-4 animate-spin" />}
                        Pay with Razorpay
                      </Button>
                      <Button variant="ghost" className="w-full rounded-xl" disabled={loadingTier === plan.tier} onClick={() => handleStripe(plan.tier)}>
                        Pay with Stripe
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <p className="mx-auto mt-8 max-w-lg text-center text-xs text-neutral-400">
          Payments require the platform operator to configure Razorpay/Stripe API keys. If a gateway isn't configured yet, checkout will show an
          error instead of charging you.
        </p>

        <div className="mx-auto mt-4 flex max-w-lg items-center justify-center gap-1.5 text-[13px] text-neutral-500">
          <HelpCircle className="h-4 w-4 shrink-0 text-neutral-400" />
          Have questions?{" "}
          <Link to="/#faq" className="font-semibold text-primary hover:underline">
            Check our FAQ
          </Link>
        </div>
      </div>
    </div>
  );
}
