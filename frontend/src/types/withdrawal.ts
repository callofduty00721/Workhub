export type WithdrawalMethod = "upi" | "bank";
export type WithdrawalStatus = "pending" | "completed" | "rejected";

export interface Withdrawal {
  _id: string;
  freelancer: { _id: string; name: string; avatar?: string; email?: string } | string;
  amount: number;
  method: WithdrawalMethod;
  upiId?: string;
  bankAccountNumber?: string;
  bankIfsc?: string;
  bankAccountHolder?: string;
  status: WithdrawalStatus;
  provider?: "manual" | "razorpayx";
  providerPayoutId?: string;
  adminNote?: string;
  processedAt?: string;
  createdAt: string;
}
