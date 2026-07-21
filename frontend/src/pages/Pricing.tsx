import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { Check, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { paymentApi } from "@/api/payments";
import { useAuth } from "@/context/AuthContext";
import { formatCurrency } from "@/lib/utils";
import { loadRazorpayScript } from "@/lib/razorpay";
import type { Plan, PlanId } from "@/types";

const PLANS: Plan[] = [
  { id: "free", name: "Free", priceInInr: 0, features: ["1 startup listing", "Basic profile", "Community access"] },
  { id: "starter", name: "Starter", priceInInr: 499, features: ["3 startup listings", "Priority visibility", "5 gig listings", "Basic analytics"] },
  {
    id: "professional",
    name: "Professional",
    priceInInr: 1499,
    features: ["Unlimited listings", "Featured placement", "Unlimited gigs", "Advanced analytics", "Priority support"],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    priceInInr: 4999,
    features: ["Everything in Professional", "Dedicated account manager", "Custom integrations", "SLA support"],
  },
];

export default function Pricing() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loadingPlan, setLoadingPlan] = useState<PlanId | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data: subscription } = useQuery({ queryKey: ["payments", "subscription"], queryFn: paymentApi.mySubscription, enabled: !!user });

  const handleRazorpay = async (planId: PlanId) => {
    if (!user) return navigate("/login");
    setError(null);
    setLoadingPlan(planId);
    try {
      await loadRazorpayScript();
      const order = await paymentApi.createRazorpayOrder(planId);

      const razorpay = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        order_id: order.orderId,
        name: "MahaHub",
        description: `${planId} plan subscription`,
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
      setLoadingPlan(null);
    }
  };

  const handleStripe = async (planId: PlanId) => {
    if (!user) return navigate("/login");
    setError(null);
    setLoadingPlan(planId);
    try {
      const { checkoutUrl } = await paymentApi.createStripeCheckout(planId);
      window.location.href = checkoutUrl;
    } catch (err) {
      setError(isAxiosError(err) ? err.response?.data?.message || "Payment failed" : "Payment gateway unavailable");
      setLoadingPlan(null);
    }
  };

  return (
    <div className="container py-16">
      <div className="mx-auto mb-12 max-w-xl text-center">
        <Badge variant="secondary" className="mb-3">Pricing</Badge>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Simple, transparent pricing</h1>
        <p className="mt-3 text-muted-foreground">Choose the plan that fits where you are in your journey.</p>
      </div>

      {error && (
        <div className="mx-auto mb-8 max-w-lg rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-center text-sm text-danger">{error}</div>
      )}

      {subscription && subscription.status === "active" && (
        <div className="mx-auto mb-8 max-w-lg rounded-lg border border-success/30 bg-success/10 px-4 py-3 text-center text-sm text-success">
          You're currently on the <span className="font-semibold capitalize">{subscription.plan}</span> plan.
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-4">
        {PLANS.map((plan) => (
          <Card key={plan.id} className={plan.id === "professional" ? "border-primary shadow-glow" : ""}>
            <CardContent className="flex h-full flex-col p-6">
              {plan.id === "professional" && <Badge className="mb-3 w-fit">Most Popular</Badge>}
              <h3 className="text-lg font-semibold">{plan.name}</h3>
              <p className="mt-2">
                <span className="text-3xl font-bold">{formatCurrency(plan.priceInInr)}</span>
                {plan.priceInInr > 0 && <span className="text-sm text-muted-foreground">/month</span>}
              </p>
              <ul className="my-6 flex-1 space-y-2.5">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" /> {feature}
                  </li>
                ))}
              </ul>
              {plan.priceInInr === 0 ? (
                <Button variant="outline" disabled className="w-full">
                  Current Default
                </Button>
              ) : (
                <div className="space-y-2">
                  <Button
                    variant={plan.id === "professional" ? "gradient" : "outline"}
                    className="w-full"
                    disabled={loadingPlan === plan.id}
                    onClick={() => handleRazorpay(plan.id)}
                  >
                    {loadingPlan === plan.id && <Loader2 className="h-4 w-4 animate-spin" />}
                    Pay with Razorpay
                  </Button>
                  <Button variant="ghost" className="w-full" disabled={loadingPlan === plan.id} onClick={() => handleStripe(plan.id)}>
                    Pay with Stripe
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <p className="mx-auto mt-8 max-w-lg text-center text-xs text-muted-foreground">
        Payments require the platform operator to configure Razorpay/Stripe API keys. If a gateway isn't configured yet, checkout will show an
        error instead of charging you.
      </p>
    </div>
  );
}
