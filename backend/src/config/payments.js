import Razorpay from "razorpay";
import Stripe from "stripe";

export const isRazorpayConfigured = () => Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
export const isStripeConfigured = () => Boolean(process.env.STRIPE_SECRET_KEY);
// RazorpayX Payouts uses the same API key pair as regular Razorpay, plus a
// RazorpayX current account number to pay out from.
export const isRazorpayXConfigured = () => isRazorpayConfigured() && Boolean(process.env.RAZORPAYX_ACCOUNT_NUMBER);

export const getRazorpayClient = () =>
  isRazorpayConfigured()
    ? new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET })
    : null;

export const getStripeClient = () => (isStripeConfigured() ? new Stripe(process.env.STRIPE_SECRET_KEY) : null);
