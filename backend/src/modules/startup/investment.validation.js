import { z } from "zod";

// Financial fields — must genuinely be a number, not just "truthy" (the old
// `if (!amount || amount <= 0)` check let a non-numeric string like "100abc"
// through as long as it was non-empty, which then hit Mongoose's Number cast
// and 500'd instead of a clean 400). Razorpay's order/payment ids and the
// HMAC signature are always fixed-shape strings — bounding their length
// stops absurdly oversized values from ever reaching the crypto compare.
const razorpayOrderId = z.string().trim().min(1).max(64);
const razorpayPaymentId = z.string().trim().min(1).max(64);
const razorpaySignature = z.string().trim().min(1).max(256);
const investmentAmount = z.number().positive().max(1_000_000_000);
const investmentNote = z.string().max(2000).optional();

export const createInvestmentSchema = z.object({ amount: investmentAmount, note: investmentNote }).strict();

export const createPreInvestmentVerificationOrderSchema = z.object({ amount: investmentAmount, note: investmentNote }).strict();

export const updateInvestmentStatusSchema = z.object({ status: z.enum(["pending", "confirmed", "declined"]) }).strict();

export const verifyVerificationPaymentSchema = z
  .object({
    razorpay_order_id: razorpayOrderId,
    razorpay_payment_id: razorpayPaymentId,
    razorpay_signature: razorpaySignature,
  })
  .strict();

export const createVerifiedInvestmentSchema = z
  .object({
    amount: investmentAmount,
    note: investmentNote,
    razorpay_order_id: razorpayOrderId,
    razorpay_payment_id: razorpayPaymentId,
    razorpay_signature: razorpaySignature,
  })
  .strict();
