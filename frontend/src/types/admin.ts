import type { UserRole } from "./user";
import type { VerificationRequestType, VerificationRequestDoc } from "./startup";

export interface AdminStats {
  totalUsers: number;
  totalStartups: number;
  totalJobs: number;
  totalServices: number;
  totalContests: number;
  roleBreakdown: Record<UserRole, number>;
}

export interface FlaggedStartup {
  startupId: string;
  name: string;
  founder: { _id: string; name: string; email: string } | null;
  status?: string;
  isSuspended?: boolean;
  reportCount: number;
  reports: { user: { _id: string; name: string; email: string }; reason: string; createdAt: string }[];
  autoFlagged: boolean;
  autoReason: string | null;
  autoCount?: number;
}

export interface AdminVerificationRequest {
  _id: string;
  startupId: string;
  startupName: string;
  founder: { _id: string; name: string; avatar?: string; email: string } | null;
  type: VerificationRequestType;
  documents: VerificationRequestDoc[];
  note?: string;
  submittedAt: string;
}
