export type PlanTier = "free" | "pro" | "enterprise";
export type BillingCycle = "monthly" | "yearly";

// The 9 roles that have their own plan matrix — mirrors PLAN_ROLES in
// backend/src/modules/finance/plan.model.js.
export type PlanRole =
  | "founder"
  | "freelancer"
  | "job_seeker"
  | "influencer"
  | "employer"
  | "investor"
  | "mentor"
  | "partner"
  | "client";

export interface Plan {
  _id: string;
  role: PlanRole;
  tier: PlanTier;
  name: string;
  priceInInr: number;
  priceInInrYearly: number;
  features: string[];
  // Enforced cap on active listings this plan allows — -1 means unlimited.
  // Only meaningful for founder/employer/client; stays -1 for other roles.
  maxListings: number;
}

export interface Subscription {
  _id: string;
  role: PlanRole;
  plan: PlanTier;
  billingCycle: BillingCycle;
  provider: "razorpay" | "stripe";
  providerPaymentId?: string;
  status: "pending" | "active" | "failed" | "cancelled" | "expired";
  amount: number;
  currency: string;
  startedAt?: string;
  expiresAt?: string;
  createdAt: string;
}
