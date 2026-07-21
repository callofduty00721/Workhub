import Razorpay from "razorpay";
import Stripe from "stripe";

export const isRazorpayConfigured = () => Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
export const isStripeConfigured = () => Boolean(process.env.STRIPE_SECRET_KEY);

export const getRazorpayClient = () =>
  isRazorpayConfigured()
    ? new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET })
    : null;

export const getStripeClient = () => (isStripeConfigured() ? new Stripe(process.env.STRIPE_SECRET_KEY) : null);
