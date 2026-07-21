export const PLANS = {
  free: { id: "free", name: "Free", priceInInr: 0, features: ["1 startup listing", "Basic profile", "Community access"] },
  starter: {
    id: "starter",
    name: "Starter",
    priceInInr: 499,
    features: ["3 startup listings", "Priority visibility", "5 gig listings", "Basic analytics"],
  },
  professional: {
    id: "professional",
    name: "Professional",
    priceInInr: 1499,
    features: ["Unlimited listings", "Featured placement", "Unlimited gigs", "Advanced analytics", "Priority support"],
  },
  enterprise: {
    id: "enterprise",
    name: "Enterprise",
    priceInInr: 4999,
    features: ["Everything in Professional", "Dedicated account manager", "Custom integrations", "SLA support"],
  },
};

export const getPlan = (planId) => PLANS[planId];
