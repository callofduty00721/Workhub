import { z } from "zod";
import { PLAN_ROLES, PLAN_TIERS } from "./plan.model.js";

// price/plan lookup (resolvePaidPlan) still runs server-side against these —
// this only makes sure role/tier/billingCycle are genuinely one of the real
// enum values before that lookup, instead of a free-form string that could
// only fail deep inside a DB query with a generic "Invalid plan selected".
export const checkoutSchema = z
  .object({
    role: z.enum(PLAN_ROLES),
    tier: z.enum(PLAN_TIERS),
    billingCycle: z.enum(["monthly", "yearly"]).optional(),
  })
  .strict();

const razorpayOrderId = z.string().trim().min(1).max(64);
const razorpayPaymentId = z.string().trim().min(1).max(64);
const razorpaySignature = z.string().trim().min(1).max(256);

export const verifyRazorpayPaymentSchema = z
  .object({
    razorpay_order_id: razorpayOrderId,
    razorpay_payment_id: razorpayPaymentId,
    razorpay_signature: razorpaySignature,
  })
  .strict();
