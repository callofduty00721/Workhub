import { api } from "./axios";
import type { PlanRole, PlanTier, BillingCycle, Subscription, Payment, EarningsSummary, Paginated, Withdrawal, WithdrawalMethod, PackageName, Deliverable } from "@/types";

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

export interface SubscriptionHistoryFilters {
  page?: number;
  limit?: number;
}

export type SubscriptionWithUser = Subscription & { user: { _id: string; name: string; email: string } };

export const paymentApi = {
  createRazorpayOrder: (role: PlanRole, tier: PlanTier, billingCycle: BillingCycle = "monthly") =>
    api
      .post<{ success: boolean; data: { orderId: string; amount: number; currency: string; keyId: string; subscriptionId: string } }>(
        "/payments/razorpay/order",
        { role, tier, billingCycle }
      )
      .then((r) => r.data.data),

  verifyRazorpayPayment: (payload: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) =>
    api.post<{ success: boolean; data: Subscription }>("/payments/razorpay/verify", payload).then((r) => r.data.data),

  createStripeCheckout: (role: PlanRole, tier: PlanTier, billingCycle: BillingCycle = "monthly") =>
    api
      .post<{ success: boolean; data: { checkoutUrl: string } }>("/payments/stripe/checkout", { role, tier, billingCycle })
      .then((r) => r.data.data),

  mySubscription: () => api.get<{ success: boolean; data: Subscription | null }>("/payments/subscription").then((r) => r.data.data),

  createGigOrderPayment: (
    serviceId: string,
    payload: { packageName?: PackageName; extras?: { label: string; quantity: number }[] } = {}
  ) => api.post<{ success: boolean; data: RazorpayOrderResponse }>(`/payments/gig-order/${serviceId}`, payload).then((r) => r.data.data),

  createJobHirePayment: (applicationId: string) =>
    api.post<{ success: boolean; data: RazorpayOrderResponse }>(`/payments/job-hire/${applicationId}`).then((r) => r.data.data),

  createCampaignPayment: (applicationId: string) =>
    api.post<{ success: boolean; data: RazorpayOrderResponse }>(`/payments/campaign/${applicationId}`).then((r) => r.data.data),

  // The deal amount itself is settled directly between brand and influencer,
  // outside GrowHive — this only charges the platform's facilitation fee.
  createOffPlatformFacilitationPayment: (applicationId: string) =>
    api.post<{ success: boolean; data: RazorpayOrderResponse }>(`/payments/campaign-offplatform/${applicationId}`).then((r) => r.data.data),

  createMilestonePayment: (milestoneId: string) =>
    api.post<{ success: boolean; data: RazorpayOrderResponse }>(`/payments/milestone/${milestoneId}`).then((r) => r.data.data),

  createHourlyPayment: (applicationId: string, timeEntryIds: string[]) =>
    api
      .post<{ success: boolean; data: RazorpayOrderResponse }>(`/payments/hourly/${applicationId}`, { timeEntryIds })
      .then((r) => r.data.data),

  createContestPrizePayment: (contestId: string, entryId: string) =>
    api
      .post<{ success: boolean; data: RazorpayOrderResponse }>(`/payments/contest-prize/${contestId}/${entryId}`)
      .then((r) => r.data.data),

  verifyMarketplacePayment: (payload: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) =>
    api.post<{ success: boolean; data: Payment }>("/payments/marketplace/verify", payload).then((r) => r.data.data),

  getById: (paymentId: string) => api.get<{ success: boolean; data: Payment }>(`/payments/${paymentId}`).then((r) => r.data.data),

  downloadInvoice: async (paymentId: string) => {
    const res = await api.get(`/payments/${paymentId}/invoice`, { responseType: "blob" });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement("a");
    link.href = url;
    link.download = `invoice-${paymentId}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  mySubscriptions: (filters: SubscriptionHistoryFilters = {}) =>
    api.get<Paginated<Subscription>>("/payments/subscriptions/mine", { params: filters }).then((r) => r.data),

  getSubscriptionById: (id: string) =>
    api.get<{ success: boolean; data: SubscriptionWithUser }>(`/payments/subscriptions/${id}`).then((r) => r.data.data),

  downloadSubscriptionInvoice: async (subscriptionId: string) => {
    const res = await api.get(`/payments/subscriptions/${subscriptionId}/invoice`, { responseType: "blob" });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement("a");
    link.href = url;
    link.download = `invoice-${subscriptionId}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  emailSubscriptionInvoice: (subscriptionId: string) =>
    api.post<{ success: boolean; message: string }>(`/payments/subscriptions/${subscriptionId}/invoice/email`).then((r) => r.data),

  myEarnings: (filters: PaymentHistoryFilters = {}) =>
    api.get<{ success: boolean; data: EarningsSummary }>("/payments/earnings/mine", { params: filters }).then((r) => r.data.data),

  myPayments: (filters: PaymentHistoryFilters = {}) =>
    api.get<MyPaymentsResponse>("/payments/mine", { params: filters }).then((r) => r.data),

  raiseDispute: (paymentId: string, reason: string) =>
    api.post<{ success: boolean; data: Payment }>(`/payments/${paymentId}/dispute`, { reason }).then((r) => r.data.data),

  releasePayment: (paymentId: string) =>
    api.put<{ success: boolean; data: Payment }>(`/payments/${paymentId}/release`).then((r) => r.data.data),

  deliverWork: (paymentId: string, payload: { deliverables: Deliverable[]; note?: string }) =>
    api.put<{ success: boolean; data: Payment }>(`/payments/${paymentId}/deliver`, payload).then((r) => r.data.data),

  acceptDelivery: (paymentId: string) =>
    api.put<{ success: boolean; data: Payment }>(`/payments/${paymentId}/accept-delivery`).then((r) => r.data.data),

  requestRevision: (paymentId: string, reason: string) =>
    api.put<{ success: boolean; data: Payment }>(`/payments/${paymentId}/request-revision`, { reason }).then((r) => r.data.data),

  requestExtension: (paymentId: string, payload: { proposedDeadline: string; reason?: string }) =>
    api.put<{ success: boolean; data: Payment }>(`/payments/${paymentId}/request-extension`, payload).then((r) => r.data.data),

  respondExtension: (paymentId: string, action: "approve" | "reject") =>
    api.put<{ success: boolean; data: Payment }>(`/payments/${paymentId}/respond-extension`, { action }).then((r) => r.data.data),

  requestWithdrawal: (payload: {
    amount: number;
    method: WithdrawalMethod;
    upiId?: string;
    bankAccountNumber?: string;
    bankIfsc?: string;
    bankAccountHolder?: string;
  }) => api.post<{ success: boolean; data: Withdrawal }>("/payments/withdrawals", payload).then((r) => r.data.data),

  myWithdrawals: () => api.get<{ success: boolean; data: Withdrawal[] }>("/payments/withdrawals/mine").then((r) => r.data.data),
};
