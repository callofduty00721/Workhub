import { api } from "./axios";
import type { Investment, InvestmentStatus } from "@/types";

export const investmentApi = {
  list: (startupId: string) =>
    api.get<{ success: boolean; data: Investment[] }>(`/startups/${startupId}/investments`).then((r) => r.data.data),

  create: (startupId: string, payload: { amount: number; note?: string }) =>
    api
      .post<{ success: boolean; data: Investment }>(`/startups/${startupId}/investments`, payload)
      .then((r) => r.data.data),

  updateStatus: (investmentId: string, status: InvestmentStatus) =>
    api
      .put<{ success: boolean; data: Investment }>(`/investments/${investmentId}/status`, { status })
      .then((r) => r.data.data),

  createVerificationOrder: (investmentId: string) =>
    api
      .post<{ success: boolean; data: { orderId: string; amount: number; currency: string; keyId: string } }>(
        `/investments/${investmentId}/verify/order`
      )
      .then((r) => r.data.data),

  confirmVerificationPayment: (
    investmentId: string,
    payload: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }
  ) => api.post<{ success: boolean; data: Investment }>(`/investments/${investmentId}/verify/confirm`, payload).then((r) => r.data.data),

  createPreVerificationOrder: (startupId: string, amount: number) =>
    api
      .post<{ success: boolean; data: { orderId: string; amount: number; currency: string; keyId: string } }>(
        `/startups/${startupId}/investments/verify-order`,
        { amount }
      )
      .then((r) => r.data.data),

  createVerified: (
    startupId: string,
    payload: {
      amount: number;
      note?: string;
      razorpay_order_id: string;
      razorpay_payment_id: string;
      razorpay_signature: string;
    }
  ) => api.post<{ success: boolean; data: Investment }>(`/startups/${startupId}/investments/verified`, payload).then((r) => r.data.data),
};
