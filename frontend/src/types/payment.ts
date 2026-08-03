import type { PackageName } from "./service";

export type PaymentType = "gig_order" | "job_hire" | "contest_prize" | "campaign";

export type DisputeStatus = "none" | "raised" | "refunded" | "rejected";

export type OrderStatus = "not_applicable" | "in_progress" | "delivered" | "revision_requested" | "completed";

export interface Deliverable {
  url: string;
  name?: string;
}

export interface ExtensionRequest {
  requestedBy: string;
  proposedDeadline: string;
  reason?: string;
  status: "none" | "pending" | "approved" | "rejected";
}

export interface Payment {
  _id: string;
  payer: { _id: string; name: string; avatar?: string; email?: string; companyName?: string } | string;
  payee: { _id: string; name: string; avatar?: string; email?: string } | string;
  type: PaymentType;
  amount: number;
  commissionPercent?: number;
  commissionAmount?: number;
  netAmount?: number;
  currency: string;
  status: "pending" | "paid" | "failed" | "refunded" | "partially_refunded";
  providerPaymentId?: string;
  escrowStatus?: "held" | "released";
  releasedAt?: string;
  refundedAmount?: number;
  disputeStatus?: DisputeStatus;
  disputeReason?: string;
  disputeResolutionNote?: string;
  disputeRaisedAt?: string;
  disputeEscalated?: boolean;
  service?: string;
  servicePackage?: { name: PackageName; title?: string; price: number; deliveryDays: number; revisions?: number };
  application?: string;
  milestone?: string;
  contest?: string;
  contestEntry?: string;
  note?: string;
  orderStatus?: OrderStatus;
  deadline?: string;
  deliverables?: Deliverable[];
  deliveryNote?: string;
  deliveredAt?: string;
  revisionsAllowed?: number;
  revisionsUsed?: number;
  revisionRequestReason?: string;
  extensionRequest?: ExtensionRequest;
  createdAt: string;
}

export interface WalletSummary {
  heldAmount: number;
  releasedAmount: number;
  withdrawnTotal: number;
  pendingWithdrawal: number;
  availableBalance: number;
}

export interface EarningsSummary {
  totalEarnings: number;
  byType: Partial<Record<PaymentType, number>>;
  wallet: WalletSummary;
  payments: Payment[];
  pagination: { page: number; limit: number; total: number; pages: number };
}
