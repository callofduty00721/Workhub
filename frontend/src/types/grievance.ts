export type GrievanceStatus = "open" | "acknowledged" | "resolved";

export interface Grievance {
  _id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: GrievanceStatus;
  acknowledgedAt?: string;
  resolvedAt?: string;
  adminNote?: string;
  resolvedBy?: { _id: string; name: string } | string;
  createdAt: string;
}
