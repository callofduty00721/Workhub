import { api } from "./axios";
import type { PlanId, Subscription, Payment, EarningsSummary, Paginated } from "@/types";

export interface PaymentHistoryFilters {
  page?: number;
  limit?: number;
}

export interface MyPaymentsResponse extends Paginated<Payment> {
  totalSpent: number;
}

export interface RazorpayOrderResponse {
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
  paymentId: string;
}

export const paymentApi = {
  createRazorpayOrder: (planId: PlanId) =>
    api
      .post<{ success: boolean; data: { orderId: string; amount: number; currency: string; keyId: string; subscriptionId: string } }>(
        "/payments/razorpay/order",
        { planId }
      )
      .then((r) => r.data.data),

  verifyRazorpayPayment: (payload: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) =>
    api.post<{ success: boolean; data: Subscription }>("/payments/razorpay/verify", payload).then((r) => r.data.data),

  createStripeCheckout: (planId: PlanId) =>
    api.post<{ success: boolean; data: { checkoutUrl: string } }>("/payments/stripe/checkout", { planId }).then((r) => r.data.data),

  mySubscription: () => api.get<{ success: boolean; data: Subscription | null }>("/payments/subscription").then((r) => r.data.data),

  createGigOrderPayment: (serviceId: string) =>
    api.post<{ success: boolean; data: RazorpayOrderResponse }>(`/payments/gig-order/${serviceId}`).then((r) => r.data.data),

  createJobHirePayment: (applicationId: string) =>
    api.post<{ success: boolean; data: RazorpayOrderResponse }>(`/payments/job-hire/${applicationId}`).then((r) => r.data.data),

  createContestPrizePayment: (contestId: string, entryId: string) =>
    api
      .post<{ success: boolean; data: RazorpayOrderResponse }>(`/payments/contest-prize/${contestId}/${entryId}`)
      .then((r) => r.data.data),

  verifyMarketplacePayment: (payload: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) =>
    api.post<{ success: boolean; data: Payment }>("/payments/marketplace/verify", payload).then((r) => r.data.data),

  myEarnings: (filters: PaymentHistoryFilters = {}) =>
    api.get<{ success: boolean; data: EarningsSummary }>("/payments/earnings/mine", { params: filters }).then((r) => r.data.data),

  myPayments: (filters: PaymentHistoryFilters = {}) =>
    api.get<MyPaymentsResponse>("/payments/mine", { params: filters }).then((r) => r.data),

  raiseDispute: (paymentId: string, reason: string) =>
    api.post<{ success: boolean; data: Payment }>(`/payments/${paymentId}/dispute`, { reason }).then((r) => r.data.data),
};
